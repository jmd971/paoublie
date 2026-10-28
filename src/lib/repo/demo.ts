import { randomBytes, randomUUID } from "node:crypto";
import { newCode, slugify } from "../codes";
import { FORMULAS, commissionCents } from "../pricing";
import {
  RESTRICTED,
  type Media,
  type MemberRole,
  type Memorial,
  type Message,
  type Order,
  type QrCode,
  type Tomb,
  type TombWithMemorials,
} from "../types";
import { demoViewer } from "../demo-session";
import {
  DEMO_CODES,
  DEMO_DISTRIBUTOR,
  DEMO_MEDIA,
  DEMO_MEMORIALS,
  DEMO_MESSAGES,
  DEMO_ORDERS,
  DEMO_TOMB,
} from "./demo-data";
import type { Repo } from "./types";

// Stockage en mémoire : les changements vivent tant que le serveur tourne.
type Member = { tombId: string; userId: string; name: string; role: MemberRole };
type Invitation = { token: string; tombId: string; role: MemberRole; expiresAt: number; acceptedBy?: string };
type Store = {
  tombs: Tomb[];
  memorials: Memorial[];
  media: Media[];
  messages: Message[];
  orders: Order[];
  codes: QrCode[];
  members: Member[];
  invitations: Invitation[];
  events: { kind: string; key: string; at: number }[];
};

const g = globalThis as unknown as { __paoublieDemo?: Store };

function store(): Store {
  if (!g.__paoublieDemo) {
    g.__paoublieDemo = {
      tombs: [structuredClone(DEMO_TOMB)],
      memorials: structuredClone(DEMO_MEMORIALS),
      media: structuredClone(DEMO_MEDIA),
      messages: structuredClone(DEMO_MESSAGES),
      orders: structuredClone(DEMO_ORDERS),
      codes: structuredClone(DEMO_CODES),
      members: [{ tombId: DEMO_TOMB.id, userId: "demo-famille", name: "Josette Anatole", role: "guardian" }],
      invitations: [],
      events: [],
    };
  }
  return g.__paoublieDemo;
}

const withMemorials = (t: Tomb): TombWithMemorials => ({ ...t, memorials: store().memorials.filter((m) => m.tombId === t.id) });
const fullName = (m: Memorial) => `${m.firstName} ${m.lastName}`;
const roleOf = (userId: string, tombId: string) => store().members.find((x) => x.userId === userId && x.tombId === tombId)?.role;

/** Le visiteur a-t-il le droit de voir cette tombe ? En démonstration, la session vient du cookie de rôle. */
async function canSee(t: Tomb): Promise<boolean> {
  if (t.visibility === "public") return true;
  const v = await demoViewer();
  if (v.kind === "family") return !!roleOf(v.userId, t.id);
  if (v.kind === "distributor") return t.distributorId === v.distributorId;
  return false;
}

function guardianMemorial(userId: string, memorialId: string): Memorial {
  const m = store().memorials.find((x) => x.id === memorialId);
  if (!m || roleOf(userId, m.tombId) !== "guardian") throw new Error("Seul le gardien de la page peut la modifier");
  return m;
}

/** Gardien ou proche invité : peut ajouter des photos, vidéos et voix. */
function memberMemorial(userId: string, memorialId: string): Memorial {
  const m = store().memorials.find((x) => x.id === memorialId);
  if (!m || !roleOf(userId, m.tombId)) throw new Error("Seule la famille peut ajouter des souvenirs à cette page");
  return m;
}

