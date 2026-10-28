import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_UPDATED, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  description: "Conditions d’utilisation de Pa Oublié : création des mémoriaux, rôle des familles, livre d’or, plaques QR et durée du service.",
};

export default function Terms() {
  return (
    <LegalPage title="Conditions d’utilisation" updated={LEGAL_UPDATED}>
      <p>
        Pa Oublié permet de créer la page de mémoire d’un proche disparu, reliée à une plaque QR posée sur sa tombe. En utilisant le
        service, vous acceptez les conditions ci-dessous.
      </p>
      <h2>Qui fait quoi</h2>
      <ul>
        <li>
          <strong>La pompe funèbre ou le distributeur</strong> vend la plaque, crée la page et la remet à la famille par un lien.
        </li>
        <li>
          <strong>Le gardien de la page</strong>, membre de la famille, écrit l’histoire, choisit qui peut voir la page, valide les
          messages du livre d’or et invite les proches. Il peut partager ce rôle.
        </li>
        <li>
          <strong>Les proches invités</strong> ajoutent leurs photos, vidéos et enregistrements.
        </li>
        <li>
          <strong>Les visiteurs</strong> consultent la page, allument une bougie, déposent une fleur et laissent un message.
        </li>
      </ul>
      <h2>Contenus</h2>
      <p>
        Vous ne publiez que des contenus que vous avez le droit de partager : vos propres photos, ou celles pour lesquelles les
        personnes représentées ou leur famille sont d’accord. Sont interdits les contenus injurieux, diffamatoires, haineux, à
        caractère publicitaire ou portant atteinte à la vie privée d’autrui. Le gardien peut retirer un média ; l’éditeur peut retirer
        un contenu signalé et manifestement illicite.
      </p>
      <h2>Livre d’or</h2>
      <p>
        Chaque message est lu par la famille avant d’être publié. La famille peut aussi le garder pour elle. Les liens vers d’autres
        sites ne sont pas acceptés, et le nombre de messages, bougies et fleurs est limité pour éviter les abus.
      </p>
      <h2>Plaque et paiement</h2>
      <p>
        Le prix de la formule est payé à la pompe funèbre ou au distributeur qui vous a remis la plaque. La page est hébergée sans
        abonnement, pour toute la durée de vie du service. Si le service devait s’arrêter, chaque gardien serait prévenu au moins six
        mois à l’avance et pourrait récupérer l’ensemble des textes et fichiers de sa page.
      </p>
      <h2>Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
      <h2>Contact</h2>
      <p>
        Pour toute question : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. Ces conditions relèvent du droit français.
      </p>
    </LegalPage>
  );
}
