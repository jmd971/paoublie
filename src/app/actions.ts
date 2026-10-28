"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { looksLikeSpam, visitorKey } from "@/lib/abuse";
import { invitationUrl, normalizeCode, siteUrl } from "@/lib/codes";
import { isDemo, repo } from "@/lib/repo";
import { DEMO_ROLE_COOKIE, getViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { MediaKind, UploadTarget, Viewer } from "@/lib/types";
import { checkUpload } from "@/lib/uploads";

export type FormState = { ok?: boolean; error?: string; message?: string };

/** Champ vide d'un formulaire → undefined, pour que les champs facultatifs le restent. */
function formObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v]),
  );
}

async function familyViewer(): Promise<Extract<Viewer, { kind: "family" }>> {
  const viewer = await getViewer();
  if (viewer.kind !== "family") throw new Error("Connectez-vous avec votre compte famille.");
  return viewer;
}

const errorMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// --- Session ------------------------------------------------------------------

export async function setDemoRole(formData: FormData) {
  if (!isDemo) redirect("/connexion");
  const asked = String(formData.get("role"));
  const role = ["family", "family2", "distributor"].includes(asked) ? asked : "family";
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : role === "distributor" ? "/pro" : "/espace");
}

export async function signOut() {
  if (isDemo) {
    (await cookies()).delete(DEMO_ROLE_COOKIE);
  } else {
    await (await supabaseServer()).auth.signOut();
  }
  redirect("/");
}

