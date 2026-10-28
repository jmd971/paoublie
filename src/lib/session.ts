import "server-only";
import { demoViewer } from "./demo-session";
import { isDemo } from "./repo";
import { supabaseAdmin, supabaseServer } from "./supabase/server";
import type { Viewer } from "./types";

export { DEMO_ROLE_COOKIE } from "./demo-session";

/** Qui consulte la page ? */
export async function getViewer(): Promise<Viewer> {
  if (isDemo) return demoViewer();
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { kind: "anonymous" };
  let { data: profile } = await db.from("profiles").select("full_name, role, distributor_id").eq("id", user.id).maybeSingle();
  if (!profile) {
    // Filet de sécurité si le trigger de création de profil n'a pas joué (compte antérieur, migration en retard).
    const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null;
    await supabaseAdmin().from("profiles").upsert({ id: user.id, full_name: fullName }, { onConflict: "id", ignoreDuplicates: true });
    profile = { full_name: fullName, role: "family", distributor_id: null };
  }
  const name = profile.full_name ?? user.email ?? "Mon compte";
  if (profile.role === "distributor" && profile.distributor_id) {
    return { kind: "distributor", userId: user.id, name, distributorId: profile.distributor_id };
  }
  return { kind: "family", userId: user.id, name };
}
