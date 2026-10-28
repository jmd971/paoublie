/**
 * Informations de l'éditeur, reprises par les pages légales.
 * À adapter si Pa Oublié est porté par une société distincte.
 */
export const PUBLISHER = {
  name: "Siboard Consulting",
  address: "73 rue Vatable, 97110 Pointe-à-Pitre, Guadeloupe",
  siret: "890 805 989 00013",
  vat: "FR79890805989",
  director: "le gérant de Siboard Consulting",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@paoublie.fr",
};

export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
};

export const LEGAL_UPDATED = "28 octobre 2026";
