import type {
  Distributor,
  MemorialPage,
  Message,
  MessageStatus,
  NewMemorialInput,
  Order,
  QrCode,
  TombWithMemorials,
  Viewer,
} from "../types";

export type PendingMessage = Message & { memorialName: string };

export type FamilyOverview = {
  tombs: TombWithMemorials[];
  pending: PendingMessage[];
  orders: Order[];
};

export type DistributorOverview = {
  distributor: Distributor;
  orders: Order[];
  freeCodes: QrCode[];
  tombs: TombWithMemorials[];
};

/** Accès aux données. Deux implémentations : démonstration en mémoire et Supabase. */
export interface Repo {
  getTombByCode(code: string): Promise<TombWithMemorials | null>;
  isFreeCode(code: string): Promise<boolean>;
  getMemorialPage(code: string, slug: string): Promise<MemorialPage | null>;
  countVisit(memorialId: string): Promise<void>;
  lightCandle(memorialId: string): Promise<number>;
  dropFlower(memorialId: string): Promise<number>;
  submitMessage(memorialId: string, input: { authorName: string; authorPlace?: string; body: string }): Promise<void>;
  familyOverview(viewer: Extract<Viewer, { kind: "family" }>): Promise<FamilyOverview>;
  moderateMessage(viewer: Viewer, messageId: string, status: MessageStatus): Promise<void>;
  createMemorial(viewer: Viewer, input: NewMemorialInput): Promise<{ code: string; slug: string }>;
  distributorOverview(viewer: Extract<Viewer, { kind: "distributor" }>): Promise<DistributorOverview>;
  createQrBatch(viewer: Viewer, count: number): Promise<QrCode[]>;
}
