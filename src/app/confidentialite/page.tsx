import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_UPDATED, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Données personnelles chez Pa Oublié : ce qui est collecté, pourquoi, combien de temps, où c’est stocké et comment exercer vos droits.",
};

export default function Privacy() {
  return (
    <LegalPage title="Politique de confidentialité" updated={LEGAL_UPDATED}>
      <p>
        Responsable du traitement : {PUBLISHER.name}, {PUBLISHER.address}. Contact :{" "}
        <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>.
      </p>
      <h2>Ce que nous collectons</h2>
      <ul>
        <li>
          <strong>Compte famille ou professionnel</strong> : adresse e-mail et nom, pour vous connecter et gérer les pages dont vous
          avez la charge.
        </li>
        <li>
          <strong>Contenu des mémoriaux</strong> : textes, dates, photos, vidéos et enregistrements ajoutés par la famille et ses proches.
        </li>
        <li>
          <strong>Livre d’or</strong> : prénom, lieu facultatif et message des visiteurs, lus par la famille avant publication.
        </li>
        <li>
          <strong>Mesures anti-abus</strong> : une empreinte non réversible de l’adresse IP, renouvelée chaque jour, pour limiter les
          envois répétés. L’adresse IP elle-même n’est pas conservée.
        </li>
        <li>
          <strong>Ventes</strong> : formule choisie, montant et état du règlement, partagés avec la pompe funèbre concernée.
        </li>
      </ul>
      <p>Le site ne dépose aucun cookie publicitaire ni de mesure d’audience. Seul un cookie de session sert à vous garder connecté.</p>
      <h2>Pourquoi</h2>
      <p>
        Ces données servent uniquement à fournir le service demandé (exécution du contrat) et à le protéger contre les abus (intérêt
        légitime). Elles ne sont ni vendues ni utilisées pour de la publicité.
      </p>
      <h2>Qui y a accès</h2>
      <p>
        Une page publique est visible par toute personne qui a le QR code ou le lien. Une page « famille » n’est visible que des
        personnes invitées. Nos sous-traitants techniques sont Vercel (hébergement du site) et Supabase (base de données et fichiers,
        stockés dans l’Union européenne).
      </p>
      <h2>Combien de temps</h2>
      <p>
        Les mémoriaux sont conservés tant que la famille le souhaite. Le gardien peut demander la suppression complète d’une page à
        tout moment. Les empreintes anti-abus sont effacées au bout de 30 jours. Les données de vente sont gardées dix ans, comme
        l’exige la loi comptable.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l’accès, la correction ou l’effacement de vos données, ou vous opposer à leur traitement, en écrivant à{" "}
        <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. Un visiteur peut demander le retrait de son message du livre d’or.
        Vous pouvez aussi saisir la CNIL (cnil.fr).
      </p>
    </LegalPage>
  );
}
