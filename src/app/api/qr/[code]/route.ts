import QRCode from "qrcode";
import { normalizeCode, plaqueUrl } from "@/lib/codes";

/** QR code d'une plaque, en SVG, pour l'envoyer au fabricant. */
export async function GET(_req: Request, ctx: RouteContext<"/api/qr/[code]">) {
  const code = normalizeCode((await ctx.params).code);
  if (!code) return new Response("Code invalide", { status: 400 });
  const svg = await QRCode.toString(plaqueUrl(code), { type: "svg", errorCorrectionLevel: "H", margin: 2 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `inline; filename="plaque-${code}.svg"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