export async function signInWithEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Indiquez une adresse e-mail valide." };
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (!(await repo.allow("connexion", await visitorKey("connexion"), 5, 3600))) {
    return { error: "Trop de demandes. Réessayez dans une heure." };
  }
  const { error } = await (await supabaseServer()).auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}` },
  });
  if (error) return { error: "L’e-mail n’a pas pu être envoyé. Réessayez dans quelques minutes." };
  return { ok: true, message: `Un lien de connexion vient d’être envoyé à ${email.data}.` };
}

// --- Gestes des visiteurs --------------------------------------------------------

type Gesture = { count: number; limited: boolean };

async function gesture(kind: "bougie" | "fleur", memorialId: string, path: string): Promise<Gesture> {
  // Une bougie et une fleur par visiteur, par défunt et par jour.
  if (!(await repo.allow(kind, await visitorKey(`${kind}:${memorialId}`), 1, 86_400))) {
    const c = await repo.getCounters(memorialId);
    return { count: kind === "bougie" ? c.candles : c.flowers, limited: true };
  }
  const count = kind === "bougie" ? await repo.lightCandle(memorialId) : await repo.dropFlower(memorialId);
  revalidatePath(path);
  return { count, limited: false };
}

export async function lightCandle(memorialId: string, path: string): Promise<Gesture> {
  return gesture("bougie", memorialId, path);
}

export async function dropFlower(memorialId: string, path: string): Promise<Gesture> {
  return gesture("fleur", memorialId, path);
}

const messageSchema = z.object({
  memorialId: z.string().min(1),
  authorName: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  authorPlace: z.string().trim().max(80).optional(),
  body: z.string().trim().min(1, "Écrivez votre message.").max(1500, "Le message est trop long (1 500 caractères au plus)."),
  consent: z.literal("on", { message: "Cochez la case pour accepter que la famille lise et publie votre message." }),
});

export async function submitMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  // Pièges à robots : un champ invisible qui doit rester vide, et un délai minimal de saisie.
  const startedAt = Number(formData.get("startedAt"));
  const tooFast = !startedAt || Date.now() - startedAt < 3000;
  if (formData.get("website") || tooFast) return { ok: true, message: "Merci. Votre message a été transmis à la famille." };

  const parsed = messageSchema.safeParse(formObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Message incomplet." };
  if (looksLikeSpam(parsed.data.body)) return { error: "Les liens vers d’autres sites ne sont pas acceptés dans le livre d’or." };
  if (!(await repo.allow("message", await visitorKey("message"), 5, 3600))) {
    return { error: "Vous avez déjà envoyé plusieurs messages. Réessayez un peu plus tard." };
  }
  await repo.submitMessage(parsed.data.memorialId, parsed.data);
  return { ok: true, message: "Merci. Votre message apparaîtra dès que la famille l’aura validé." };
}

// --- Famille : modération et création ------------------------------------------

export async function moderateMessage(formData: FormData) {
  const viewer = await getViewer();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "published" ? "published" : "private";
  await repo.moderateMessage(viewer, id, status);
  revalidatePath("/espace");
  revalidatePath("/m", "layout");
}

const gender = z.enum(["f", "m"]).optional();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .optional();

const memorialSchema = z.object({
  code: z.string().optional(),
  firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez le nom.").max(60),
  nickname: z.string().trim().max(60).optional(),
  gender,
  birthDate: isoDate,
  deathDate: isoDate,
  commune: z.string().trim().min(1, "Indiquez la commune.").max(60),
  cemetery: z.string().trim().min(1, "Indiquez le cimetière.").max(120),
  locationLabel: z.string().trim().max(80).optional(),
  story: z.string().trim().max(5000).optional(),
  formula: z.enum(["essentiel", "memoire", "heritage"]),
  visibility: z.enum(["public", "family"]),
});

export async function createMemorial(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (viewer.kind === "anonymous") return { error: "Connectez-vous pour créer un mémorial." };
  const parsed = memorialSchema.safeParse(formObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  let code: string | undefined;
  if (parsed.data.code) {
    const normalized = normalizeCode(parsed.data.code);
    if (!normalized) return { error: "Le code de plaque doit contenir 5 à 8 lettres ou chiffres." };
    code = normalized;
  }
  let tombId: string;
  try {
    ({ tombId } = await repo.createMemorial(viewer, { ...parsed.data, code }));
  } catch (e) {
    return { error: errorMessage(e, "Le mémorial n’a pas pu être créé.") };
  }
  if (viewer.kind === "distributor") {
    revalidatePath("/pro");
    redirect(`/pro/tombe/${tombId}?nouveau=1`);
  }
  revalidatePath("/espace");
  redirect(`/espace/tombe/${tombId}?nouveau=1`);
}

const extraSchema = z.object({
  tombId: z.string().min(1),
  firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez le nom.").max(60),
  nickname: z.string().trim().max(60).optional(),
  gender,
  relation: z.string().trim().max(60).optional(),
  birthDate: isoDate,
  deathDate: isoDate,
});

export async function addMemorialToTomb(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = extraSchema.safeParse(formObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  const { tombId, ...input } = parsed.data;
  let id: string;
  try {
    ({ id } = await repo.addMemorialToTomb(await familyViewer(), tombId, input));
  } catch (e) {
    return { error: errorMessage(e, "Le défunt n’a pas pu être ajouté.") };
  }
  revalidatePath(`/espace/tombe/${tombId}`);
  redirect(`/espace/tombe/${tombId}/${id}`);
}

// --- Famille : contenu de la page ------------------------------------------------

const patchSchema = z.object({
  memorialId: z.string().min(1),
  tombId: z.string().min(1),
  firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez le nom.").max(60),
  nickname: z.string().trim().max(60).optional(),
  gender,
  relation: z.string().trim().max(60).optional(),
  birthDate: isoDate,
  deathDate: isoDate,
  birthPlace: z.string().trim().max(60).optional(),
  quote: z.string().trim().max(200).optional(),
  quoteTranslation: z.string().trim().max(300).optional(),
  chapters: z
    .array(
      z.object({
        years: z.string().trim().max(30),
        title: z.string().trim().max(100),
        text: z.string().trim().max(5000),
        // Conservés tels quels : légende et image déjà associées au chapitre.
        caption: z.string().max(200).optional(),
        image: z.string().max(2000).optional(),
      }),
    )
    .max(30),
  loves: z.array(z.object({ title: z.string().trim().max(100), text: z.string().trim().max(1000) })).max(20),
});

export async function updateMemorial(_prev: FormState, formData: FormData): Promise<FormState> {
  let lists: { chapters: unknown; loves: unknown };
  try {
    lists = { chapters: JSON.parse(String(formData.get("chapters") ?? "[]")), loves: JSON.parse(String(formData.get("loves") ?? "[]")) };
  } catch {
    return { error: "Le formulaire est incomplet. Rechargez la page." };
  }
  const parsed = patchSchema.safeParse({ ...formObject(formData), ...lists });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  const { memorialId, tombId, ...patch } = parsed.data;
  try {
    await repo.updateMemorial(await familyViewer(), memorialId, {
      ...patch,
      chapters: patch.chapters.filter((c) => c.title || c.text),
      loves: patch.loves.filter((l) => l.title || l.text),
    });
  } catch (e) {
    return { error: errorMessage(e, "Les modifications n’ont pas pu être enregistrées.") };
  }
  revalidatePath(`/espace/tombe/${tombId}`, "layout");
  revalidatePath("/m", "layout");
  return { ok: true, message: "Modifications enregistrées." };
}

// --- Famille : photos, vidéos, voix -----------------------------------------------

const kindSchema = z.enum(["photo", "video", "audio"]);

/** Étape 1 de l'envoi : vérifie le fichier et donne où l'envoyer. */
export async function prepareUpload(
  memorialId: string,
  kind: MediaKind,
  file: { type: string; name: string; size: number },
): Promise<{ error: string } | { target: UploadTarget & { path?: string }; type: string }> {
  try {
    const k = kindSchema.parse(kind);
    const check = checkUpload(k, file.type, file.name, file.size);
    if (!check.ok) return { error: check.error };
    const target = await repo.prepareUpload(await familyViewer(), memorialId, check.ext);
    return { target, type: check.type };
  } catch (e) {
    return { error: errorMessage(e, "L’envoi n’a pas pu commencer.") };
  }
}

/** Étape 2 : enregistre le fichier envoyé (ou, en démonstration, le reçoit directement). */
export async function saveMedia(formData: FormData): Promise<FormState> {
  try {
    const viewer = await familyViewer();
    const memorialId = String(formData.get("memorialId"));
    const kind = kindSchema.parse(formData.get("kind"));
    const purpose = formData.get("purpose") === "portrait" ? "portrait" : "media";
    const caption = String(formData.get("caption") ?? "").trim().slice(0, 200);
    const album = String(formData.get("album") ?? "").trim().slice(0, 60) || undefined;
    const path = formData.get("path");
    const file = formData.get("file");

    let url: string;
    let storagePath: string | undefined;
    if (typeof path === "string" && path) {
      storagePath = path;
      url = repo.publicUrl(path);
    } else if (isDemo && file instanceof File) {
      const check = checkUpload(kind, file.type, file.name, file.size);
      if (!check.ok) return { error: check.error };
      if (file.size > 4 * 1024 * 1024) return { error: "En démonstration, les fichiers sont limités à 4 Mo." };
      url = `data:${check.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    } else {
      return { error: "Aucun fichier reçu." };
    }

    if (purpose === "portrait") await repo.setPortrait(viewer, memorialId, url);
    else await repo.addMedia(viewer, memorialId, { kind, caption: caption || "Sans légende", album, url, storagePath });
  } catch (e) {
    return { error: errorMessage(e, "Le fichier n’a pas pu être enregistré.") };
  }
  revalidatePath("/espace", "layout");
  revalidatePath("/m", "layout");
  return { ok: true };
}

