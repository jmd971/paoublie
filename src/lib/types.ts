export type Visibility = "public" | "family";
export type MessageStatus = "pending" | "published" | "private";
export type Formula = "essentiel" | "memoire" | "heritage";
export type Gender = "f" | "m";
export type MemberRole = "guardian" | "member";
export type MediaKind = "photo" | "video" | "audio";

export type Chapter = { years: string; title: string; text: string; caption?: string; image?: string };
export type Love = { title: string; text: string };

export type Memorial = {
  id: string;
  tombId: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: Gender;
  relation?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  quote?: string;
  quoteTranslation?: string;
  chapters: Chapter[];
  loves: Love[];
  portraitUrl?: string;
  candles: number;
  flowers: number;
  visits: number;
};

export type Media = {
  id: string;
  memorialId: string;
  kind: MediaKind;
  url?: string;
  caption: string;
  album?: string;
  duration?: string;
};

export type Message = {
  id: string;
  memorialId: string;
  authorName: string;
  authorPlace?: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
};

export type Tomb = {
  id: string;
  code: string;
  familyName: string;
  cemetery: string;
  locationLabel?: string;
  commune: string;
  visibility: Visibility;
  distributorId?: string;
};

export type TombWithMemorials = Tomb & { memorials: Memorial[] };

export type MemorialPage = {
  tomb: Tomb;
  memorial: Memorial;
  media: Media[];
  messages: Message[];
  siblings: Memorial[];
};

/** Une page réservée à la famille, consultée par quelqu'un qui n'en fait pas partie. */
export const RESTRICTED = "restricted" as const;

export type Distributor = {
  id: string;
  name: string;
  kind: "pompes_funebres" | "marbrier" | "assureur" | "fleuriste" | "autre";
  commune?: string;
  commissionRate: number;
};

export type Order = {
  id: string;
  tombId?: string;
  familyName: string;
  formula: Formula;
  amountTtcCents: number;
  commissionCents: number;
  status: "pending" | "paid" | "cancelled";
  paidVia?: "distributeur" | "virement" | "carte";
  createdAt: string;
};

export type QrCode = { code: string; batch: string; tombId?: string; distributorId?: string };

export type NewMemorialInput = {
  code?: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: Gender;
  birthDate?: string;
  deathDate?: string;
  commune: string;
  cemetery: string;
  locationLabel?: string;
  story?: string;
  formula: Formula;
  visibility: Visibility;
};

/** Défunt ajouté sur une tombe qui existe déjà. */
export type ExtraMemorialInput = {
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: Gender;
  relation?: string;
  birthDate?: string;
  deathDate?: string;
};

export type MemorialPatch = {
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: Gender;
  relation?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  quote?: string;
  quoteTranslation?: string;
  chapters: Chapter[];
  loves: Love[];
};

/** Tombe vue par sa famille, avec ce qu'il faut pour la gérer. */
export type ManagedTomb = TombWithMemorials & {
  role: MemberRole;
  media: Media[];
  members: { name: string; role: MemberRole }[];
  orders: Order[];
};

/** Tombe vue par le distributeur qui l'a vendue. */
export type DistributorTomb = TombWithMemorials & {
  orders: Order[];
  handedOver: boolean;
};

export type InvitationInfo = {
  token: string;
  tombId: string;
  familyName: string;
  cemetery: string;
  memorialNames: string[];
  role: MemberRole;
  status: "valid" | "expired" | "used";
};

export type NewMedia = {
  kind: MediaKind;
  caption: string;
  album?: string;
  url: string;
  storagePath?: string;
};

/** Où envoyer un fichier : directement au stockage Supabase, ou au serveur en démonstration. */
export type UploadTarget =
  | { mode: "storage"; bucket: string; path: string; token: string; supabaseUrl: string; anonKey: string }
  | { mode: "inline" };

export type Viewer =
  | { kind: "anonymous" }
  | { kind: "family"; userId: string; name: string }
  | { kind: "distributor"; userId: string; name: string; distributorId: string };
