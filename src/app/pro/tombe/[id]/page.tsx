import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { markOrderPaid } from "@/app/actions";
import { InviteLink } from "@/components/invite-link";
import { SiteHeader } from "@/components/site-header";
import { lifeSpan } from "@/lib/format";
import { FORMULAS, euros } from "@/lib/pricing";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Suivi de la famille", robots: { index: false } };

export default async function ProTomb(props: PageProps<"/pro/tombe/[id]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  if (viewer.kind === "family") redirect(`/espace/tombe/${id}`);
  if (viewer.kind !== "distributor") redirect("/connexion");
  const tomb = await repo.distributorTomb(viewer, id);
  if (!tomb) notFound();
  const isNew = (await props.searchParams).nouveau === "1";

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
        {isNew && (
          <p className="border border-green bg-green-soft p-3 text-sm text-green">
            Le mémorial est créé. Envoyez maintenant le lien à la famille pour qu’elle en prenne la main.
          </p>
        )}
        <div>
          <Link href="/pro" className="text-sm text-muted underline-offset-2 hover:underline">
            ‹ Espace pro
          </Link>
          <p className="eyebrow mt-4">Plaque {tomb.code}</p>
          <h1 className="font-serif text-3xl font-bold">Famille {tomb.familyName}</h1>
          <p className="text-sm text-muted">
            {tomb.memorials
              .map((m) => {
                const span = lifeSpan(m.birthDate, m.deathDate);
                return `${m.firstName} ${m.lastName}${span ? ` (${span})` : ""}`;
              })
              .join(", ")} · {tomb.cemetery}
          </p>
          <Link href={`/m/${tomb.code}`} className="mt-2 inline-block text-sm font-medium text-green">
            Voir la page publique
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Remise à la famille</h2>
          {tomb.handedOver ? (
            <p className="border border-green bg-green-soft p-4 text-sm text-green">
              La famille a pris la main sur la page. Elle la complète et invite ses proches elle-même.
            </p>
          ) : (
            <>
              <p className="text-ink-2">
                Envoyez ce lien au référent de la famille. En l’ouvrant, il devient gardien de la page : il pourra écrire l’histoire,
                ajouter photos et voix, et inviter ses proches.
              </p>
              <InviteLink
                tombId={tomb.id}
                role="guardian"
                label="Créer le lien pour la famille"
                message={`Bonjour, voici le lien pour compléter la page de mémoire de la famille ${tomb.familyName} :`}
              />
            </>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Règlement</h2>
          {tomb.orders.length === 0 && <p className="text-muted">Aucune vente enregistrée.</p>}
          {tomb.orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-surface p-4">
              <span className="text-sm">
                Formule {FORMULAS[o.formula].name} · <span className="font-mono">{euros(o.amountTtcCents)}</span> TTC · commission{" "}
                <span className="font-mono">{euros(o.commissionCents)}</span>
              </span>
              {o.status === "pending" ? (
                <form action={markOrderPaid}>
                  <input type="hidden" name="orderId" value={o.id} />
                  <button type="submit" className="btn min-h-10 text-sm">
                    Marquer comme réglée
                  </button>
                </form>
              ) : (
                <span className={`px-2 py-0.5 text-xs font-medium ${o.status === "paid" ? "bg-green-soft text-green" : "bg-rule text-muted"}`}>
                  {o.status === "paid" ? `Réglée${o.paidVia === "distributeur" ? " auprès de vous" : ""}` : "Annulée"}
                </span>
              )}
            </div>
          ))}
          <p className="text-xs text-muted">
            Vous encaissez la famille directement. Le reversement à Pa Oublié, commission déduite, suit votre convention de distribution.
          </p>
        </section>
      </main>
    </>
  );
}
