import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Empreinte du visiteur pour limiter les abus. L'adresse IP n'est jamais stockée en clair :
 * on garde un hachage salé, renouvelé chaque jour.
 */
export async function visitorKey(scope: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnu";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.RATE_LIMIT_SALT ?? "pa-oublie";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${scope}`).digest("hex").slice(0, 32);
}

/** Un message de livre d'or qui ressemble à de la publicité. */
export function looksLikeSpam(text: string): boolean {
  const links = text.match(/https?:\/\/|www\.|\.(com|net|org|fr|io)\b/gi)?.length ?? 0;
  return links > 1;
}
