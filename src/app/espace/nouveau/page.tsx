import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemorialForm } from "@/components/memorial-form";
import { SiteHeader } from "@/components/site-header";
import { normalizeCode } from "@/lib/codes";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Nouveau mémorial", robots: { index: false } };

export default async function NewMemorial(props: PageProps<"/espace/nouveau">) {
  const viewer = await getViewer();
  const raw = (await props.searchParams).code;
  const code = typeof raw === "string" ? (normalizeCode(raw) ?? undefined) : undefined;
  if (viewer.kind === "anonymous") redirect(code ? `/connexion?code=${code}` : "/connexion");
  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="eyebrow">Nouveau mémorial</p>
        <h1 className="mb-8 font-serif text-3xl font-bold">
          {viewer.kind === "distributor" ? "Créer un mémorial pour une famille" : "Créer la page de votre proche"}
        </h1>
        <MemorialForm code={code} forFamily={viewer.kind === "family"} />
      </main>
    </>
  );
}
