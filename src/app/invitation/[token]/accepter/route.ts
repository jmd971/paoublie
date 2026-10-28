import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

/**
 * Point d'arrivée après la création du compte ou la connexion depuis une invitation :
 * l'invitation est acceptée aussitôt, sans clic supplémentaire.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/invitation/[token]/accepter">) {
  const { token } = await ctx.params;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const viewer = await getViewer();
  if (viewer.kind !== "family") return to(`/invitation/${encodeURIComponent(token)}`);
  try {
    const tombId = await repo.acceptInvitation(viewer, token);
    return to(`/espace/tombe/${tombId}?bienvenue=1`);
  } catch {
    // Lien expiré ou déjà utilisé : la page d'invitation l'explique.
    return to(`/invitation/${encodeURIComponent(token)}`);
  }
}
