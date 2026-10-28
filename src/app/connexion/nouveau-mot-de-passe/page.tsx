import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function NewPassword() {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
        <h1 className="font-serif text-3xl font-bold">Choisir un nouveau mot de passe</h1>
        {viewer.kind === "anonymous" ? (
          <p className="text-ink-2">
            Ce lien a expiré.{" "}
            <Link href="/connexion/mot-de-passe-oublie" className="text-green underline">
              Redemandez un e-mail
            </Link>
            .
          </p>
        ) : (
          <NewPasswordForm />
        )}
      </main>
    </>
  );
}
