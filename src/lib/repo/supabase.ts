import { randomBytes, randomUUID } from "node:crypto";
import { newCode, slugify } from "../codes";
import { FORMULAS, commissionCents } from "../pricing";
import { supabaseAdmin, supabaseServer } from "../supabase/server";
import {
  RESTRICTED,
  type Distributor,
  type Media,
  type MemberRole,
  type Memorial,
  type Message,
  type Order,
  type QrCode,
  type Tomb,
  type TombWithMemorials,
} from "../types";
import type { Repo } from "./types";

const BUCKET = "media";

/* eslint-disable @typescript-eslint/no-explicit-any -- lignes brutes de PostgREST */
const toMemorial = (r: any): Memorial => ({
  id: r.id,
  tombId: r.tomb_id,
  slug: r.slug,
  firstName: r.first_name,
  lastName: r.last_name,
  nickname: r.nickname ?? undefined,
  gender: r.gender ?? undefined,
  relation: r.relation ?? undefined,
  birthDate: r.birth_date ?? undefined,
  deathDate: r.death_date ?? undefined,
  birthPlace: r.birth_place ?? undefined,
  quote: r.quote ?? undefined,
  quoteTranslation: r.quote_translation ?? undefined,
  chapters: r.chapters ?? [],
  loves: r.loves ?? [],
  portraitUrl: r.portrait_url ?? undefined,
  candles: r.candles,
  flowers: r.flowers,
  visits: r.visits,
});

const toTomb = (r: any, code: string): Tomb => ({
  id: r.id,
  code,
  familyName: r.family_name,
  cemetery: r.cemetery,
  locationLabel: r.location_label ?? undefined,
  commune: r.commune,
  visibility: r.visibility,
  distributorId: r.distributor_id ?? undefined,
});

const toMessage = (r: any): Message => ({
  id: r.id,
  memorialId: r.memorial_id,
  authorName: r.author_name,
  authorPlace: r.author_place ?? undefined,
  body: r.body,
  status: r.status,
  createdAt: r.created_at,
});

const toMedia = (r: any): Media => ({
  id: r.id,
  memorialId: r.memorial_id,
  kind: r.kind,
  url: r.url ?? undefined,
  caption: r.caption,
  album: r.album ?? undefined,
  duration: r.duration ?? undefined,
});

