import type { Distributor, Media, Memorial, Message, Order, QrCode, Tomb } from "../types";

// Données fictives de démonstration : la famille Anatole, de Petit-Canal.

export const DEMO_DISTRIBUTOR: Distributor = {
  id: "dist-demo",
  name: "Pompes funèbres de démonstration",
  kind: "pompes_funebres",
  commune: "Petit-Canal",
  commissionRate: 0.25,
};

export const DEMO_TOMB: Tomb = {
  id: "tomb-anatole",
  code: "7KQ2XM",
  familyName: "Anatole",
  cemetery: "Cimetière paysager de Petit-Canal",
  locationLabel: "Allée A, caveau 12",
  commune: "Petit-Canal",
  visibility: "public",
  distributorId: DEMO_DISTRIBUTOR.id,
};

export const DEMO_MEMORIALS: Memorial[] = [
  {
    id: "mem-leonise",
    tombId: DEMO_TOMB.id,
    slug: "leonise-anatole",
    firstName: "Léonise",
    lastName: "Anatole",
    nickname: "Man Nini",
    birthDate: "1938-03-12",
    deathDate: "2026-02-04",
    birthPlace: "Petit-Canal",
    quote: "Pa ni pwoblèm, ni solisyon.",
    quoteTranslation: "Il n’y a pas de problème, il n’y a que des solutions. Sa phrase de tous les jours.",
    chapters: [
      {
        years: "1938 – 1955",
        title: "Une enfance au bourg",
        text: "Dernière de sept enfants, Léonise grandit dans la case de ses parents, derrière l’église. Son père, Joseph, coupe la canne ; sa mère, Clémence, coud pour tout le quartier. À douze ans, elle sait déjà tenir les comptes de la famille.",
        caption: "L’église du bourg, où elle a fait sa communion",
        image: "eglise",
      },
      {
        years: "1961",
        title: "Eugène",
        text: "Elle rencontre Eugène au bal de la fête patronale. Il est pêcheur à Port-Louis, timide, et danse mal la biguine. Ils se marient au printemps suivant et resteront cinquante ans ensemble.",
        caption: "Mariage à Petit-Canal, 15 avril 1961",
        image: "mariage",
      },
      {
        years: "1964 – 2004",
        title: "La boutique de la rue principale",
        text: "Pendant quarante ans, on vient chez Man Nini pour le pain, la morue et le rhum, et on reste pour ses histoires. Son carnet de crédit, elle ne l’a jamais réclamé aux familles qui traversaient un mauvais moment.",
        caption: "La boutique en 1971",
        image: "boutique",
      },
      {
        years: "2004 – 2026",
        title: "Le jardin et les petits-enfants",
        text: "Elle confie la boutique à son fils Max et se consacre à son jardin, à son chapelet et à ses onze petits-enfants. Le dimanche, elle appelle Montréal en vidéo et demande toujours s’il fait froid.",
        caption: "Son jardin, ses hibiscus et son pied de bois d’Inde",
        image: "jardin",
      },
    ],
    loves: [
      { title: "Le dombré crevettes", text: "« La pâte doit être douce comme une joue d’enfant. » On secoue la marmite, on ne remue jamais à la cuillère." },
      { title: "La musique", text: "La biguine du samedi soir et les cantiques de Noël, qu’elle chantait plus fort que tout le monde." },
      { title: "Son jardin", text: "Ses hibiscus rouges, son pied de bois d’Inde et les herbes pour les tisanes de toute la rue." },
    ],
    candles: 129,
    flowers: 23,
    visits: 1284,
  },
  {
    id: "mem-eugene",
    tombId: DEMO_TOMB.id,
    slug: "eugene-anatole",
    firstName: "Eugène",
    lastName: "Anatole",
    relation: "son époux",
    birthDate: "1932-07-02",
    deathDate: "2011-09-18",
    birthPlace: "Port-Louis",
    chapters: [
      {
        years: "1932 – 2011",
        title: "Pêcheur à Port-Louis",
        text: "Eugène a passé sa vie sur son canot, parti avant l’aube et rentré avant midi. Il connaissait chaque passe du lagon et ne racontait jamais deux fois la même histoire de pêche.",
        image: "mer",
      },
    ],
    loves: [],
    candles: 54,
    flowers: 8,
    visits: 412,
  },
];

