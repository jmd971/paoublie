import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoPlaceholder, Portrait } from "@/components/portrait";
import { normalizeCode } from "@/lib/codes";
import { count, formatDate, lifeSpan, timeAgo } from "@/lib/format";
import { repo } from "@/lib/repo";
import { Gestures } from "./gestures";
import { Guestbook } from "./guestbook";
import { Tabs } from "./tabs";

async function load(props: PageProps<"/m/[code]/[slug]">) {
  const { code: raw, slug } = await props.params;
  const code = normalizeCode(raw);
  return code ? repo.getMemorialPage(code, slug) : null;
}

export async function generateMetadata(props: PageProps<"/m/[code]/[slug]">): Promise<Metadata> {
  const page = await load(props);
  if (!page) return { title: "Mémorial introuvable" };
  const m = page.memorial;
  return {
    title: `${m.firstName} ${m.lastName}${m.nickname ? `, dite ${m.nickname}` : ""}`,
    description: `Mémorial de ${m.firstName} ${m.lastName} (${lifeSpan(m.birthDate, m.deathDate)}), ${page.tomb.cemetery}.`,
    robots: { index: page.tomb.visibility === "public" },
  };
}

export default async function MemorialPage(props: PageProps<"/m/[code]/[slug]">) {
  const page = await load(props);
  if (!page) notFound();
  const { tomb, memorial: m, media, messages, siblings } = page;
  const isNew = (await props.searchParams).nouveau === "1";
  await repo.countVisit(m.id);
  const path = `/m/${tomb.code}/${m.slug}`;
  const photos = media.filter((x) => x.kind !== "audio");
  const audios = media.filter((x) => x.kind === "audio");

  const panels = [
    {
      id: "vie",
      label: "Sa vie",
      content:
        m.chapters.length === 0 ? (
          <p className="text-ink-2">La famille n’a pas encore écrit son histoire.</p>
        ) : (
          m.chapters.map((c) => (
            <article key={c.title} className="flex flex-col gap-2 border-b border-rule pb-6 last:border-0">
              {c.years && <p className="font-mono text-xs text-amber">{c.years}</p>}
              <h3 className="font-serif text-xl font-bold">{c.title}</h3>
              <p className="font-serif text-[16.5px] leading-relaxed">{c.text}</p>
              {c.caption && <p className="text-xs text-muted italic">{c.caption}</p>}
            </article>
          ))
        ),
    },
    {
      id: "photos",
      label: "Photos et vidéos",
      content:
        photos.length === 0 ? (
          <p className="text-ink-2">Aucune photo pour l’instant.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p, i) => (
              <figure key={p.id} className="relative">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- photos hébergées par la famille
                  <img src={p.url} alt={p.caption} className="aspect-square w-full object-cover" />
                ) : (
                  <PhotoPlaceholder label={p.kind === "video" ? "Vidéo" : "Photo"} tone={i} />
                )}
                {p.kind === "video" && (
                  <span className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 font-mono text-[11px] text-white">
                    Vidéo · {p.duration}
                  </span>
                )}
                <figcaption className="mt-1 text-xs text-ink-2">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        ),
    },
    {
      id: "voix",
      label: "Sa voix",
      content:
        audios.length === 0 ? (
          <p className="text-ink-2">Aucun enregistrement pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {audios.map((a) => (
              <li key={a.id} className="flex items-center gap-3 border border-rule bg-surface p-3">
                {a.url ? (
                  <audio controls src={a.url} className="w-40" aria-label={a.caption} />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-green text-on-accent" aria-hidden="true">
                    ▶
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{a.caption}</span>
                  {a.duration && <span className="text-xs text-muted">{a.duration}</span>}
                </span>
              </li>
            ))}
          </ul>
        ),
    },
    ...(m.loves.length
      ? [
          {
            id: "aimait",
            label: "Ses passions",
            content: m.loves.map((l) => (
              <div key={l.title} className="border-b border-rule pb-4 last:border-0">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-ink-2">{l.text}</p>
              </div>
            )),
          },
        ]
      : []),
    {
      id: "livre",
      label: "Livre d’or",
      content: (
        <>
          <Guestbook memorialId={m.id} />
          <ul className="flex flex-col">
            {messages.map((msg) => (
              <li key={msg.id} className="border-b border-rule py-3">
                <p>{msg.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {[msg.authorName, msg.authorPlace, timeAgo(msg.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "recueillir",
      label: "Se recueillir",
      content: (
        <div className="flex flex-col gap-3">
          <div className="border border-rule bg-surface p-4">
            <p className="eyebrow">Lieu de repos</p>
            <p className="mt-1 font-semibold">{tomb.cemetery}</p>
            {tomb.locationLabel && <p className="text-sm text-ink-2">{tomb.locationLabel}</p>}
          </div>
          {siblings.length > 0 && (
            <div className="border border-rule bg-surface p-4">
              <p className="eyebrow">Sur la même tombe</p>
              <ul className="mt-2 flex flex-col gap-1">
                {siblings.map((s) => (
                  <li key={s.id}>
                    <Link href={`/m/${tomb.code}/${s.slug}`} className="text-green underline-offset-2 hover:underline">
                      {s.firstName} {s.lastName}
                    </Link>
                    <span className="text-sm text-muted"> · {lifeSpan(s.birthDate, s.deathDate)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="flex-1">
      {isNew && (
        <p className="bg-green-soft px-4 py-3 text-center text-sm text-green">
          Le mémorial est créé. Ajoutez maintenant les photos et l’histoire depuis votre espace.
        </p>
      )}
      <header className="bg-granite px-4 pt-6 pb-8 text-center text-on-granite">
        <Link href={`/m/${tomb.code}`} className="text-sm text-on-granite-2 underline-offset-2 hover:underline">
          ‹ Caveau de la famille {tomb.familyName}
        </Link>
        <div className="mx-auto mt-5 size-28 overflow-hidden rounded-full border-4 border-on-granite">
          {m.portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo hébergée par la famille
            <img src={m.portraitUrl} alt={`Portrait de ${m.firstName} ${m.lastName}`} className="size-full object-cover" />
          ) : (
            <Portrait className="size-full" />
          )}
        </div>
        <h1 className="mt-4 font-serif text-3xl font-bold">
          {m.firstName} {m.lastName}
        </h1>
        {m.nickname && <p className="font-serif text-lg text-[#E7C79A] italic">dite {m.nickname}</p>}
        <p className="mt-1 text-sm text-on-granite-2">
          {[formatDate(m.birthDate), formatDate(m.deathDate)].filter(Boolean).join(" · ")}
          {m.birthPlace ? `, ${m.birthPlace}` : ""}
        </p>
        {m.quote && (
          <blockquote className="mx-auto mt-4 max-w-md font-serif text-lg italic">
            « {m.quote.replace(/^«\s*|\s*»$/g, "")} »
            {m.quoteTranslation && <span className="mt-1 block font-sans text-xs text-on-granite-2 not-italic">{m.quoteTranslation}</span>}
          </blockquote>
        )}
      </header>

      <Gestures memorialId={m.id} path={path} candles={m.candles} flowers={m.flowers} visits={m.visits} />

      <Tabs panels={panels} />

      <p className="px-4 py-8 text-center text-xs text-muted">
        Mémorial Pa Oublié · {count(m.visits)} visites
      </p>
    </main>
  );
}
