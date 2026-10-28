import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { setDemoRole } from "../actions";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

function safePath(raw: unknown): string | undefined {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
}

export default async function SignIn(props: PageProps<"/connexion">) {
  const viewer = await getViewer();
  const params = await props.searchParams;
  const code = typeof params.code === "string" ? params.code : undefined;
  const next = safePath(params.next) ?? (code ? `/espace/nouveau?code=${code}` : undefined);
  if (viewer.kind === "family") redirect(next ?? "/espace");
  if (viewer.kind === "distributor") redirect(next?.startsWith("/invitation") ? "/pro" : (next ?? "/pro"));

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
        <div>
          <p className="eyebrow">Connexion</p>
          <h1 className="font-serif text-3xl font-bold">Accéder à mon espace</h1>
        </div>
        {isDemo ? (
          <>
            <p className="text-ink-2">L’application tourne en mode démonstration. Choisissez un rôle pour la découvrir.</p>
            <form action={setDemoRole} className="flex flex-col gap-3">
              {next && <input type="hidden" name="next" value={next} />}
              <button name="role" value="family" className="btn">
                Entrer comme Josette, gardienne de la page
              </button>
              <button name="role" value="family2" className="btn btn-ghost">
                Entrer comme Patrick, un proche invité
              </button>
              <button name="role" value="distributor" className="btn btn-ghost">
                Entrer comme une pompe funèbre
              </button>
            </form>
          </>
        ) : (
          <EmailForm next={next} />
        )}
      </main>
    </>
  );
}
