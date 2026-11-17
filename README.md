# MyFoodTrackR

PWA personnelle de nutrition : planning de la semaine, recettes avec macros, tracker de protéines. Tout est stocké localement sur l'appareil (IndexedDB).

## État : jalon M0 — Socle

- Projet Vite + React + TypeScript
- PWA installable, fonctionnement hors ligne (service worker généré par `vite-plugin-pwa`)
- Navigation : Planning, Recettes, Tracker + Réglages
- Base locale Dexie, import automatique des 33 aliments au premier lancement
- Réglages : profil, jours et moment d'entraînement, cibles (glucides calculés automatiquement)

## Commandes

```bash
npm install       # une seule fois
npm run dev       # développement local
npm test          # tests des calculs et de la base
npm run build     # version de production dans dist/
npm run preview   # tester la version de production
```

## Déploiement (GitHub Pages)

Chaque push sur `main` lance `.github/workflows/deploy.yml` : installation, tests, build, puis publication sur GitHub Pages. Si un test échoue, rien n'est publié.

Mise en place, une seule fois :
1. Pousser le dépôt sur GitHub.
2. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
3. L'adresse apparaît dans l'onglet **Actions** une fois le premier déploiement terminé (`https://<utilisateur>.github.io/myfoodtrackr/`).

## Installer sur iPhone

1. Ouvrir l'adresse GitHub Pages dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.

Les mises à jour arrivent automatiquement à la réouverture de l'app. Les données restent sur l'iPhone et ne sont pas effacées par une mise à jour.

## Structure

```
src/
  types.ts            modèle de données
  lib/targets.ts      cibles, glucides calculés, jours d'entraînement
  db/db.ts            base Dexie (IndexedDB)
  db/seed.ts          import de la base d'aliments
  data/               base_aliments_v1.json
  components/         barre d'onglets, icônes
  screens/            Planning, Recettes, Tracker, Réglages
```
