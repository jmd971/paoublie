import { randomInt } from "node:crypto";

// Pas de 0/O, 1/I/L : un code doit pouvoir se recopier à la main depuis une plaque.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{5,8}$/.test(code) ? code : null;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Adresse publique du site, utilisée dans les QR codes et les liens d'invitation.
 * Sur Vercel, à défaut de NEXT_PUBLIC_SITE_URL, on prend le domaine de production du projet.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const url = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function plaqueUrl(code: string): string {
  return `${siteUrl()}/m/${code}`;
}

export function invitationUrl(token: string): string {
  return `${siteUrl()}/invitation/${token}`;
}
