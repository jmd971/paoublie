import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default async function ForgotPassword() {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
        <div>
          <Link href="/connexion" className="text-sm text-muted underline-offset-2 hover:underline">
            ‹ Connexion
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold">Mot de passe oublié</h1>
        </div>
        <p className="text-ink-2">Indiquez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
        <ResetForm />
      </main>
    </>
  );
}
