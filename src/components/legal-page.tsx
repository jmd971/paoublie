import { SiteHeader } from "@/components/site-header";
import { isDemo } from "@/lib/repo";
import { getViewer } from "@/lib/session";

export async function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="legal mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-12">
        <h1 className="font-serif text-3xl font-bold">{title}</h1>
        <p className="text-sm text-muted">Dernière mise à jour : {updated}</p>
        {children}
      </main>
    </>
  );
}
