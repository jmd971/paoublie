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
2. Exécuter dans l’ordre `supabase/migrations/0001_init.sql` puis `0002_pilote.sql` dans l’éditeur SQL
   (la seconde crée le bucket `media`, les invitations, l’anti-abus et le profil automatique).
3. Copier `.env.example` en `.env.local` et remplir les clés.
4. Créer les distributeurs dans la table `distributors`, puis lier leur compte : `profiles.role = 'distributor'` et
   `profiles.distributor_id`.

La connexion se fait par e-mail et mot de passe (création de compte, « mot de passe oublié »). Le profil d’une famille
est créé automatiquement à l’inscription. Variables facultatives : `NEXT_PUBLIC_SITE_URL` (adresse publique, sinon l’URL Vercel), `RATE_LIMIT_SALT`
(sel des empreintes anti-abus), `NEXT_PUBLIC_CONTACT_EMAIL` (contact des pages légales).

### Réglages Supabase pour la connexion

1. **Authentication → URL Configuration** : *Site URL* = `https://paoublie.vercel.app` ; *Redirect URLs* :
   `https://paoublie.vercel.app/**` et `https://paoublie-*-jean-marcs-projects-b911a161.vercel.app/**`.
2. **Authentication → Emails → SMTP Settings** : brancher un vrai service d’envoi (Brevo, Resend…). Le service
   fourni par défaut n’écrit qu’aux membres de l’équipe Supabase, en petite quantité.
3. **Authentication → Emails → Templates** : pour que les liens marchent même ouverts depuis l’application Gmail
   (autre navigateur), remplacer le lien des modèles :
   - *Confirm signup* : `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirmer mon adresse</a>`
   - *Reset Password* : `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Choisir un nouveau mot de passe</a>`

   Sans ce changement, tout fonctionne dans le même navigateur ; ouvert ailleurs, la confirmation d’inscription
   aboutit quand même (on invite à se connecter), mais le lien de mot de passe oublié doit être rouvert sur le même appareil.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/app/m/[code]` | Page ouverte par le scan : le caveau, puis le mémorial de chaque défunt |
| `src/app/espace` | Espace famille : mémoriaux, souvenirs à valider, création |
| `src/app/espace/tombe/[id]` | Gestion d’une tombe : défunts, ajout d’un défunt, invitations des proches ; éditeur et envoi de médias |
| `src/app/connexion` | Connexion et création de compte (deux onglets), mot de passe oublié, nouveau mot de passe |
| `src/app/auth/callback` | Retour des liens reçus par e-mail (confirmation, mot de passe oublié) |
| `src/app/invitation/[token]` | Lien reçu par WhatsApp ou SMS : création du compte sur place, puis acceptation automatique |
| `src/app/pro` | Espace distributeur : ventes, commissions, plaques en stock, génération de lots |
| `src/app/pro/tombe/[id]` | Suivi d’une famille : lien de remise, règlement marqué par la pompe funèbre |
| `src/app/mentions-legales`, `cgu`, `confidentialite` | Pages légales (éditeur dans `src/lib/legal.ts`) |
| `src/app/api/qr/[code]` | QR code d’une plaque en SVG, pour le fabricant |
| `src/app/actions.ts` | Toutes les actions serveur (bougies, messages, modération, création, lots de codes) |
| `src/lib/repo` | Accès aux données : `demo.ts` (mémoire) et `supabase.ts` |
| `supabase/migrations` | Schéma de la base et règles de sécurité (RLS) |

## Règles métier

- Un QR code = un caveau. Jusqu’à 3 défunts par caveau dans la formule de base.
- Les codes sont générés par lots à l’avance (6 caractères, sans 0/O ni 1/I/L) puis rattachés à une tombe.
- Un mémorial créé avec une plaque d’un distributeur, ou par le distributeur lui-même, lui est attribué : la commission
  (25 % du HT par défaut) est calculée à la commande.
- La pompe funèbre crée la page puis la remet à la famille par un lien à usage unique : la personne qui l’ouvre devient
  gardienne. Le gardien écrit l’histoire, valide le livre d’or et ajoute des défunts (6 au plus par caveau). Les proches
  invités (lien valable 60 jours) ajoutent photos, vidéos et voix.
- Rien n’est publié dans le livre d’or sans l’accord de la famille. Anti-abus : champ piège, délai minimal de saisie,
  un seul lien par message, 5 messages par heure, une bougie et une fleur par visiteur et par jour.
- Le règlement est encaissé par la pompe funèbre, qui le marque comme réglé dans son espace.
- Prix TTC avec la TVA de 8,5 % applicable en Guadeloupe (`src/lib/pricing.ts`).

## À faire

1. Paiement en ligne Stripe (aujourd’hui : règlement marqué par la pompe funèbre).
2. Export du mémorial et réversibilité.
3. Suppression d’une page à la demande du gardien, depuis son espace.
