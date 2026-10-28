import type {
  Distributor,
  DistributorTomb,
  ExtraMemorialInput,
  InvitationInfo,
  ManagedTomb,
  MemberRole,
  MemorialPage,
  MemorialPatch,
  Message,
  MessageStatus,
  NewMedia,
  NewMemorialInput,
  Order,
  QrCode,
  RESTRICTED,
  TombWithMemorials,
  UploadTarget,
  Viewer,
} from "../types";

export type PendingMessage = Message & { memorialName: string };

export type FamilyOverview = {
  tombs: (TombWithMemorials & { role: MemberRole })[];
  pending: PendingMessage[];
  orders: Order[];
};

export type DistributorOverview = {
  distributor: Distributor;
  orders: Order[];
  freeCodes: QrCode[];
  tombs: (TombWithMemorials & { handedOver: boolean })[];
};

type Family = Extract<Viewer, { kind: "family" }>;
type Pro = Extract<Viewer, { kind: "distributor" }>;

/** Accès aux données. Deux implémentations : démonstration en mémoire et Supabase. */
export interface Repo {
  // Pages publiques
  getTombByCode(code: string): Promise<TombWithMemorials | typeof RESTRICTED | null>;
  isFreeCode(code: string): Promise<boolean>;
  getMemorialPage(code: string, slug: string): Promise<MemorialPage | typeof RESTRICTED | null>;
  countVisit(memorialId: string): Promise<void>;
  lightCandle(memorialId: string): Promise<number>;
  dropFlower(memorialId: string): Promise<number>;
  getCounters(memorialId: string): Promise<{ candles: number; flowers: number }>;
  submitMessage(memorialId: string, input: { authorName: string; authorPlace?: string; body: string }): Promise<void>;
  /** Enregistre un geste et dit s'il reste sous la limite (anti-abus). */
  allow(kind: string, key: string, limit: number, windowSeconds: number): Promise<boolean>;

  // Famille
  familyOverview(viewer: Family): Promise<FamilyOverview>;
  managedTomb(viewer: Family, tombId: string): Promise<ManagedTomb | null>;
  moderateMessage(viewer: Viewer, messageId: string, status: MessageStatus): Promise<void>;
  createMemorial(viewer: Viewer, input: NewMemorialInput): Promise<{ code: string; slug: string; tombId: string }>;
  addMemorialToTomb(viewer: Family, tombId: string, input: ExtraMemorialInput): Promise<{ id: string; slug: string }>;
  updateMemorial(viewer: Family, memorialId: string, patch: MemorialPatch): Promise<void>;
  prepareUpload(viewer: Family, memorialId: string, extension: string): Promise<UploadTarget & { path?: string }>;
  publicUrl(path: string): string;
  addMedia(viewer: Family, memorialId: string, media: NewMedia): Promise<void>;
  setPortrait(viewer: Family, memorialId: string, url: string): Promise<void>;
  deleteMedia(viewer: Family, mediaId: string): Promise<void>;

  // Invitations
  createInvitation(viewer: Viewer, tombId: string, role: MemberRole): Promise<string>;
  getInvitation(token: string): Promise<InvitationInfo | null>;
  acceptInvitation(viewer: Family, token: string): Promise<string>;

  // Distributeurs
  distributorOverview(viewer: Pro): Promise<DistributorOverview>;
  distributorTomb(viewer: Pro, tombId: string): Promise<DistributorTomb | null>;
  markOrderPaid(viewer: Viewer, orderId: string): Promise<void>;
  createQrBatch(viewer: Viewer, count: number): Promise<QrCode[]>;
}
