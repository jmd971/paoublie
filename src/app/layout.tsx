import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Caslon_Text } from "next/font/google";
import "./globals.css";

const caslon = Libre_Caslon_Text({ variable: "--font-caslon", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://paoublie.com"),
  title: { default: "Pa Oublié · La mémoire vivante des familles", template: "%s · Pa Oublié" },
  description:
    "Une plaque QR sur la tombe, une page qui raconte la vie de ceux qui sont partis : photos, voix, famille et livre d’or. En Guadeloupe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${caslon.variable} ${plex.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-[15.5px] leading-relaxed">{children}</body>
    </html>
  );
}
