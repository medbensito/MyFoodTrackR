# MyFoodTrackR

Design : direction A « Nuit athlétique » (fond noir, citron #C8F560, Barlow Condensed + Inter embarquées pour le hors-ligne).

PWA personnelle de nutrition : planning de la semaine, recettes avec macros, tracker de protéines. Tout est stocké localement sur l'appareil (IndexedDB).

## État : v1.0.0 — jalon M4 terminé

- Sauvegarde : export JSON (feuille de partage iOS → « Enregistrer dans Fichiers », sinon téléchargement), import vérifié avec confirmation, date du dernier export et rappel après 7 jours
- Installation : statut plein écran, hors ligne et stockage protégé dans Réglages ; demande de stockage persistant au lancement
- Testé : rechargement de l'app sans connexion

### Jalon M3 — Tracker

- Journal du jour avec instantané des macros (une recette modifiée plus tard ne change pas l'historique)
- Repas planifiés cochables (« Mangé ») depuis le Tracker ou la feuille repas du Planning
- Ajout libre : recette en portions ou aliment en grammes, avec créneau
- Anneau des calories, tuiles réel / cible, ce qu'il reste à manger, comparaison prévu / réel, navigation par jour

### Jalon M2 — Moteur de planning

- `src/lib/planner.ts` : fonction pure `generateWeek(input, seed)`, testée
  - cibles par créneau (25 / 35 / 30 / 10 % des kcal), supplément d'entraînement sur le repas qui suit la séance
  - portions de ×0,5 à ×2, score pondéré (manque de protéines ×3, kcal ×1, glucides et lipides ×0,5)
  - variété : 2 fois max par créneau, jamais deux jours de suite, 3 fois max dans la semaine
  - repas épinglés conservés, correction de fin de journée, proposition d'ajustement après modification
- Onglet Planning : générer / régénérer, navigation entre semaines, total et écart par jour, feuille repas (portion, recette, épingler, retirer)

### Jalon M1 — Aliments et recettes

- Base d'aliments : recherche, filtres, édition, marquer comme vérifié, ajout d'aliments perso, suppression bloquée si utilisé dans une recette
- Recettes : liste filtrable par créneau, recherche, fiche détaillée, éditeur avec macros en direct
- 11 recettes d'exemple (ajoutées aussi aux installations M0 via la migration v2)

### Jalon M0 — Socle

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
