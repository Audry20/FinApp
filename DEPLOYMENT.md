# Déploiement sur Vercel (avec base Supabase)

Ceci explique comment déployer le projet sur Vercel depuis GitHub et quelles variables d'environnement configurer.

Étapes rapides:

1. Poussez votre code dans le dépôt GitHub `https://github.com/Audry20/FinanceApp` sur la branche `main`.
2. Créez un compte et connectez-vous sur https://vercel.com.
3. Importez le dépôt depuis GitHub via l'interface Vercel ("Import Project"). Vercel détecte automatiquement Next.js.
4. Dans le dashboard Vercel > Settings > Environment Variables, ajoutez les variables suivantes (valeurs depuis Supabase / Google):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

Option: Déploiement via GitHub Actions

1. Générer un token Vercel personnel: https://vercel.com/account/tokens
2. Récupérer `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` depuis l'URL du projet Vercel ou via `vercel projects list`.
3. Dans GitHub > Repository > Settings > Secrets, ajoutez les secrets:
   - `VERCEL_TOKEN` (token créé)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Le workflow `.github/workflows/deploy-to-vercel.yml` est inclus dans ce dépôt; il va déclencher un déploiement vers Vercel à chaque push sur `main`.

Remarques importantes:
- Ne committez jamais vos clés privées (ex: `SUPABASE_SERVICE_ROLE_KEY` si vous en avez). Utilisez les Secrets GitHub et/Vercel.
- Le projet utilise `NEXT_PUBLIC_` pour les clés front-end (publiques). Si vous avez besoin de clés serveur, configurez-les en `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur et dans les secrets.
- Si vous préférez que Vercel gère automatiquement les déploiements (recommandé), il suffit de connecter le repo depuis Vercel et d'ajouter les variables d'environnement dans le dashboard.
