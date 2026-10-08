"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeCode, siteUrl } from "@/lib/codes";
import { isDemo, repo } from "@/lib/repo";
import { DEMO_ROLE_COOKIE, getViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string; message?: string };

// --- Session ------------------------------------------------------------------

export async function setDemoRole(formData: FormData) {
  if (!isDemo) redirect("/connexion");
  const role = formData.get("role") === "distributor" ? "distributor" : "family";
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(role === "distributor" ? "/pro" : "/espace");
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
  const { error } = await (await supabaseServer()).auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) return { error: "L’e-mail n’a pas pu être envoyé. Réessayez dans quelques minutes." };
  return { ok: true, message: `Un lien de connexion vient d’être envoyé à ${email.data}.` };
}

// --- Gestes des visiteurs --------------------------------------------------------

export async function lightCandle(memorialId: string, path: string): Promise<number> {
  const n = await repo.lightCandle(memorialId);
  revalidatePath(path);
  return n;
}

export async function dropFlower(memorialId: string, path: string): Promise<number> {
  const n = await repo.dropFlower(memorialId);
  revalidatePath(path);
  return n;
}

const messageSchema = z.object({
  memorialId: z.string().min(1),
  authorName: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  authorPlace: z.string().trim().max(80).optional(),
  body: z.string().trim().min(1, "Écrivez votre message.").max(1500, "Le message est trop long (1 500 caractères au plus)."),
});

export async function submitMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = messageSchema.safeParse({
    memorialId: formData.get("memorialId"),
    authorName: formData.get("authorName"),
    authorPlace: formData.get("authorPlace") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Message incomplet." };
  await repo.submitMessage(parsed.data.memorialId, parsed.data);
  return { ok: true, message: "Merci. Votre message apparaîtra dès que la famille l’aura validé." };
}

// --- Famille --------------------------------------------------------------------

export async function moderateMessage(formData: FormData) {
  const viewer = await getViewer();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "published" ? "published" : "private";
  await repo.moderateMessage(viewer, id, status);
  revalidatePath("/espace");
  revalidatePath("/m", "layout");
}

const memorialSchema = z.object({
  code: z.string().optional(),
  firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez le nom.").max(60),
  nickname: z.string().trim().max(60).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
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
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v]),
  );
  const parsed = memorialSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  let code: string | undefined;
  if (parsed.data.code) {
    const normalized = normalizeCode(parsed.data.code);
    if (!normalized) return { error: "Le code de plaque doit contenir 5 à 8 lettres ou chiffres." };
    code = normalized;
  }
  let result: { code: string; slug: string };
  try {
    result = await repo.createMemorial(viewer, { ...parsed.data, code });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Le mémorial n’a pas pu être créé." };
  }
  revalidatePath(viewer.kind === "distributor" ? "/pro" : "/espace");
  redirect(`/m/${result.code}/${result.slug}?nouveau=1`);
}

// --- Distributeurs ------------------------------------------------------------------

export async function createQrBatch(formData: FormData) {
  const viewer = await getViewer();
  const count = Math.min(50, Math.max(1, Number(formData.get("count")) || 10));
  await repo.createQrBatch(viewer, count);
  revalidatePath("/pro");
  redirect("/pro/codes");
}
