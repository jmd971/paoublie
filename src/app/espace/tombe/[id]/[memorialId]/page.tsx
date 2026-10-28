import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteMedia } from "@/app/actions";
import { Face, PhotoPlaceholder } from "@/components/portrait";
import { SiteHeader } from "@/components/site-header";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { MediaUploader } from "./media-uploader";
import { MemorialEditor } from "./memorial-editor";

export const metadata: Metadata = { title: "Compléter la page", robots: { index: false } };

const KIND_LABEL = { photo: "Photo", video: "Vidéo", audio: "Voix" } as const;

export default async function EditMemorial(props: PageProps<"/espace/tombe/[id]/[memorialId]">) {
  const { id, memorialId } = await props.params;
  const viewer = await getViewer();
  if (viewer.kind !== "family") redirect(`/connexion?next=${encodeURIComponent(`/espace/tombe/${id}/${memorialId}`)}`);
  const tomb = await repo.managedTomb(viewer, id);
  const m = tomb?.memorials.find((x) => x.id === memorialId);
  if (!tomb || !m) notFound();
  const guardian = tomb.role === "guardian";
  const media = tomb.media.filter((x) => x.memorialId === m.id);

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="size-20 shrink-0 overflow-hidden rounded-full">
            <Face url={m.portraitUrl} gender={m.gender} alt={`Portrait de ${m.firstName} ${m.lastName}`} className="size-full" />
          </span>
          <div className="flex-1">
            <Link href={`/espace/tombe/${tomb.id}`} className="text-sm text-muted underline-offset-2 hover:underline">
              ‹ Caveau de la famille {tomb.familyName}
            </Link>
            <h1 className="font-serif text-3xl font-bold">
              {m.firstName} {m.lastName}
            </h1>
          </div>
          <Link href={`/m/${tomb.code}/${m.slug}`} className="btn btn-ghost min-h-10 text-sm">
            Voir la page
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-bold">Photos, vidéos et voix</h2>
          <p className="text-ink-2">
            Ajoutez les photos d’album, une vidéo d’anniversaire, un message vocal enregistré sur votre téléphone. Tout apparaît aussitôt
            sur la page.
          </p>
          <MediaUploader memorialId={m.id} />
          {media.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((x, i) => (
                <li key={x.id} className="flex flex-col gap-1">
                  {x.url && x.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- fichier envoyé par la famille
                    <img src={x.url} alt={x.caption} className="aspect-square w-full object-cover" />
                  ) : x.url && x.kind === "video" ? (
                    <video src={x.url} controls preload="metadata" className="aspect-square w-full bg-black object-cover" />
                  ) : x.url && x.kind === "audio" ? (
                    <audio src={x.url} controls preload="metadata" className="w-full" />
                  ) : (
                    <PhotoPlaceholder label={KIND_LABEL[x.kind]} tone={i} />
                  )}
                  <span className="text-xs text-ink-2">
                    {KIND_LABEL[x.kind]} · {x.caption}
                  </span>
                  {guardian && (
                    <form action={deleteMedia}>
                      <input type="hidden" name="mediaId" value={x.id} />
                      <button type="submit" className="text-xs text-red underline-offset-2 hover:underline">
                        Retirer
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {guardian ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-xl font-bold">Portrait</h2>
              <MediaUploader memorialId={m.id} purpose="portrait" />
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-xl font-bold">Son histoire</h2>
              <MemorialEditor memorial={m} />
            </section>
          </>
        ) : (
          <p className="border border-rule bg-surface p-4 text-sm text-ink-2">
            Vous êtes invité comme proche : vous pouvez ajouter des photos, vidéos et voix. Le texte de la page est tenu par{" "}
            {tomb.members.find((p) => p.role === "guardian")?.name ?? "le gardien de la page"}.
          </p>
        )}
      </main>
    </>
  );
}
