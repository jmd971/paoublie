import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

const RESET = "/connexion/nouveau-mot-de-passe";

/**
 * Retour des liens envoyés par e-mail (confirmation d'inscription, mot de passe oublié).
 *
 * Deux formes de lien :
 * - `token_hash` + `type` (modèles d'e-mail adaptés, voir README) : fonctionne même si l'e-mail est ouvert
 *   dans un autre navigateur, par exemple l'application Gmail ;
 * - `code` (modèles par défaut) : ne fonctionne que dans le navigateur où la demande a été faite. Sinon,
 *   l'adresse est tout de même confirmée par Supabase : on invite simplement à se connecter.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawNext = params.get("next") ?? "";
  // Seulement un chemin interne, pour ne pas servir de redirection ouverte.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/espace";
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const signInAgain = (reason: string) =>
    to(`/connexion?${new URLSearchParams({ message: reason, ...(next !== RESET && next !== "/espace" ? { next } : {}) })}`);

  if (!supabaseConfigured()) return to(next);
  if (params.get("error")) return signInAgain(next === RESET ? "lien-expire-mdp" : "lien-expire");

  const db = await supabaseServer();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  if (tokenHash && type) {
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return to(type === "recovery" ? RESET : next);
    return signInAgain(type === "recovery" ? "lien-expire-mdp" : "lien-expire");
  }
  if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return to(next);
    // Lien ouvert dans un autre navigateur : l'inscription est confirmée, mais la session n'a pas pu s'ouvrir ici.
    return signInAgain(next === RESET ? "autre-navigateur-mdp" : "adresse-confirmee");
  }
  return to(next);
}
