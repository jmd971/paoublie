import "server-only";
import { cookies } from "next/headers";
import { DEMO_DISTRIBUTOR } from "./repo/demo-data";
import { isDemo } from "./repo";
import { supabaseServer } from "./supabase/server";
import type { Viewer } from "./types";

export const DEMO_ROLE_COOKIE = "po_demo_role";

/** Qui consulte la page ? En démonstration, le rôle se choisit sur la page d'accueil. */
export async function getViewer(): Promise<Viewer> {
  if (isDemo) {
    const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
    if (role === "family") return { kind: "family", userId: "demo-famille", name: "Josette Anatole" };
    if (role === "distributor") {
      return { kind: "distributor", userId: "demo-pro", name: "Agence de démonstration", distributorId: DEMO_DISTRIBUTOR.id };
    }
    return { kind: "anonymous" };
  }
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { kind: "anonymous" };
  const { data: profile } = await db.from("profiles").select("full_name, role, distributor_id").eq("id", user.id).maybeSingle();
  const name = profile?.full_name ?? user.email ?? "Mon compte";
  if (profile?.role === "distributor" && profile.distributor_id) {
    return { kind: "distributor", userId: user.id, name, distributorId: profile.distributor_id };
  }
  return { kind: "family", userId: user.id, name };
}
