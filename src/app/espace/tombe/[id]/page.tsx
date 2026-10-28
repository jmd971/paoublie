import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteLink } from "@/components/invite-link";
import { Face } from "@/components/portrait";
import { SiteHeader } from "@/components/site-header";
import { count, lifeSpan } from "@/lib/format";
import { FORMULAS, euros } from "@/lib/pricing";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { AddMemorialForm } from "./add-memorial-form";

export const metadata: Metadata = { title: "Gérer le mémorial", robots: { index: false } };

const MAX_MEMORIALS = 6;

export default async function ManageTomb(props: PageProps<"/espace/tombe/[id]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  if (viewer.kind === "distributor") redirect(`/pro/tombe/${id}`);
  if (viewer.kind !== "family") redirect(`/connexion?next=${encodeURIComponent(`/espace/tombe/${id}`)}`);
  const tomb = await repo.managedTomb(viewer, id);
  if (!tomb) notFound();
  const query = await props.searchParams;
  const guardian = tomb.role === "guardian";
  const invite = `Pour que nos proches puissent ajouter leurs photos et souvenirs de la famille ${tomb.familyName} :`;

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
        {query.nouveau === "1" && (
          <p className="border border-green bg-green-soft p-3 text-sm text-green">
            Le mémorial est créé. Complétez maintenant son histoire et ajoutez des photos.
          </p>
        )}
        {query.bienvenue === "1" && (
          <p className="border border-green bg-green-soft p-3 text-sm text-green">
            Bienvenue. Vous pouvez maintenant compléter la page{guardian ? " et inviter vos proches" : ""}.
          </p>
        )}
        <div>
          <Link href="/espace" className="text-sm text-muted underline-offset-2 hover:underline">
            ‹ Mon espace
          </Link>
          <p className="eyebrow mt-4">Plaque {tomb.code}</p>
          <h1 className="font-serif text-3xl font-bold">Caveau de la famille {tomb.familyName}</h1>
          <p className="text-sm text-muted">
            {tomb.cemetery}
            {tomb.locationLabel ? ` · ${tomb.locationLabel}` : ""} · {tomb.visibility === "public" ? "page publique" : "page réservée à la famille"}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Ils reposent ici</h2>
          <ul className="flex flex-col border border-rule bg-surface">
            {tomb.memorials.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 border-b border-rule p-3 last:border-0">
                <span className="size-14 shrink-0 overflow-hidden rounded-full">
                  <Face url={m.portraitUrl} gender={m.gender} className="size-full" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-serif text-lg font-bold">
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="text-xs text-muted">
                    {[
                      lifeSpan(m.birthDate, m.deathDate),
                      `${tomb.media.filter((x) => x.memorialId === m.id).length} photos, vidéos ou voix`,
                      `${count(m.candles)} bougies`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Link href={`/espace/tombe/${tomb.id}/${m.id}`} className="btn min-h-10 text-sm">
                    {guardian ? "Modifier" : "Ajouter des souvenirs"}
                  </Link>
                  <Link href={`/m/${tomb.code}/${m.slug}`} className="btn btn-ghost min-h-10 text-sm">
                    Voir
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Inviter des proches</h2>
          <p className="text-ink-2">
            Envoyez un lien à vos frères, sœurs, cousins, à la famille de l’Hexagone : chacun pourra ajouter ses photos, vidéos et
            enregistrements.
          </p>
          <InviteLink tombId={tomb.id} role="member" label="Créer un lien pour les proches" message={invite} />
          {guardian && (
            <details className="text-sm">
              <summary className="cursor-pointer text-ink-2">Partager la gestion de la page avec une autre personne</summary>
              <div className="mt-3">
                <InviteLink
                  tombId={tomb.id}
                  role="guardian"
                  label="Créer un lien de co-gardien"
                  message={`Je te confie aussi la gestion de la page de la famille ${tomb.familyName} :`}
                />
              </div>
            </details>
          )}
          {tomb.members.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {tomb.members.map((p, i) => (
                <li key={`${p.name}-${i}`}>
                  {p.name} <span className="text-muted">· {p.role === "guardian" ? "gère la page" : "proche"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {guardian && tomb.memorials.length < MAX_MEMORIALS && (
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-bold">Ajouter un défunt sur cette tombe</h2>
            <p className="text-ink-2">
              Un caveau familial réunit souvent plusieurs générations. La même plaque mène à chacun ({MAX_MEMORIALS} au plus).
            </p>
            <AddMemorialForm tombId={tomb.id} familyName={tomb.familyName} />
          </section>
        )}

        {guardian && tomb.orders.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-bold">Ma plaque</h2>
            {tomb.orders.map((o) => (
              <p key={o.id} className="border border-rule bg-surface p-4 text-sm">
                Formule {FORMULAS[o.formula].name} · {euros(o.amountTtcCents)} ·{" "}
                <span className={o.status === "paid" ? "text-green" : "text-amber"}>
                  {o.status === "paid" ? "réglée" : "à régler auprès de votre pompe funèbre"}
                </span>
              </p>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
