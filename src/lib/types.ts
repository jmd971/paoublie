export type Visibility = "public" | "family";
export type MessageStatus = "pending" | "published" | "private";
export type Formula = "essentiel" | "memoire" | "heritage";

export type Chapter = { years: string; title: string; text: string; caption?: string; image?: string };
export type Love = { title: string; text: string };

export type Memorial = {
  id: string;
  tombId: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname?: string;
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
  kind: "photo" | "video" | "audio";
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
  createdAt: string;
};

export type QrCode = { code: string; batch: string; tombId?: string; distributorId?: string };

export type NewMemorialInput = {
  code?: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  birthDate?: string;
  deathDate?: string;
  commune: string;
  cemetery: string;
  locationLabel?: string;
  story?: string;
  formula: Formula;
  visibility: Visibility;
};

export type Viewer =
  | { kind: "anonymous" }
  | { kind: "family"; userId: string; name: string }
  | { kind: "distributor"; userId: string; name: string; distributorId: string };
