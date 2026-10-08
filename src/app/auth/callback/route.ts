import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

/** Retour du lien de connexion envoyé par e-mail. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && supabaseConfigured()) {
    const db = await supabaseServer();
    await db.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/espace", request.url));
}
