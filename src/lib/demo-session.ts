import "server-only";
import { cookies } from "next/headers";
import { DEMO_DISTRIBUTOR } from "./repo/demo-data";
import type { Viewer } from "./types";

export const DEMO_ROLE_COOKIE = "po_demo_role";

/** En démonstration, le rôle se choisit sur la page d'accueil et vit dans un cookie. */
export async function demoViewer(): Promise<Viewer> {
  const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
  if (role === "family") return { kind: "family", userId: "demo-famille", name: "Josette Anatole" };
  if (role === "family2") return { kind: "family", userId: "demo-proche", name: "Patrick Anatole" };
  if (role === "distributor") {
    return { kind: "distributor", userId: "demo-pro", name: "Agence de démonstration", distributorId: DEMO_DISTRIBUTOR.id };
  }
  return { kind: "anonymous" };
}
