import type { Formula } from "./types";

/** TVA applicable en Guadeloupe. */
export const VAT_RATE = 0.085;

export const FORMULAS: Record<Formula, { name: string; htCents: number; ttcCents: number; pitch: string; items: string[] }> = {
  essentiel: {
    name: "Essentiel",
    htCents: 13900,
    ttcCents: 15100,
    pitch: "Pour les familles qui créent elles-mêmes la page",
    items: [
      "Plaque aluminium anodisé avec QR, 6 × 7,5 cm",
      "Mémorial à vie : photos, vidéos, voix, biographie",
      "Jusqu’à 3 défunts sur le même QR",
      "Kit de pose adhésif",
    ],
  },
  memoire: {
    name: "Mémoire",
    htCents: 29000,
    ttcCents: 31500,
    pitch: "Pour les familles qui veulent être accompagnées",
    items: [
      "Tout Essentiel",
      "Conseiller à domicile, 1 heure",
      "Numérisation de 50 photos d’album",
      "Biographie rédigée avec la famille",
    ],
  },
  heritage: {
    name: "Héritage",
    htCents: 49000,
    ttcCents: 53200,
    pitch: "Pour un hommage complet, transmis aux générations",
    items: ["Tout Mémoire", "Film hommage de 3 minutes", "QR gravé dans le granit", "Pose professionnelle incluse"],
  },
};

/** Commission versée au distributeur, calculée sur le montant HT. */
export function commissionCents(formula: Formula, rate: number): number {
  return Math.round(FORMULAS[formula].htCents * rate);
}

export function euros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
