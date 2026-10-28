import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { HOST, LEGAL_UPDATED, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et contact du service Pa Oublié, mémoriaux numériques par QR code en Guadeloupe.",
};

export default function LegalNotice() {
  return (
    <LegalPage title="Mentions légales" updated={LEGAL_UPDATED}>
      <h2>Éditeur</h2>
      <p>
        Le service Pa Oublié est édité par {PUBLISHER.name}, {PUBLISHER.address}.<br />
        SIRET {PUBLISHER.siret} · TVA intracommunautaire {PUBLISHER.vat}.<br />
        Directeur de la publication : {PUBLISHER.director}.<br />
        Contact : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>
      </p>
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par {HOST.name}, {HOST.address}. Les données des mémoriaux (textes, photos, vidéos, voix, messages) sont
        stockées par Supabase dans un centre de données situé dans l’Union européenne.
      </p>
      <h2>Contenus publiés par les familles</h2>
      <p>
        Les textes, photos, vidéos et enregistrements des mémoriaux sont publiés par les familles et leurs proches, qui en restent
        propriétaires. Pa Oublié agit comme hébergeur de ces contenus. Pour signaler un contenu qui vous semble illicite ou qui vous
        concerne, écrivez à <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a> en indiquant l’adresse de la page : il sera examiné
        rapidement et retiré s’il y a lieu.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>La marque Pa Oublié, le site et son code sont la propriété de l’éditeur. Toute reproduction sans autorisation est interdite.</p>
    </LegalPage>
  );
}
