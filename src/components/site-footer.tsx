import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule px-4 py-6 text-sm text-muted">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <span>Pa Oublié · Guadeloupe</span>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
          <Link href="/cgu" className="hover:underline">
            Conditions d’utilisation
          </Link>
          <Link href="/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  );
}
