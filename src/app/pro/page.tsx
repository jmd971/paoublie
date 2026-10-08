import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FORMULAS, euros } from "@/lib/pricing";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Espace pro", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function ProSpace() {
  const viewer = await getViewer();
  if (viewer.kind === "family") redirect("/espace");
  if (viewer.kind !== "distributor") redirect("/connexion");
  const { distributor, orders, freeCodes, tombs } = await repo.distributorOverview(viewer);
  const paid = orders.filter((o) => o.status === "paid");
  const due = paid.reduce((n, o) => n + o.commissionCents, 0);
  const coming = orders.filter((o) => o.status === "pending").reduce((n, o) => n + o.commissionCents, 0);

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Espace pro</p>
            <h1 className="font-serif text-3xl font-bold">{distributor.name}</h1>
            <p className="text-sm text-muted">Commission : {Math.round(distributor.commissionRate * 100)} % du montant HT</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/espace/nouveau" className="btn">
              Créer un mémorial pour une famille
            </Link>
            <Link href="/pro/codes" className="btn btn-ghost">
              Mes plaques
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
          {[
            [String(orders.length), "ventes"],
            [euros(due), "commissions acquises"],
            [euros(coming), "commissions à venir"],
            [String(freeCodes.length), "plaques en stock"],
          ].map(([value, label]) => (
            <div key={label} className="bg-surface p-4">
              <dd className="font-mono text-2xl tabular-nums">{value}</dd>
              <dt className="text-sm text-muted">{label}</dt>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Ventes</h2>
          <div className="overflow-x-auto border border-rule bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-paper text-left font-mono text-[11px] tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Famille</th>
                  <th className="px-4 py-2">Formule</th>
                  <th className="px-4 py-2 text-right">Montant TTC</th>
                  <th className="px-4 py-2 text-right">Commission</th>
                  <th className="px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-rule">
                    <td className="px-4 py-3">{dateFmt.format(new Date(o.createdAt))}</td>
                    <td className="px-4 py-3">{o.familyName}</td>
                    <td className="px-4 py-3">{FORMULAS[o.formula].name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{euros(o.amountTtcCents)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{euros(o.commissionCents)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium ${o.status === "paid" ? "bg-green-soft text-green" : "bg-amber-soft text-amber-ink"}`}>
                        {o.status === "paid" ? "Payée" : o.status === "pending" ? "En attente" : "Annulée"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Mémoriaux de vos familles</h2>
          {tombs.length === 0 ? (
            <p className="text-muted">Aucun mémorial pour l’instant.</p>
          ) : (
            <ul className="flex flex-col border border-rule bg-surface">
              {tombs.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-3 last:border-0">
                  <span>
                    Famille {t.familyName}
                    <span className="text-sm text-muted"> · {t.memorials.map((m) => m.firstName).join(", ")} · {t.cemetery}</span>
                  </span>
                  <Link href={`/m/${t.code}`} className="text-sm font-medium text-green">
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
