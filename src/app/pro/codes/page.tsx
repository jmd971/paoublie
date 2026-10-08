import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { SiteHeader } from "@/components/site-header";
import { plaqueUrl } from "@/lib/codes";
import { isDemo, repo } from "@/lib/repo";
import { getViewer } from "@/lib/session";
import { createQrBatch } from "../../actions";

export const metadata: Metadata = { title: "Mes plaques", robots: { index: false } };

export default async function ProCodes() {
  const viewer = await getViewer();
  if (viewer.kind !== "distributor") redirect("/connexion");
  const { freeCodes } = await repo.distributorOverview(viewer);
  const svgs = await Promise.all(
    freeCodes.map((c) => QRCode.toString(plaqueUrl(c.code), { type: "svg", errorCorrectionLevel: "H", margin: 2 })),
  );

  return (
    <>
      <SiteHeader viewer={viewer} demo={isDemo} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
        <div>
          <p className="eyebrow">Espace pro</p>
          <h1 className="font-serif text-3xl font-bold">Mes plaques en stock</h1>
          <p className="mt-1 max-w-2xl text-ink-2">
            Chaque plaque porte un code unique. Remettez-la à la famille : en la scannant, elle crée le mémorial, qui est
            rattaché automatiquement à votre compte pour la commission.
          </p>
        </div>

        <form action={createQrBatch} className="flex flex-wrap items-end gap-3 border border-rule bg-surface p-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nombre de codes à générer
            <input type="number" name="count" min={1} max={50} defaultValue={10} className="field w-32" />
          </label>
          <button type="submit" className="btn">
            Générer un lot
          </button>
          <p className="basis-full text-xs text-muted">Le lot est ensuite envoyé au fabricant des plaques.</p>
        </form>

        {freeCodes.length === 0 ? (
          <p className="text-muted">Aucune plaque en stock.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {freeCodes.map((c, i) => (
              <li key={c.code} className="flex flex-col items-center gap-2 border border-rule bg-surface p-4">
                <div
                  className="w-full max-w-36 bg-white"
                  role="img"
                  aria-label={`QR code de la plaque ${c.code}`}
                  dangerouslySetInnerHTML={{ __html: svgs[i] }}
                />
                <span className="font-mono text-lg tracking-widest">{c.code}</span>
                <span className="text-xs text-muted">{c.batch}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
