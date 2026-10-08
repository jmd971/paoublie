import { newCode, slugify } from "../codes";
import { FORMULAS, commissionCents } from "../pricing";
import { supabaseAdmin, supabaseServer } from "../supabase/server";
import type { Distributor, Media, Memorial, Message, Order, QrCode, Tomb, TombWithMemorials } from "../types";
import type { Repo } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- lignes brutes de PostgREST */
const toMemorial = (r: any): Memorial => ({
  id: r.id,
  tombId: r.tomb_id,
  slug: r.slug,
  firstName: r.first_name,
  lastName: r.last_name,
  nickname: r.nickname ?? undefined,
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
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

async function tombByCode(code: string): Promise<TombWithMemorials | null> {
  const db = await supabaseServer();
  const { data: qr } = await db.from("qr_codes").select("tomb_id").eq("code", code).maybeSingle();
  if (!qr?.tomb_id) return null;
  const { data: tomb } = await db.from("tombs").select("*").eq("id", qr.tomb_id).maybeSingle();
  if (!tomb) return null;
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
    const memorial = tomb?.memorials.find((m) => m.slug === slug);
    if (!tomb || !memorial) return null;
    const db = await supabaseServer();
    const [{ data: media }, { data: messages }] = await Promise.all([
      db.from("media").select("*").eq("memorial_id", memorial.id).order("sort"),
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
    const db = await supabaseServer();
    const { data, error } = await db.rpc("light_candle", { m: memorialId });
    if (error) throw error;
    return data as number;
  },

  async dropFlower(memorialId) {
    const db = await supabaseServer();
    const { data, error } = await db.rpc("drop_flower", { m: memorialId });
    if (error) throw error;
    return data as number;
  },

  async submitMessage(memorialId, input) {
    const db = await supabaseServer();
    const { error } = await db.from("messages").insert({
      memorial_id: memorialId,
      author_name: input.authorName,
      author_place: input.authorPlace ?? null,
      body: input.body,
      status: "pending",
    });
    if (error) throw error;
  },

  async familyOverview(viewer) {
    const db = await supabaseServer();
    const { data: links } = await db.from("tomb_members").select("tomb_id").eq("profile_id", viewer.userId);
    const tombIds = (links ?? []).map((l) => l.tomb_id as string);
    if (tombIds.length === 0) return { tombs: [], pending: [], orders: [] };
    const [{ data: tombs }, { data: codes }, { data: mems }, { data: orders }] = await Promise.all([
      db.from("tombs").select("*").in("id", tombIds),
      db.from("qr_codes").select("code, tomb_id").in("tomb_id", tombIds),
      db.from("memorials").select("*").in("tomb_id", tombIds),
      db.from("orders").select("*, tombs(family_name)").in("tomb_id", tombIds).order("created_at", { ascending: false }),
    ]);
    const memorials = (mems ?? []).map(toMemorial);
    const ids = memorials.map((m) => m.id);
    const { data: pending } = await db.from("messages").select("*").in("memorial_id", ids).eq("status", "pending");
    return {
      tombs: (tombs ?? []).map((t) => ({
        ...toTomb(t, codes?.find((c) => c.tomb_id === t.id)?.code ?? ""),
        memorials: memorials.filter((m) => m.tombId === t.id),
      })),
      pending: (pending ?? []).map((p) => {
        const m = memorials.find((x) => x.id === p.memorial_id)!;
        return { ...toMessage(p), memorialName: `${m.firstName} ${m.lastName}` };
      }),
      orders: (orders ?? []).map(toOrder),
    };
  },

  async moderateMessage(viewer, messageId, status) {
    if (viewer.kind !== "family") throw new Error("Réservé à la famille");
    const db = await supabaseServer();
    // La règle RLS « la famille modère » refuse la mise à jour si le compte n'est pas de la famille.
    const { data, error } = await db.from("messages").update({ status }).eq("id", messageId).select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Message introuvable");
  },

  async createMemorial(viewer, input) {
    if (viewer.kind === "anonymous") throw new Error("Connexion requise");
    const db = supabaseAdmin();
    let code = input.code;
    let qrDistributor: string | null = null;
    if (code) {
      const { data: qr } = await db.from("qr_codes").select("*").eq("code", code).maybeSingle();
      if (!qr || qr.tomb_id) throw new Error("Ce code de plaque est inconnu ou déjà utilisé");
      qrDistributor = qr.distributor_id;
    } else {
      code = newCode();
      const { error } = await db.from("qr_codes").insert({ code, batch: "EN-LIGNE" });
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
    await db.from("qr_codes").update({ tomb_id: tomb.id, assigned_at: new Date().toISOString() }).eq("code", code);
    const slug = slugify(`${input.firstName} ${input.lastName}`) || "memorial";
    const { error: memErr } = await db.from("memorials").insert({
      tomb_id: tomb.id,
      slug,
      first_name: input.firstName,
      last_name: input.lastName,
      nickname: input.nickname ?? null,
      birth_date: input.birthDate || null,
      death_date: input.deathDate || null,
      birth_place: input.commune,
      chapters: input.story ? [{ years: "", title: "Sa vie", text: input.story }] : [],
    });
    if (memErr) throw memErr;
    if (viewer.kind === "family") {
      await db.from("tomb_members").insert({ tomb_id: tomb.id, profile_id: viewer.userId, role: "guardian" });
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
    return { code, slug };
  },

  async distributorOverview(viewer) {
    const db = await supabaseServer();
    const admin = supabaseAdmin();
    const [{ data: d }, { data: orders }, { data: codes }, { data: tombs }] = await Promise.all([
      db.from("distributors").select("*").eq("id", viewer.distributorId).single(),
      db.from("orders").select("*, tombs(family_name)").eq("distributor_id", viewer.distributorId).order("created_at", { ascending: false }),
      admin.from("qr_codes").select("*").eq("distributor_id", viewer.distributorId).is("tomb_id", null),
      admin.from("tombs").select("*, qr_codes(code), memorials(*)").eq("distributor_id", viewer.distributorId),
    ]);
    if (!d) throw new Error("Distributeur introuvable");
    const distributor: Distributor = {
      id: d.id,
      name: d.name,
      kind: d.kind,
      commune: d.commune ?? undefined,
      commissionRate: Number(d.commission_rate),
    };
    return {
      distributor,
      orders: (orders ?? []).map(toOrder),
      freeCodes: (codes ?? []).map((c): QrCode => ({ code: c.code, batch: c.batch, distributorId: c.distributor_id })),
      tombs: (tombs ?? []).map((t) => ({
        ...toTomb(t, t.qr_codes?.[0]?.code ?? t.qr_codes?.code ?? ""),
        memorials: (t.memorials ?? []).map(toMemorial),
      })),
    };
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
