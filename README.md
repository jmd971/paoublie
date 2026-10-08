# Pa Oublié

Mémoriaux numériques par plaque QR sur les tombes, en Guadeloupe. Une plaque sur la tombe ouvre une page qui raconte
la vie du défunt : chapitres, photos, voix, livre d’or, bougies et fleurs. Le service est vendu par des distributeurs
(pompes funèbres, marbriers) qui touchent une commission.

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Sans configuration, l’application tourne en **mode démonstration** : données fictives
de la famille Anatole, en mémoire, remises à zéro à chaque redémarrage. Sur la page d’accueil, on entre comme une
famille ou comme une pompe funèbre.

- Exemple de plaque : `/m/7KQ2XM`
- Plaque vierge à activer : `/m/H4RT8W`

## Brancher Supabase

1. Créer un projet Supabase (région UE).
2. Exécuter `supabase/migrations/0001_init.sql` dans l’éditeur SQL.
3. Copier `.env.example` en `.env.local` et remplir les clés.
4. Créer les distributeurs dans la table `distributors`, puis lier leur compte : `profiles.role = 'distributor'` et
   `profiles.distributor_id`.

La connexion se fait par lien magique envoyé par e-mail. Le profil d’une famille est créé à sa première connexion
(voir « À faire »).

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/app/m/[code]` | Page ouverte par le scan : le caveau, puis le mémorial de chaque défunt |
| `src/app/espace` | Espace famille : mémoriaux, souvenirs à valider, création |
| `src/app/pro` | Espace distributeur : ventes, commissions, plaques en stock, génération de lots |
| `src/app/api/qr/[code]` | QR code d’une plaque en SVG, pour le fabricant |
| `src/app/actions.ts` | Toutes les actions serveur (bougies, messages, modération, création, lots de codes) |
| `src/lib/repo` | Accès aux données : `demo.ts` (mémoire) et `supabase.ts` |
| `supabase/migrations` | Schéma de la base et règles de sécurité (RLS) |

## Règles métier

- Un QR code = un caveau. Jusqu’à 3 défunts par caveau dans la formule de base.
- Les codes sont générés par lots à l’avance (6 caractères, sans 0/O ni 1/I/L) puis rattachés à une tombe.
- Un mémorial créé avec une plaque d’un distributeur, ou par le distributeur lui-même, lui est attribué : la commission
  (25 % du HT par défaut) est calculée à la commande.
- Rien n’est publié dans le livre d’or sans l’accord de la famille.
- Prix TTC avec la TVA de 8,5 % applicable en Guadeloupe (`src/lib/pricing.ts`).

## À faire

1. Paiement Stripe à la commande, et suivi de la commande jusqu’à la pose.
2. Création automatique du profil famille à la première connexion (trigger sur `auth.users`).
3. Envoi de photos, vidéos et vocaux (Supabase Storage) et édition des chapitres.
4. Invitations de la famille par WhatsApp.
5. Export du mémorial et réversibilité.
