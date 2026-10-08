import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Portrait } from "@/components/portrait";
import { DEMO_TOMB } from "@/lib/repo/demo-data";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { FORMULAS, euros } from "@/lib/pricing";
import { setDemoRole } from "./actions";

export default async function Home() {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="flex-1">
        <section className="bg-granite text-on-granite">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-5">
              <div className="damier text-on-granite" aria-hidden="true" />
              <p className="eyebrow !text-[#E7A04A]">Guadeloupe · Martinique · diaspora</p>
              <h1 className="font-serif text-4xl leading-tight font-bold text-balance md:text-5xl">
                La mémoire vivante de ceux qui sont partis
              </h1>
              <p className="max-w-xl text-lg text-on-granite-2">
                Une plaque discrète sur la tombe. Un scan avec le téléphone. Une page qui raconte sa vie, avec ses photos, sa
                voix et les mots de toute la famille, où qu’elle soit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/m/${DEMO_TOMB.code}`} className="btn btn-amber">
                  Voir un exemple
                </Link>
                <Link href={viewer.kind === "family" ? "/espace/nouveau" : "/connexion"} className="btn btn-ghost">
                  Créer un mémorial
                </Link>
              </div>
            </div>
            <Portrait className="mx-auto w-56 rounded-full border-4 border-on-granite md:w-full" />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-serif text-2xl font-bold">Comment ça marche</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["La plaque", "Aluminium anodisé de 6 × 7,5 cm, résistant au soleil, posée sur la tombe par votre marbrier."],
              ["Le scan", "Avec n’importe quel téléphone, sans application, devant la tombe ou depuis Paris et Montréal."],
              ["Le mémorial", "Sa vie, ses photos, sa voix, sa famille et le livre d’or. Rien n’est publié sans votre accord."],
            ].map(([title, text], i) => (
              <li key={title} className="flex flex-col gap-2 border border-rule bg-surface p-5">
                <span className="font-serif text-3xl text-amber">{i + 1}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="font-serif text-2xl font-bold">Les formules</h2>
          <p className="mt-1 text-muted">Paiement unique, sans abonnement. Prix TTC, TVA 8,5 %.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.entries(FORMULAS).map(([key, f]) => (
              <div key={key} className={`flex flex-col gap-2 bg-surface p-5 ${key === "memoire" ? "border-2 border-amber" : "border border-rule"}`}>
                <h3 className="font-serif text-xl font-bold">{f.name}</h3>
                <p className="text-sm text-muted">{f.pitch}</p>
                <p className="font-mono text-3xl">{euros(f.ttcCents)}</p>
                <ul className="list-disc pl-5 text-sm text-ink-2">
                  {f.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Proposé par les pompes funèbres et marbriers partenaires. Demandez Pa Oublié lors de l’organisation des obsèques
            ou de la pose du monument.
          </p>
        </section>

        {isDemo && (
          <section className="border-t border-rule bg-surface">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10">
              <h2 className="font-serif text-2xl font-bold">Essayer la démonstration</h2>
              <p className="text-ink-2">Choisissez un rôle pour découvrir chaque espace avec des données fictives.</p>
              <form action={setDemoRole} className="flex flex-wrap gap-3">
                <button name="role" value="family" className="btn">
                  Entrer comme une famille
                </button>
                <button name="role" value="distributor" className="btn btn-ghost">
                  Entrer comme une pompe funèbre
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
      <footer className="border-t border-rule px-4 py-6 text-center text-sm text-muted">
        Pa Oublié · un service Siboard Consulting · Guadeloupe
      </footer>
    </>
  );
}
