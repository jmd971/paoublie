import Link from "next/link";

/** Page réservée à la famille, vue par quelqu'un qui n'y a pas accès. */
export function Restricted({ next }: { next: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-14">
      <p className="eyebrow">Page familiale</p>
      <h1 className="font-serif text-3xl font-bold">Cette page est réservée à la famille</h1>
      <p className="text-ink-2">
        La famille a choisi de ne montrer ce mémorial qu’à ses proches. Si vous en faites partie, demandez-lui un lien
        d’invitation, puis connectez-vous.
      </p>
      <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="btn self-start">
        J’ai été invité, me connecter
      </Link>
    </main>
  );
}
