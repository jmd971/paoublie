import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Portrait } from "@/components/portrait";
import { normalizeCode } from "@/lib/codes";
import { count, lifeSpan } from "@/lib/format";
import { repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export async function generateMetadata(props: PageProps<"/m/[code]">): Promise<Metadata> {
  const code = normalizeCode((await props.params).code);
  const tomb = code ? await repo.getTombByCode(code) : null;
  return tomb
    ? { title: `Famille ${tomb.familyName}`, description: `Caveau de la famille ${tomb.familyName}, ${tomb.cemetery}.`, robots: { index: false } }
    : { title: "Plaque Pa Oublié", robots: { index: false } };
}

export default async function TombPage(props: PageProps<"/m/[code]">) {
  const code = normalizeCode((await props.params).code);
  if (!code) notFound();
  const tomb = await repo.getTombByCode(code);

  if (!tomb) {
    if (!(await repo.isFreeCode(code))) notFound();
    const viewer = await getViewer();
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-14">
        <p className="eyebrow">Plaque {code}</p>
        <h1 className="font-serif text-3xl font-bold">Cette plaque attend son mémorial</h1>
        <p className="text-ink-2">
          Vous avez reçu cette plaque de votre pompe funèbre ou de votre marbrier. Créez la page de votre proche : elle
          s’ouvrira ensuite à chaque scan.
        </p>
        <Link
          href={viewer.kind === "anonymous" ? `/connexion?code=${code}` : `/espace/nouveau?code=${code}`}
          className="btn self-start"
        >
          Activer la plaque
        </Link>
      </main>
    );
  }

  const total = tomb.memorials.reduce((n, m) => n + m.candles, 0);

  return (
    <main className="flex-1">
      <div className="bg-granite px-4 py-10 text-center text-on-granite">
        <p className="eyebrow !text-[#E7A04A]">Caveau familial</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">Famille {tomb.familyName}</h1>
        <p className="mt-1 text-on-granite-2">
          {tomb.cemetery}
          {tomb.locationLabel ? ` · ${tomb.locationLabel}` : ""}
        </p>
      </div>
      <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-8">
        <p className="text-sm text-ink-2">Ils reposent ici. Choisissez la personne dont vous voulez voir la page.</p>
        {tomb.memorials.map((m, i) => (
          <Link
            key={m.id}
            href={`/m/${code}/${m.slug}`}
            className="flex items-center gap-4 border border-rule bg-surface p-3 hover:border-amber"
          >
            <span className="size-16 shrink-0 overflow-hidden rounded-full">
              {m.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos hébergées par la famille
                <img src={m.portraitUrl} alt="" className="size-full object-cover" />
              ) : (
                <Portrait variant={i % 2 ? "homme" : "femme"} className="size-full" />
              )}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-serif text-lg font-bold">
                {m.firstName} {m.lastName}
              </span>
              <span className="text-sm text-ink-2">
                {[m.nickname ? `dite ${m.nickname}` : m.relation, lifeSpan(m.birthDate, m.deathDate)].filter(Boolean).join(" · ")}
              </span>
              <span className="text-xs text-muted">{count(m.candles)} bougies</span>
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
        {total > 0 && <p className="mt-2 text-sm text-muted">{count(total)} bougies allumées sur cette tombe.</p>}
      </div>
    </main>
  );
}
