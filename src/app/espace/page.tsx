import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { count, lifeSpan, timeAgo } from "@/lib/format";
import { FORMULAS, euros } from "@/lib/pricing";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { moderateMessage } from "../actions";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default async function FamilySpace() {
  const viewer = await getViewer();
  if (viewer.kind === "distributor") redirect("/pro");
  if (viewer.kind !== "family") redirect("/connexion");
  const { tombs, pending, orders } = await repo.familyOverview(viewer);

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Mon espace</p>
            <h1 className="font-serif text-3xl font-bold">Bonjour {viewer.name.split(" ")[0]}</h1>
          </div>
          <Link href="/espace/nouveau" className="btn">
            Créer un mémorial
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">
            Souvenirs à valider <span className="font-mono text-base text-amber">{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted">Aucun message en attente. Les nouveaux messages de la famille et des proches arriveront ici.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 border border-rule bg-surface p-4">
                  <p>« {m.body} »</p>
                  <p className="text-xs text-muted">
                    {[m.authorName, m.authorPlace, `pour ${m.memorialName}`, timeAgo(m.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                  <form action={moderateMessage} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <button name="status" value="published" className="btn min-h-10 text-sm">
                      Publier
                    </button>
                    <button name="status" value="private" className="btn btn-ghost min-h-10 text-sm">
                      Garder pour la famille
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Mes mémoriaux</h2>
          {tombs.length === 0 && <p className="text-muted">Vous n’avez pas encore de mémorial.</p>}
          {tombs.map((t) => (
            <div key={t.id} className="border border-rule bg-surface">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3">
                <h3 className="font-semibold">Caveau de la famille {t.familyName}</h3>
                <span className="font-mono text-xs text-muted">Plaque {t.code}</span>
              </div>
              <ul>
                {t.memorials.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 last:border-0">
                    <span>
                      <span className="font-serif text-lg font-bold">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-sm text-muted"> · {lifeSpan(m.birthDate, m.deathDate)}</span>
                      <span className="block text-xs text-muted">
                        {count(m.visits)} visites · {count(m.candles)} bougies · {count(m.flowers)} fleurs
                      </span>
                    </span>
                    <Link href={`/m/${t.code}/${m.slug}`} className="text-sm font-medium text-green">
                      Voir la page
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {orders.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-bold">Ma plaque</h2>
            {orders.map((o) => (
              <p key={o.id} className="border border-rule bg-surface p-4 text-sm">
                Formule {FORMULAS[o.formula].name} · {euros(o.amountTtcCents)} ·{" "}
                <span className={o.status === "paid" ? "text-green" : "text-amber"}>
                  {o.status === "paid" ? "réglée" : "en attente de règlement"}
                </span>
              </p>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
