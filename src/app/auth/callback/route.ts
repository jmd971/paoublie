import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

/** Retour du lien de connexion envoyé par e-mail. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "";
  if (code && supabaseConfigured()) {
    const db = await supabaseServer();
    await db.auth.exchangeCodeForSession(code);
  }
  // Seulement un chemin interne, pour ne pas servir de redirection ouverte.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/espace";
  return NextResponse.redirect(new URL(target, request.url));
}
