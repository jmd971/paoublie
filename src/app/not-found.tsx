import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-20">
      <p className="eyebrow">Page introuvable</p>
      <h1 className="font-serif text-3xl font-bold">Ce mémorial n’existe pas</h1>
      <p className="text-ink-2">Vérifiez le code inscrit sous le QR de la plaque, ou rapprochez-vous de la famille.</p>
      <Link href="/" className="btn self-start">
        Retour à l’accueil
      </Link>
    </main>
  );
}
