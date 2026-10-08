import Link from "next/link";
import type { Viewer } from "@/lib/types";
import { signOut } from "@/app/actions";

export function SiteHeader({ viewer, demo }: { viewer: Viewer; demo: boolean }) {
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
        <Link href="/" className="font-serif text-xl font-bold">
          Pa Oublié
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {viewer.kind === "family" && <Link href="/espace">Mon espace</Link>}
          {viewer.kind === "distributor" && <Link href="/pro">Espace pro</Link>}
          {viewer.kind === "anonymous" ? (
            <Link href="/connexion" className="font-medium text-green">
              Se connecter
            </Link>
          ) : (
            <form action={signOut}>
              <button type="submit" className="cursor-pointer text-muted underline-offset-2 hover:underline">
                Se déconnecter
              </button>
            </form>
          )}
        </nav>
      </div>
      {demo && (
        <p className="bg-amber-soft px-4 py-1.5 text-center font-mono text-[11.5px] text-amber-ink">
          Mode démonstration · données fictives
        </p>
      )}
    </header>
  );
}