export const DEMO_MEDIA: Media[] = [
  { id: "m1", memorialId: "mem-leonise", kind: "video", caption: "La surprise de ses 80 ans", album: "Famille", duration: "2:14" },
  { id: "m2", memorialId: "mem-leonise", kind: "photo", caption: "La boutique, 1971", album: "La boutique" },
  { id: "m3", memorialId: "mem-leonise", kind: "photo", caption: "Mariage, 1961", album: "Famille" },
  { id: "m4", memorialId: "mem-leonise", kind: "video", caption: "Chanté Nwèl, 2015", album: "Fêtes", duration: "3:40" },
  { id: "m5", memorialId: "mem-leonise", kind: "photo", caption: "Port-Louis, avec Eugène", album: "Famille" },
  { id: "m6", memorialId: "mem-leonise", kind: "photo", caption: "Toussaint 2019", album: "Fêtes" },
  { id: "a1", memorialId: "mem-leonise", kind: "audio", caption: "La recette du dombré, racontée par elle", duration: "0:42" },
  { id: "a2", memorialId: "mem-leonise", kind: "audio", caption: "Son cantique préféré, au chanté Nwèl", duration: "1:58" },
  { id: "a3", memorialId: "mem-leonise", kind: "audio", caption: "Max raconte le carnet de crédit", duration: "1:12" },
];

const day = 24 * 3600 * 1000;
const ago = (days: number) => new Date(Date.UTC(2026, 9, 7) - days * day).toISOString();

export const DEMO_MESSAGES: Message[] = [
  { id: "g1", memorialId: "mem-leonise", authorName: "Josette, sa fille", authorPlace: "Petit-Canal", body: "Manman, chaque dimanche je pense à ton café et à tes rires dans la cour.", status: "published", createdAt: ago(2) },
  { id: "g2", memorialId: "mem-leonise", authorName: "Patrick, petit-fils", authorPlace: "Créteil", body: "Nou pa ké janmen bliyé-w. Merci à toute la famille pour les photos de la veillée, j’avais l’impression d’y être.", status: "published", createdAt: ago(5) },
  { id: "g3", memorialId: "mem-leonise", authorName: "Raymond", authorPlace: "Morne-à-l’Eau", body: "Pour la dame qui me faisait crédit quand papa était malade. Je ne l’ai jamais oublié.", status: "published", createdAt: ago(8) },
  { id: "g4", memorialId: "mem-leonise", authorName: "Sandra, petite-fille", authorPlace: "Montréal", body: "Grand-maman, il neige ici. Tu m’aurais encore demandé si j’avais mis mon manteau.", status: "pending", createdAt: ago(1) },
  { id: "g5", memorialId: "mem-leonise", authorName: "Famille Bernadin", authorPlace: "Petit-Canal", body: "Pour la voisine qui chantait plus fort que toute la chorale.", status: "pending", createdAt: ago(1) },
];

export const DEMO_ORDERS: Order[] = [
  { id: "o1", tombId: DEMO_TOMB.id, familyName: "Anatole", formula: "memoire", amountTtcCents: 31500, commissionCents: 7250, status: "paid", createdAt: ago(20) },
  { id: "o2", familyName: "Désir", formula: "essentiel", amountTtcCents: 15100, commissionCents: 3475, status: "paid", createdAt: ago(9) },
  { id: "o3", familyName: "Lubin", formula: "heritage", amountTtcCents: 53200, commissionCents: 12250, status: "pending", createdAt: ago(1) },
];

export const DEMO_CODES: QrCode[] = [
  { code: DEMO_TOMB.code, batch: "DEMO-01", tombId: DEMO_TOMB.id, distributorId: DEMO_DISTRIBUTOR.id },
  { code: "H4RT8W", batch: "DEMO-01", distributorId: DEMO_DISTRIBUTOR.id },
  { code: "P9N3QE", batch: "DEMO-01", distributorId: DEMO_DISTRIBUTOR.id },
  { code: "Z5VK2C", batch: "DEMO-01", distributorId: DEMO_DISTRIBUTOR.id },
];