function uniqueSlug(tombId: string, base: string): string {
  const taken = new Set(store().memorials.filter((m) => m.tombId === tombId).map((m) => m.slug));
  let slug = base || "memorial";
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export const demoRepo: Repo = {
  async getTombByCode(code) {
    const t = store().tombs.find((x) => x.code === code);
    if (!t) return null;
    return (await canSee(t)) ? withMemorials(t) : RESTRICTED;
  },

  async isFreeCode(code) {
    const c = store().codes.find((x) => x.code === code);
    return !!c && !c.tombId;
  },

  async getMemorialPage(code, slug) {
    const s = store();
    const tomb = s.tombs.find((t) => t.code === code);
    if (!tomb) return null;
    if (!(await canSee(tomb))) return RESTRICTED;
    const memorial = s.memorials.find((m) => m.tombId === tomb.id && m.slug === slug);
    if (!memorial) return null;
    return {
      tomb,
      memorial,
      media: s.media.filter((m) => m.memorialId === memorial.id),
      messages: s.messages
        .filter((m) => m.memorialId === memorial.id && m.status === "published")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      siblings: s.memorials.filter((m) => m.tombId === tomb.id && m.id !== memorial.id),
    };
  },

  async countVisit(memorialId) {
    const m = store().memorials.find((x) => x.id === memorialId);
    if (m) m.visits += 1;
  },

  async lightCandle(memorialId) {
    const m = store().memorials.find((x) => x.id === memorialId);
    if (!m) throw new Error("Mémorial introuvable");
    return ++m.candles;
  },

  async dropFlower(memorialId) {
    const m = store().memorials.find((x) => x.id === memorialId);
    if (!m) throw new Error("Mémorial introuvable");
    return ++m.flowers;
  },

  async getCounters(memorialId) {
    const m = store().memorials.find((x) => x.id === memorialId);
    return { candles: m?.candles ?? 0, flowers: m?.flowers ?? 0 };
  },

  async submitMessage(memorialId, input) {
    store().messages.push({
      id: randomUUID(),
      memorialId,
      authorName: input.authorName,
      authorPlace: input.authorPlace,
      body: input.body,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },

  async allow(kind, key, limit, windowSeconds) {
    const s = store();
    const since = Date.now() - windowSeconds * 1000;
    s.events = s.events.filter((e) => e.at > Date.now() - 86_400_000);
    const used = s.events.filter((e) => e.kind === kind && e.key === key && e.at > since).length;
    if (used >= limit) return false;
    s.events.push({ kind, key, at: Date.now() });
    return true;
  },

  async familyOverview(viewer) {
    const s = store();
    const mine = s.members.filter((x) => x.userId === viewer.userId);
    const tombs = s.tombs
      .filter((t) => mine.some((x) => x.tombId === t.id))
      .map((t) => ({ ...withMemorials(t), role: mine.find((x) => x.tombId === t.id)!.role }));
    const guarded = tombs.filter((t) => t.role === "guardian").flatMap((t) => t.memorials);
    const pending = s.messages
      .filter((m) => m.status === "pending" && guarded.some((x) => x.id === m.memorialId))
      .map((m) => ({ ...m, memorialName: fullName(guarded.find((x) => x.id === m.memorialId)!) }));
    const orders = s.orders.filter((o) => o.tombId && tombs.some((t) => t.id === o.tombId));
    return { tombs, pending, orders };
  },

  async managedTomb(viewer, tombId) {
    const s = store();
    const role = roleOf(viewer.userId, tombId);
    const tomb = s.tombs.find((t) => t.id === tombId);
    if (!role || !tomb) return null;
    const full = withMemorials(tomb);
    return {
      ...full,
      role,
      media: s.media.filter((m) => full.memorials.some((x) => x.id === m.memorialId)),
      members: s.members.filter((x) => x.tombId === tombId).map((x) => ({ name: x.name, role: x.role })),
      orders: s.orders.filter((o) => o.tombId === tombId),
    };
  },

  async moderateMessage(viewer, messageId, status) {
    if (viewer.kind !== "family") throw new Error("Réservé à la famille");
    const s = store();
    const msg = s.messages.find((m) => m.id === messageId);
    const mem = msg && s.memorials.find((m) => m.id === msg.memorialId);
    if (!msg || !mem || roleOf(viewer.userId, mem.tombId) !== "guardian") throw new Error("Message introuvable");
    msg.status = status;
  },

  async createMemorial(viewer, input) {
    if (viewer.kind === "anonymous") throw new Error("Connexion requise");
    const s = store();
    let qr = input.code ? s.codes.find((c) => c.code === input.code && !c.tombId) : undefined;
    if (input.code && !qr) throw new Error("Ce code de plaque est inconnu ou déjà utilisé");
    if (!qr) {
      qr = { code: newCode(), batch: "EN-LIGNE" };
      s.codes.push(qr);
    }
    const tomb: Tomb = {
      id: randomUUID(),
      code: qr.code,
      familyName: input.lastName,
      cemetery: input.cemetery,
      locationLabel: input.locationLabel,
      commune: input.commune,
      visibility: input.visibility,
      distributorId: viewer.kind === "distributor" ? viewer.distributorId : qr.distributorId,
    };
    qr.tombId = tomb.id;
    s.tombs.push(tomb);
    const slug = uniqueSlug(tomb.id, slugify(`${input.firstName} ${input.lastName}`));
    s.memorials.push({
      id: randomUUID(),
      tombId: tomb.id,
      slug,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      gender: input.gender,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      birthPlace: input.commune,
      chapters: input.story ? [{ years: "", title: "Sa vie", text: input.story }] : [],
      loves: [],
      candles: 0,
      flowers: 0,
      visits: 0,
    });
    if (viewer.kind === "family") s.members.push({ tombId: tomb.id, userId: viewer.userId, name: viewer.name, role: "guardian" });
    s.orders.unshift({
      id: randomUUID(),
      tombId: tomb.id,
      familyName: input.lastName,
      formula: input.formula,
      amountTtcCents: FORMULAS[input.formula].ttcCents,
      commissionCents: tomb.distributorId ? commissionCents(input.formula, DEMO_DISTRIBUTOR.commissionRate) : 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { code: tomb.code, slug, tombId: tomb.id };
  },

  async addMemorialToTomb(viewer, tombId, input) {
    const s = store();
    if (roleOf(viewer.userId, tombId) !== "guardian") throw new Error("Seul le gardien de la page peut ajouter un défunt");
    if (s.memorials.filter((m) => m.tombId === tombId).length >= 6) throw new Error("Un caveau compte au plus 6 défunts");
    const tomb = s.tombs.find((t) => t.id === tombId)!;
    const id = randomUUID();
    const slug = uniqueSlug(tombId, slugify(`${input.firstName} ${input.lastName}`));
    s.memorials.push({
      id,
      tombId,
      slug,
      ...input,
      birthPlace: tomb.commune,
      chapters: [],
      loves: [],
      candles: 0,
      flowers: 0,
      visits: 0,
    });
    return { id, slug };
  },

  async updateMemorial(viewer, memorialId, patch) {
    const m = guardianMemorial(viewer.userId, memorialId);
    Object.assign(m, patch);
  },

  async prepareUpload(viewer, memorialId) {
    memberMemorial(viewer.userId, memorialId);
    return { mode: "inline" };
  },

  publicUrl(path) {
    return path;
  },

  async addMedia(viewer, memorialId, media) {
    memberMemorial(viewer.userId, memorialId);
    store().media.push({ id: randomUUID(), memorialId, kind: media.kind, url: media.url, caption: media.caption, album: media.album });
  },

  async setPortrait(viewer, memorialId, url) {
    guardianMemorial(viewer.userId, memorialId).portraitUrl = url;
  },

  async deleteMedia(viewer, mediaId) {
    const s = store();
    const media = s.media.find((x) => x.id === mediaId);
    if (!media) throw new Error("Média introuvable");
    guardianMemorial(viewer.userId, media.memorialId);
    s.media = s.media.filter((x) => x.id !== mediaId);
  },

  async createInvitation(viewer, tombId, role) {
    const s = store();
    const tomb = s.tombs.find((t) => t.id === tombId);
    const allowed =
      // Un proche peut inviter d'autres proches ; seul un gardien transmet la gestion.
      (viewer.kind === "family" && (role === "member" ? !!roleOf(viewer.userId, tombId) : roleOf(viewer.userId, tombId) === "guardian")) ||
      (viewer.kind === "distributor" && tomb?.distributorId === viewer.distributorId);
    if (!tomb || !allowed) throw new Error("Vous ne pouvez pas inviter sur cette tombe");
    const token = randomBytes(24).toString("base64url");
    s.invitations.push({ token, tombId, role, expiresAt: Date.now() + 60 * 86_400_000 });
    return token;
  },

  async getInvitation(token) {
    const s = store();
    const inv = s.invitations.find((i) => i.token === token);
    const tomb = inv && s.tombs.find((t) => t.id === inv.tombId);
    if (!inv || !tomb) return null;
    return {
      token,
      tombId: tomb.id,
      familyName: tomb.familyName,
      cemetery: tomb.cemetery,
      memorialNames: s.memorials.filter((m) => m.tombId === tomb.id).map(fullName),
      role: inv.role,
      status: inv.role === "guardian" && inv.acceptedBy ? "used" : inv.expiresAt < Date.now() ? "expired" : "valid",
    };
  },

  async acceptInvitation(viewer, token) {
    const s = store();
    const info = await demoRepo.getInvitation(token);
    if (!info || info.status !== "valid") throw new Error("Cette invitation n’est plus valable");
    const inv = s.invitations.find((i) => i.token === token)!;
    const existing = s.members.find((x) => x.tombId === inv.tombId && x.userId === viewer.userId);
    if (existing) {
      if (inv.role === "guardian") existing.role = "guardian";
    } else {
      s.members.push({ tombId: inv.tombId, userId: viewer.userId, name: viewer.name, role: inv.role });
    }
    inv.acceptedBy = viewer.userId;
    return inv.tombId;
  },

  async distributorOverview(viewer) {
    const s = store();
    const tombs = s.tombs
      .filter((t) => t.distributorId === viewer.distributorId)
      .map((t) => ({ ...withMemorials(t), handedOver: s.members.some((x) => x.tombId === t.id && x.role === "guardian") }));
    return {
      distributor: DEMO_DISTRIBUTOR,
      orders: s.orders.filter((o) => !o.tombId || tombs.some((t) => t.id === o.tombId)),
      freeCodes: s.codes.filter((c) => c.distributorId === viewer.distributorId && !c.tombId),
      tombs,
    };
  },

  async distributorTomb(viewer, tombId) {
    const s = store();
    const tomb = s.tombs.find((t) => t.id === tombId && t.distributorId === viewer.distributorId);
    if (!tomb) return null;
    return {
      ...withMemorials(tomb),
      orders: s.orders.filter((o) => o.tombId === tombId),
      handedOver: s.members.some((x) => x.tombId === tombId && x.role === "guardian"),
    };
  },

  async markOrderPaid(viewer, orderId) {
    if (viewer.kind !== "distributor") throw new Error("Réservé aux distributeurs");
    const s = store();
    const order = s.orders.find((o) => o.id === orderId);
    const tomb = order?.tombId ? s.tombs.find((t) => t.id === order.tombId) : undefined;
    if (!order || tomb?.distributorId !== viewer.distributorId) throw new Error("Commande introuvable");
    order.status = "paid";
    order.paidVia = "distributeur";
  },

  async createQrBatch(viewer, count) {
    if (viewer.kind !== "distributor") throw new Error("Réservé aux distributeurs");
    const s = store();
    const batch = `LOT-${new Date().toISOString().slice(0, 10)}`;
    const created: QrCode[] = [];
    while (created.length < count) {
      const code = newCode();
      if (s.codes.some((c) => c.code === code)) continue;
      const qr = { code, batch, distributorId: viewer.distributorId };
      s.codes.push(qr);
      created.push(qr);
    }
    return created;
  },
};