const toOrder = (r: any): Order => ({
  id: r.id,
  tombId: r.tomb_id ?? undefined,
  familyName: r.tombs?.family_name ?? "—",
  formula: r.formula,
  amountTtcCents: r.amount_ttc_cents,
  commissionCents: r.commission_cents,
  status: r.status,
  paidVia: r.paid_via ?? undefined,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- Contrôles d'accès (faits côté serveur avant toute écriture avec la clé administrateur) ---

async function roleIn(userId: string, tombId: string): Promise<MemberRole | null> {
  const { data } = await supabaseAdmin()
    .from("tomb_members")
    .select("role")
    .eq("tomb_id", tombId)
    .eq("profile_id", userId)
    .maybeSingle();
  return (data?.role as MemberRole | undefined) ?? null;
}

async function guardianMemorial(userId: string, memorialId: string): Promise<{ id: string; tomb_id: string }> {
  const { data: m } = await supabaseAdmin().from("memorials").select("id, tomb_id").eq("id", memorialId).maybeSingle();
  if (!m || (await roleIn(userId, m.tomb_id)) !== "guardian") throw new Error("Seul le gardien de la page peut la modifier");
  return m;
}

/** Gardien ou proche invité : peut ajouter des photos, vidéos et voix. */
async function memberMemorial(userId: string, memorialId: string): Promise<{ id: string; tomb_id: string }> {
  const { data: m } = await supabaseAdmin().from("memorials").select("id, tomb_id").eq("id", memorialId).maybeSingle();
  if (!m || !(await roleIn(userId, m.tomb_id))) throw new Error("Seule la famille peut ajouter des souvenirs à cette page");
  return m;
}

async function codeOf(tombId: string): Promise<string> {
  const { data } = await supabaseAdmin().from("qr_codes").select("code").eq("tomb_id", tombId).maybeSingle();
  return data?.code ?? "";
}

async function uniqueSlug(tombId: string, base: string): Promise<string> {
  const { data } = await supabaseAdmin().from("memorials").select("slug").eq("tomb_id", tombId);
  const taken = new Set((data ?? []).map((r) => r.slug as string));
  let slug = base || "memorial";
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

async function hasGuardian(tombIds: string[]): Promise<Set<string>> {
  if (tombIds.length === 0) return new Set();
  const { data } = await supabaseAdmin().from("tomb_members").select("tomb_id").in("tomb_id", tombIds).eq("role", "guardian");
  return new Set((data ?? []).map((r) => r.tomb_id as string));
}

/** Lecture d'une tombe avec les droits du visiteur (règles RLS). */
async function tombByCode(code: string): Promise<TombWithMemorials | typeof RESTRICTED | null> {
  const db = await supabaseServer();
  const { data: qr } = await db.from("qr_codes").select("tomb_id").eq("code", code).maybeSingle();
  if (!qr?.tomb_id) return null;
  const { data: tomb } = await db.from("tombs").select("*").eq("id", qr.tomb_id).maybeSingle();
  if (!tomb) return RESTRICTED;
  const { data: mems } = await db.from("memorials").select("*").eq("tomb_id", tomb.id).order("created_at");
  return { ...toTomb(tomb, code), memorials: (mems ?? []).map(toMemorial) };
}

export const supabaseRepo: Repo = {
  getTombByCode: tombByCode,

  async isFreeCode(code) {
    const db = await supabaseServer();
    const { data } = await db.from("qr_codes").select("tomb_id").eq("code", code).maybeSingle();
    return !!data && !data.tomb_id;
  },

  async getMemorialPage(code, slug) {
    const tomb = await tombByCode(code);
    if (tomb === RESTRICTED) return RESTRICTED;
    const memorial = tomb?.memorials.find((m) => m.slug === slug);
    if (!tomb || !memorial) return null;
    const db = await supabaseServer();
    const [{ data: media }, { data: messages }] = await Promise.all([
      db.from("media").select("*").eq("memorial_id", memorial.id).order("sort").order("created_at"),
      db
        .from("messages")
        .select("*")
        .eq("memorial_id", memorial.id)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
    const { memorials, ...rest } = tomb;
    return {
      tomb: rest,
      memorial,
      media: (media ?? []).map(toMedia),
      messages: (messages ?? []).map(toMessage),
      siblings: memorials.filter((m) => m.id !== memorial.id),
    };
  },

  async countVisit(memorialId) {
    const db = supabaseAdmin();
    const { data } = await db.from("memorials").select("visits").eq("id", memorialId).single();
    if (data) await db.from("memorials").update({ visits: data.visits + 1 }).eq("id", memorialId);
  },

  async lightCandle(memorialId) {
    // Côté serveur seulement, après la limite anti-abus (la fonction n'est pas ouverte au public).
    const { data, error } = await supabaseAdmin().rpc("light_candle", { m: memorialId });
    if (error) throw error;
    return data as number;
  },

  async dropFlower(memorialId) {
    const { data, error } = await supabaseAdmin().rpc("drop_flower", { m: memorialId });
    if (error) throw error;
    return data as number;
  },

  async getCounters(memorialId) {
    const { data } = await supabaseAdmin().from("memorials").select("candles, flowers").eq("id", memorialId).maybeSingle();
    return { candles: data?.candles ?? 0, flowers: data?.flowers ?? 0 };
  },

  async submitMessage(memorialId, input) {
    // Écrit côté serveur, après les contrôles anti-abus : l'API publique n'accepte pas d'insertion directe.
    const { error } = await supabaseAdmin().from("messages").insert({
      memorial_id: memorialId,
      author_name: input.authorName,
      author_place: input.authorPlace ?? null,
      body: input.body,
      status: "pending",
    });
    if (error) throw error;
  },

  async allow(kind, key, limit, windowSeconds) {
    const db = supabaseAdmin();
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count } = await db
      .from("abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", kind)
      .eq("key", key)
      .gte("created_at", since);
    if ((count ?? 0) >= limit) return false;
    await db.from("abuse_events").insert({ kind, key });
    // Purge de temps en temps : les empreintes ne sont pas gardées plus de 30 jours.
    if (Math.random() < 0.02) {
      await db.from("abuse_events").delete().lt("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
    }
    return true;
  },

  async familyOverview(viewer) {
    const db = supabaseAdmin();
    const { data: links } = await db.from("tomb_members").select("tomb_id, role").eq("profile_id", viewer.userId);
    const roles = new Map((links ?? []).map((l) => [l.tomb_id as string, l.role as MemberRole]));
    const tombIds = [...roles.keys()];
    if (tombIds.length === 0) return { tombs: [], pending: [], orders: [] };
    const [{ data: tombs }, { data: codes }, { data: mems }, { data: orders }] = await Promise.all([
      db.from("tombs").select("*").in("id", tombIds),
      db.from("qr_codes").select("code, tomb_id").in("tomb_id", tombIds),
      db.from("memorials").select("*").in("tomb_id", tombIds).order("created_at"),
      db.from("orders").select("*, tombs(family_name)").in("tomb_id", tombIds).order("created_at", { ascending: false }),
    ]);
    const memorials = (mems ?? []).map(toMemorial);
    const guarded = memorials.filter((m) => roles.get(m.tombId) === "guardian");
    const { data: pending } = guarded.length
      ? await db.from("messages").select("*").in("memorial_id", guarded.map((m) => m.id)).eq("status", "pending").order("created_at")
      : { data: [] };
    return {
      tombs: (tombs ?? []).map((t) => ({
        ...toTomb(t, codes?.find((c) => c.tomb_id === t.id)?.code ?? ""),
        memorials: memorials.filter((m) => m.tombId === t.id),
        role: roles.get(t.id)!,
      })),
      pending: (pending ?? []).map((p) => {
        const m = guarded.find((x) => x.id === p.memorial_id)!;
        return { ...toMessage(p), memorialName: `${m.firstName} ${m.lastName}` };
      }),
      orders: (orders ?? []).map(toOrder),
    };
  },

  async managedTomb(viewer, tombId) {
    const role = await roleIn(viewer.userId, tombId);
    if (!role) return null;
    const db = supabaseAdmin();
    const [{ data: tomb }, { data: mems }, { data: members }, { data: orders }] = await Promise.all([
      db.from("tombs").select("*").eq("id", tombId).single(),
      db.from("memorials").select("*").eq("tomb_id", tombId).order("created_at"),
      db.from("tomb_members").select("role, profiles(full_name)").eq("tomb_id", tombId),
      db.from("orders").select("*, tombs(family_name)").eq("tomb_id", tombId).order("created_at", { ascending: false }),
    ]);
    if (!tomb) return null;
    const memorials = (mems ?? []).map(toMemorial);
    const { data: media } = memorials.length
      ? await db.from("media").select("*").in("memorial_id", memorials.map((m) => m.id)).order("created_at")
      : { data: [] };
    return {
      ...toTomb(tomb, await codeOf(tombId)),
      memorials,
      role,
      media: (media ?? []).map(toMedia),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jointure PostgREST
      members: (members ?? []).map((m: any) => ({ name: m.profiles?.full_name ?? "Membre", role: m.role })),
      orders: (orders ?? []).map(toOrder),
    };
  },

  async moderateMessage(viewer, messageId, status) {
    if (viewer.kind !== "family") throw new Error("Réservé à la famille");
    const db = supabaseAdmin();
    const { data: msg } = await db.from("messages").select("memorial_id").eq("id", messageId).maybeSingle();
    if (!msg) throw new Error("Message introuvable");
    await guardianMemorial(viewer.userId, msg.memorial_id);
    const { error } = await db.from("messages").update({ status }).eq("id", messageId);
    if (error) throw error;
  },

  async createMemorial(viewer, input) {
    if (viewer.kind === "anonymous") throw new Error("Connexion requise");
    const db = supabaseAdmin();
    let code = input.code;
    let qrDistributor: string | null = null;
    if (code) {
      const { data: qr } = await db.from("qr_codes").select("*").eq("code", code).maybeSingle();
      if (!qr || qr.tomb_id) throw new Error("Ce code de plaque est inconnu ou déjà utilisé");
      if (viewer.kind === "distributor" && qr.distributor_id && qr.distributor_id !== viewer.distributorId) {
        throw new Error("Cette plaque appartient au stock d’un autre distributeur");
      }
      qrDistributor = qr.distributor_id;
    } else {
      code = newCode();
      const { error } = await db.from("qr_codes").insert({
        code,
        batch: "EN-LIGNE",
        distributor_id: viewer.kind === "distributor" ? viewer.distributorId : null,
      });
      if (error) throw error;
    }
    const distributorId = viewer.kind === "distributor" ? viewer.distributorId : qrDistributor;
    const { data: tomb, error: tombErr } = await db
      .from("tombs")
      .insert({
        family_name: input.lastName,
        cemetery: input.cemetery,
        location_label: input.locationLabel ?? null,
        commune: input.commune,
        visibility: input.visibility,
        owner_id: viewer.kind === "family" ? viewer.userId : null,
        distributor_id: distributorId,
      })
      .select("id")
      .single();
    if (tombErr) throw tombErr;
    const { error: qrErr } = await db
      .from("qr_codes")
      .update({ tomb_id: tomb.id, assigned_at: new Date().toISOString() })
      .eq("code", code)
      .is("tomb_id", null);
    if (qrErr) throw qrErr;
    const slug = slugify(`${input.firstName} ${input.lastName}`) || "memorial";
    const { error: memErr } = await db.from("memorials").insert({
      tomb_id: tomb.id,
      slug,
      first_name: input.firstName,
      last_name: input.lastName,
      nickname: input.nickname ?? null,
      gender: input.gender ?? null,
      birth_date: input.birthDate || null,
      death_date: input.deathDate || null,
      birth_place: input.commune,
      chapters: input.story ? [{ years: "", title: "Sa vie", text: input.story }] : [],
    });
    if (memErr) throw memErr;
    if (viewer.kind === "family") {
      const { error } = await db.from("tomb_members").insert({ tomb_id: tomb.id, profile_id: viewer.userId, role: "guardian" });
      if (error) throw error;
    }
    let rate = 0;
    if (distributorId) {
      const { data: d } = await db.from("distributors").select("commission_rate").eq("id", distributorId).single();
      rate = Number(d?.commission_rate ?? 0);
    }
    await db.from("orders").insert({
      tomb_id: tomb.id,
      formula: input.formula,
      amount_ttc_cents: FORMULAS[input.formula].ttcCents,
      distributor_id: distributorId,
      commission_cents: distributorId ? commissionCents(input.formula, rate) : 0,
    });
    return { code, slug, tombId: tomb.id };
  },

  async addMemorialToTomb(viewer, tombId, input) {
    if ((await roleIn(viewer.userId, tombId)) !== "guardian") throw new Error("Seul le gardien de la page peut ajouter un défunt");
    const db = supabaseAdmin();
    const { count } = await db.from("memorials").select("id", { count: "exact", head: true }).eq("tomb_id", tombId);
    if ((count ?? 0) >= 6) throw new Error("Un caveau compte au plus 6 défunts");
    const { data: tomb } = await db.from("tombs").select("commune").eq("id", tombId).single();
    const slug = await uniqueSlug(tombId, slugify(`${input.firstName} ${input.lastName}`));
    const { data, error } = await db
      .from("memorials")
      .insert({
        tomb_id: tombId,
        slug,
        first_name: input.firstName,
        last_name: input.lastName,
        nickname: input.nickname ?? null,
        gender: input.gender ?? null,
        relation: input.relation ?? null,
        birth_date: input.birthDate || null,
        death_date: input.deathDate || null,
        birth_place: tomb?.commune ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id, slug };
  },

  async updateMemorial(viewer, memorialId, patch) {
    await guardianMemorial(viewer.userId, memorialId);
    const { error } = await supabaseAdmin()
      .from("memorials")
      .update({
        first_name: patch.firstName,
        last_name: patch.lastName,
        nickname: patch.nickname ?? null,
        gender: patch.gender ?? null,
        relation: patch.relation ?? null,
        birth_date: patch.birthDate || null,
        death_date: patch.deathDate || null,
        birth_place: patch.birthPlace ?? null,
        quote: patch.quote ?? null,
        quote_translation: patch.quoteTranslation ?? null,
        chapters: patch.chapters,
        loves: patch.loves,
      })
      .eq("id", memorialId);
    if (error) throw error;
  },

  async prepareUpload(viewer, memorialId, extension) {
    await memberMemorial(viewer.userId, memorialId);
    const path = `${memorialId}/${randomUUID()}.${extension}`;
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("Envoi impossible");
    return {
      mode: "storage",
      bucket: BUCKET,
      path: data.path,
      token: data.token,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };
  },

  publicUrl(path) {
    return supabaseAdmin().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async addMedia(viewer, memorialId, media) {
    await memberMemorial(viewer.userId, memorialId);
    if (media.storagePath && !media.storagePath.startsWith(`${memorialId}/`)) throw new Error("Fichier invalide");
    const { error } = await supabaseAdmin().from("media").insert({
      memorial_id: memorialId,
      kind: media.kind,
      url: media.url,
      storage_path: media.storagePath ?? null,
      caption: media.caption,
      album: media.album ?? null,
    });
    if (error) throw error;
  },

  async setPortrait(viewer, memorialId, url) {
    await guardianMemorial(viewer.userId, memorialId);
    const { error } = await supabaseAdmin().from("memorials").update({ portrait_url: url }).eq("id", memorialId);
    if (error) throw error;
  },

  async deleteMedia(viewer, mediaId) {
    const db = supabaseAdmin();
    const { data: media } = await db.from("media").select("memorial_id, storage_path").eq("id", mediaId).maybeSingle();
    if (!media) throw new Error("Média introuvable");
    await guardianMemorial(viewer.userId, media.memorial_id);
    await db.from("media").delete().eq("id", mediaId);
    if (media.storage_path) await db.storage.from(BUCKET).remove([media.storage_path]);
  },

  async createInvitation(viewer, tombId, role) {
    const db = supabaseAdmin();
    const { data: tomb } = await db.from("tombs").select("distributor_id").eq("id", tombId).maybeSingle();
    const myRole = viewer.kind === "family" ? await roleIn(viewer.userId, tombId) : null;
    const allowed =
      // Un proche peut inviter d'autres proches ; seul un gardien transmet la gestion.
      (viewer.kind === "family" && (role === "member" ? !!myRole : myRole === "guardian")) ||
      (viewer.kind === "distributor" && tomb?.distributor_id === viewer.distributorId);
    if (!tomb || !allowed) throw new Error("Vous ne pouvez pas inviter sur cette tombe");
    const token = randomBytes(24).toString("base64url");
    const { error } = await db.from("invitations").insert({ token, tomb_id: tombId, role, created_by: viewer.userId });
    if (error) throw error;
    return token;
  },

  async getInvitation(token) {
    const db = supabaseAdmin();
    const { data: inv } = await db.from("invitations").select("*").eq("token", token).maybeSingle();
    if (!inv) return null;
    const [{ data: tomb }, { data: mems }] = await Promise.all([
      db.from("tombs").select("family_name, cemetery").eq("id", inv.tomb_id).single(),
      db.from("memorials").select("first_name, last_name").eq("tomb_id", inv.tomb_id).order("created_at"),
    ]);
    if (!tomb) return null;
    return {
      token,
      tombId: inv.tomb_id,
      familyName: tomb.family_name,
      cemetery: tomb.cemetery,
      memorialNames: (mems ?? []).map((m) => `${m.first_name} ${m.last_name}`),
      role: inv.role,
      status:
        inv.role === "guardian" && inv.accepted_by ? "used" : new Date(inv.expires_at).getTime() < Date.now() ? "expired" : "valid",
    };
  },

  async acceptInvitation(viewer, token) {
    const info = await supabaseRepo.getInvitation(token);
    if (!info || info.status !== "valid") throw new Error("Cette invitation n’est plus valable");
    const db = supabaseAdmin();
    const current = await roleIn(viewer.userId, info.tombId);
    if (!current) {
      const { error } = await db.from("tomb_members").insert({ tomb_id: info.tombId, profile_id: viewer.userId, role: info.role });
      if (error) throw error;
    } else if (info.role === "guardian" && current !== "guardian") {
      await db.from("tomb_members").update({ role: "guardian" }).eq("tomb_id", info.tombId).eq("profile_id", viewer.userId);
    }
    // Une invitation de gardien ne sert qu'une fois ; celle des proches peut circuler dans le groupe familial.
    const update = db.from("invitations").update({ accepted_by: viewer.userId, accepted_at: new Date().toISOString() }).eq("token", token);
    await (info.role === "guardian" ? update.is("accepted_by", null) : update);
    return info.tombId;
  },

  async distributorOverview(viewer) {
    const db = supabaseAdmin();
    const [{ data: d }, { data: orders }, { data: codes }, { data: tombs }] = await Promise.all([
      db.from("distributors").select("*").eq("id", viewer.distributorId).single(),
      db.from("orders").select("*, tombs(family_name)").eq("distributor_id", viewer.distributorId).order("created_at", { ascending: false }),
      db.from("qr_codes").select("*").eq("distributor_id", viewer.distributorId).is("tomb_id", null),
      db.from("tombs").select("*, qr_codes(code), memorials(*)").eq("distributor_id", viewer.distributorId).order("created_at", { ascending: false }),
    ]);
    if (!d) throw new Error("Distributeur introuvable");
    const distributor: Distributor = {
      id: d.id,
      name: d.name,
      kind: d.kind,
      commune: d.commune ?? undefined,
      commissionRate: Number(d.commission_rate),
    };
    const handed = await hasGuardian((tombs ?? []).map((t) => t.id));
    return {
      distributor,
      orders: (orders ?? []).map(toOrder),
      freeCodes: (codes ?? []).map((c): QrCode => ({ code: c.code, batch: c.batch, distributorId: c.distributor_id })),
      tombs: (tombs ?? []).map((t) => ({
        ...toTomb(t, t.qr_codes?.[0]?.code ?? t.qr_codes?.code ?? ""),
        memorials: (t.memorials ?? []).map(toMemorial),
        handedOver: handed.has(t.id),
      })),
    };
  },

  async distributorTomb(viewer, tombId) {
    const db = supabaseAdmin();
    const { data: tomb } = await db.from("tombs").select("*").eq("id", tombId).eq("distributor_id", viewer.distributorId).maybeSingle();
    if (!tomb) return null;
    const [{ data: mems }, { data: orders }] = await Promise.all([
      db.from("memorials").select("*").eq("tomb_id", tombId).order("created_at"),
      db.from("orders").select("*, tombs(family_name)").eq("tomb_id", tombId).order("created_at", { ascending: false }),
    ]);
    return {
      ...toTomb(tomb, await codeOf(tombId)),
      memorials: (mems ?? []).map(toMemorial),
      orders: (orders ?? []).map(toOrder),
      handedOver: (await hasGuardian([tombId])).has(tombId),
    };
  },

  async markOrderPaid(viewer, orderId) {
    if (viewer.kind !== "distributor") throw new Error("Réservé aux distributeurs");
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_via: "distributeur" })
      .eq("id", orderId)
      .eq("distributor_id", viewer.distributorId)
      .eq("status", "pending")
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Commande introuvable");
  },

  async createQrBatch(viewer, count) {
    if (viewer.kind !== "distributor") throw new Error("Réservé aux distributeurs");
    const batch = `LOT-${new Date().toISOString().slice(0, 10)}`;
    const rows = Array.from({ length: count }, () => ({ code: newCode(), batch, distributor_id: viewer.distributorId }));
    const { data, error } = await supabaseAdmin().from("qr_codes").insert(rows).select("*");
    if (error) throw error;
    return (data ?? []).map((c) => ({ code: c.code, batch: c.batch, distributorId: c.distributor_id }));
  },
};