export async function deleteMedia(formData: FormData) {
  await repo.deleteMedia(await familyViewer(), String(formData.get("mediaId")));
  revalidatePath("/espace", "layout");
  revalidatePath("/m", "layout");
}

// --- Invitations --------------------------------------------------------------------

export async function createInvitation(
  tombId: string,
  role: "guardian" | "member",
): Promise<{ error: string } | { url: string }> {
  try {
    const viewer = await getViewer();
    // Une famille n'invite que des proches ; seul le distributeur remet la garde de la page.
    const effective = viewer.kind === "distributor" ? "guardian" : role;
    const token = await repo.createInvitation(viewer, tombId, effective);
    return { url: invitationUrl(token) };
  } catch (e) {
    return { error: errorMessage(e, "Le lien n’a pas pu être créé.") };
  }
}

export async function acceptInvitation(formData: FormData) {
  const viewer = await getViewer();
  const token = String(formData.get("token") ?? "");
  if (viewer.kind !== "family") redirect(`/connexion?next=${encodeURIComponent(`/invitation/${token}`)}`);
  const tombId = await repo.acceptInvitation(viewer, token);
  revalidatePath("/espace", "layout");
  redirect(`/espace/tombe/${tombId}?bienvenue=1`);
}

// --- Distributeurs ------------------------------------------------------------------

export async function markOrderPaid(formData: FormData) {
  const viewer = await getViewer();
  await repo.markOrderPaid(viewer, String(formData.get("orderId")));
  revalidatePath("/pro", "layout");
}

export async function createQrBatch(formData: FormData) {
  const viewer = await getViewer();
  const count = Math.min(50, Math.max(1, Number(formData.get("count")) || 10));
  await repo.createQrBatch(viewer, count);
  revalidatePath("/pro");
  redirect("/pro/codes");
}
