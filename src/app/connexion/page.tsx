import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForms } from "@/components/auth-forms";
import { SiteHeader } from "@/components/site-header";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { setDemoRole } from "../actions";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

/** Messages affichés au retour d'un lien reçu par e-mail. */
const MESSAGES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  "adresse-confirmee": { tone: "ok", text: "Votre adresse est confirmée. Connectez-vous avec votre e-mail et votre mot de passe." },
  "lien-expire": { tone: "warn", text: "Ce lien a expiré ou a déjà servi. Connectez-vous, ou créez votre compte à nouveau." },
  "lien-expire-mdp": { tone: "warn", text: "Ce lien a expiré ou a déjà servi. Redemandez un e-mail avec « Mot de passe oublié ? »." },
  "autre-navigateur-mdp": {
    tone: "warn",
    text: "Le lien s’est ouvert dans un autre navigateur que celui de la demande. Redemandez un e-mail avec « Mot de passe oublié ? » et ouvrez-le sur ce même appareil.",
  },
};

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
  const notice = typeof params.message === "string" ? MESSAGES[params.message] : undefined;

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
        <div>
          <p className="eyebrow">Connexion</p>
          <h1 className="font-serif text-3xl font-bold">Accéder à mon espace</h1>
        </div>
        {notice && (
          <p
            role="status"
            className={`border p-3 text-sm ${notice.tone === "ok" ? "border-green bg-green-soft text-green" : "border-amber bg-amber-soft text-amber-ink"}`}
          >
            {notice.text}
          </p>
        )}
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
          <AuthForms next={next} defaultTab={params.onglet === "inscription" ? "inscription" : "connexion"} />
        )}
      </main>
    </>
  );
}
