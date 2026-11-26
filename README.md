# BarberShop DZ — Gestion de Salon de Coiffure (Algérie / DZD)

Application web moderne, bilingue (**Français / العربية avec support RTL complet**) et sécurisée pour la gestion d'un salon de coiffure pour hommes en Algérie.

## Fonctionnalités

- **Rôle Gérant (`gerant`)** :
  - **Tableau de bord financier** : Recettes totales, commissions coiffeurs, dépenses et **Marge Nette** (`Recettes − Dépenses − Commissions`) avec filtres Jour / Semaine / Mois / Année et graphiques (évolution des recettes, affluence par heure et par jour).
  - **Gestion des postes & coiffeurs** : Création, modification, activation/désactivation, suppression, et réglage individuel du pourcentage de commission (ex: 50%, 55%, 60%).
  - **Gestion des dépenses** : Suivi des charges fixes et variables (loyer, électricité, produits, lames, café, équipement).
  - **Paramètres du salon** : Nom du salon et catalogue bilingue des prestations en **DZD**.
- **Rôle Coiffeur / Poste (`coiffeur`)** :
  - **Saisie tactile en 2 clics** : Touchez une prestation puis confirmez l'encaissement.
  - **Isolation stricte (RLS)** : Le coiffeur voit uniquement ses propres gains du jour et de la semaine, ainsi que son propre historique.

---

## Guide d'installation étape par étape

### Étape 1 : Configurer Supabase (Base de données & Sécurité RLS)

1. Créez un compte gratuit sur [supabase.com](https://supabase.com) et cliquez sur **New Project**.
2. Une fois le projet prêt, allez dans **SQL Editor** → **New query**.
3. Copiez tout le contenu du fichier `supabase/schema.sql`, collez-le et cliquez sur **Run**.
4. **Désactiver la confirmation d'email (recommandé pour créer des comptes coiffeurs rapidement)** :
   - Allez dans **Authentication** → **Providers** → **Email** et décochez **Confirm email** (ou gardez-le activé si vous préférez valider par email).
5. **Créer le premier compte Gérant** :
   - Allez dans **Authentication** → **Users** → **Add user** → **Create new user** (entrez votre email et mot de passe).
   - Ensuite, dans **SQL Editor**, exécutez la requête suivante en remplaçant par votre email pour passer votre compte en rôle `gerant` :
     ```sql
     UPDATE public.profiles
     SET role = 'gerant', commission_rate = 100, station_name = 'Direction'
     WHERE email = 'votre-email@exemple.dz';
     ```
6. Récupérez vos clés dans **Project Settings** → **API** :
   - `Project URL` (`VITE_SUPABASE_URL`)
   - `anon public` key (`VITE_SUPABASE_ANON_KEY`)

---

### Étape 2 : Tester en local

1. Copiez `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```
   *(Sans fichier `.env`, l'application démarre automatiquement en **Mode Démo Local** pour vous permettre de tester toutes les interfaces immédiatement.)*
2. Renseignez vos clés Supabase dans `.env` :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
   ```
3. Installez les dépendances et lancez le serveur de développement :
   ```bash
   npm install
   npm run dev
   ```

---

### Étape 3 : Déployer sur GitHub & Cloudflare Pages

1. **Pousser sur GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BarberShop DZ"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/barbershopdz.git
   git push -u origin main
   ```
2. **Déployer sur Cloudflare Pages** :
   - Connectez-vous à [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
   - Sélectionnez votre dépôt `barbershopdz`.
   - Paramètres de build :
     - **Framework preset** : `Vite`
     - **Build command** : `npm run build`
     - **Build output directory** : `dist`
   - Dans **Environment variables** (Production & Preview), ajoutez :
     - `VITE_SUPABASE_URL` = votre URL Supabase
     - `VITE_SUPABASE_ANON_KEY` = votre clé `anon` Supabase
   - Cliquez sur **Save and Deploy**. Votre application est en ligne en HTTPS !
