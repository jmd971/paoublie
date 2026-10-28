import type { Metadata } from "next";
import Link from "next/link";
import { acceptInvitation } from "@/app/actions";
import { AuthForms } from "@/components/auth-forms";
import { SiteHeader } from "@/components/site-header";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

export default async function Invitation(props: PageProps<"/invitation/[token]">) {
  const { token } = await props.params;
  const [viewer, info] = await Promise.all([getViewer(), repo.getInvitation(token)]);
  const next = `/invitation/${token}`;

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-14">
        {!info ? (
          <>
            <h1 className="font-serif text-3xl font-bold">Lien introuvable</h1>
            <p className="text-ink-2">Ce lien d’invitation n’existe pas. Vérifiez qu’il a été copié en entier, ou demandez-en un nouveau.</p>
          </>
        ) : (
          <>
            <p className="eyebrow">Invitation</p>
            <h1 className="font-serif text-3xl font-bold">Caveau de la famille {info.familyName}</h1>
            <p className="text-ink-2">
              {info.memorialNames.join(", ")} · {info.cemetery}
            </p>
            <p>
              {info.role === "guardian"
                ? "On vous confie la page de mémoire : vous pourrez écrire son histoire, ajouter photos et voix, valider les messages du livre d’or et inviter vos proches."
                : "La famille vous invite à enrichir la page : ajoutez vos photos, vidéos et enregistrements."}
            </p>
            {info.status === "used" && <p className="border border-rule bg-surface p-4 text-sm">Ce lien a déjà été utilisé. Demandez un nouveau lien si besoin.</p>}
            {info.status === "expired" && <p className="border border-rule bg-surface p-4 text-sm">Ce lien a expiré. Demandez un nouveau lien à la famille.</p>}
            {info.status === "valid" &&
              (viewer.kind === "family" ? (
                <form action={acceptInvitation}>
                  <input type="hidden" name="token" value={token} />
                  <button type="submit" className="btn btn-amber">
                    Accepter et ouvrir la page
                  </button>
                </form>
              ) : viewer.kind === "distributor" ? (
                <p className="text-sm text-muted">Vous êtes connecté en tant que professionnel. Ce lien est destiné à la famille.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {isDemo ? (
                    <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="btn btn-amber self-start">
                      Continuer
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm text-ink-2">
                        Créez votre compte (ou connectez-vous si vous en avez déjà un) : l’invitation sera acceptée aussitôt.
                      </p>
                      <AuthForms next={`/invitation/${token}/accepter`} defaultTab="inscription" />
                    </>
                  )}
                </div>
              ))}
          </>
        )}
      </main>
    </>
  );
}
