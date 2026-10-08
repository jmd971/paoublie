import { randomUUID } from "node:crypto";
import { newCode, slugify } from "../codes";
import { FORMULAS, commissionCents } from "../pricing";
import type { Memorial, MemorialPage, Message, Order, QrCode, Tomb, TombWithMemorials } from "../types";
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
type Store = {
  tombs: Tomb[];
  memorials: Memorial[];
  messages: Message[];
  orders: Order[];
  codes: QrCode[];
  members: { tombId: string; userId: string }[];
};

const g = globalThis as unknown as { __paoublieDemo?: Store };

function store(): Store {
  if (!g.__paoublieDemo) {
    g.__paoublieDemo = {
      tombs: [structuredClone(DEMO_TOMB)],
      memorials: structuredClone(DEMO_MEMORIALS),
      messages: structuredClone(DEMO_MESSAGES),
      orders: structuredClone(DEMO_ORDERS),
      codes: structuredClone(DEMO_CODES),
      members: [{ tombId: DEMO_TOMB.id, userId: "demo-famille" }],
    };
  }
  return g.__paoublieDemo;
}

function withMemorials(t: Tomb): TombWithMemorials {
  return { ...t, memorials: store().memorials.filter((m) => m.tombId === t.id) };
}

function fullName(m: Memorial) {
  return `${m.firstName} ${m.lastName}`;
}

export const demoRepo: Repo = {
  async getTombByCode(code) {
    const t = store().tombs.find((x) => x.code === code);
    return t ? withMemorials(t) : null;
  },

  async isFreeCode(code) {
    const c = store().codes.find((x) => x.code === code);
    return !!c && !c.tombId;
  },

  async getMemorialPage(code, slug): Promise<MemorialPage | null> {
    const s = store();
    const tomb = s.tombs.find((t) => t.code === code);
    if (!tomb) return null;
    const memorial = s.memorials.find((m) => m.tombId === tomb.id && m.slug === slug);
    if (!memorial) return null;
    return {
      tomb,
      memorial,
      media: DEMO_MEDIA.filter((m) => m.memorialId === memorial.id),
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

  async familyOverview(viewer) {
    const s = store();
    const tombIds = s.members.filter((x) => x.userId === viewer.userId).map((x) => x.tombId);
    const tombs = s.tombs.filter((t) => tombIds.includes(t.id)).map(withMemorials);
    const memorials = tombs.flatMap((t) => t.memorials);
    const pending = s.messages
      .filter((m) => m.status === "pending" && memorials.some((x) => x.id === m.memorialId))
      .map((m) => ({ ...m, memorialName: fullName(memorials.find((x) => x.id === m.memorialId)!) }));
    const orders = s.orders.filter((o) => o.tombId && tombIds.includes(o.tombId));
    return { tombs, pending, orders };
  },

  async moderateMessage(viewer, messageId, status) {
    if (viewer.kind !== "family") throw new Error("Réservé à la famille");
    const s = store();
    const msg = s.messages.find((m) => m.id === messageId);
    const mem = msg && s.memorials.find((m) => m.id === msg.memorialId);
    const allowed = mem && s.members.some((x) => x.userId === viewer.userId && x.tombId === mem.tombId);
    if (!msg || !allowed) throw new Error("Message introuvable");
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
    const slug = slugify(`${input.firstName} ${input.lastName}`) || "memorial";
    s.memorials.push({
      id: randomUUID(),
      tombId: tomb.id,
      slug,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      birthPlace: input.commune,
      chapters: input.story ? [{ years: "", title: "Sa vie", text: input.story }] : [],
      loves: [],
      candles: 0,
      flowers: 0,
      visits: 0,
    });
    if (viewer.kind === "family") s.members.push({ tombId: tomb.id, userId: viewer.userId });
    const rate = DEMO_DISTRIBUTOR.commissionRate;
    s.orders.unshift({
      id: randomUUID(),
      tombId: tomb.id,
      familyName: input.lastName,
      formula: input.formula,
      amountTtcCents: FORMULAS[input.formula].ttcCents,
      commissionCents: tomb.distributorId ? commissionCents(input.formula, rate) : 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { code: tomb.code, slug };
  },

  async distributorOverview(viewer) {
    const s = store();
    const tombs = s.tombs.filter((t) => t.distributorId === viewer.distributorId).map(withMemorials);
    return {
      distributor: DEMO_DISTRIBUTOR,
      orders: s.orders.filter((o) => !o.tombId || tombs.some((t) => t.id === o.tombId)),
      freeCodes: s.codes.filter((c) => c.distributorId === viewer.distributorId && !c.tombId),
      tombs,
    };
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
