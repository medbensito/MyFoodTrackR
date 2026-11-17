# MyFoodTrackR

Design : direction A « Nuit athlétique » (fond noir, citron #C8F560, Barlow Condensed + Inter embarquées pour le hors-ligne).

PWA personnelle de nutrition : planning de la semaine, recettes avec macros, tracker de protéines. Tout est stocké localement sur l'appareil (IndexedDB).

## État : v3.3.0

- Coût des courses en dirhams : prix d'achat au kilo pour chaque aliment (estimations Maroc novembre 2026, modifiables dans la fiche de l'aliment)
- Liste de courses : poids réellement à acheter (cru, sec, entier) pour les aliments comptés cuits, coût par article, budget estimé, reste à acheter, coût par repas
- Recettes : coût de la portion (suit la portion choisie), coût par ingrédient, coût dans la liste des recettes

### v3.2.0

- Calories gérées sur la semaine : écart prévu (resto, sortie, fête, famille) dans « Ce jour-là », dépassements constatés compensés sur les jours suivants (300 kcal max par jour, protéines inchangées), carte « Semaine équilibrée » dans Planning, note dans le Tracker, réglage pour désactiver la compensation
- « Que manger maintenant ? » dans le Tracker : 3 propositions (recettes ou aliments, portion ajustée) pour le repas en cours ou pour finir la journée, en gardant de quoi couvrir les repas suivants
- 20 nouvelles recettes guidées : 9 plats rapides, 6 petits-déjeuners / s'hour, 5 collations protéinées, et 17 nouveaux aliments
- Planning plus varié : tirage parmi les recettes proches de la meilleure, favoris et recettes peu utilisées favorisés (44 recettes sur 47 apparaissent sur 40 semaines simulées, toutes les journées restent dans la cible)

### v3.1.0

- Fiches recettes guidées : temps de préparation et de cuisson, matériel, étapes détaillées (feu, durées, repères de cuisson), astuces, pour les 27 recettes fournies
- Quantités dans les étapes qui suivent la portion, poids cru à acheter pour les ingrédients comptés cuits, eau de cuisson, œufs à la pièce
- Étapes à cocher pendant la préparation ; temps total dans la liste des recettes
- Éditeur : temps, matériel, étapes et astuces (une par ligne) ; [Nom d'un ingrédient] affiche sa quantité

### v3.0.0

- Recettes rééquilibrées : une semaine générée tombe vers 145–180 g de protéines (cible 140 g), calories à ±85 kcal
- Cibles adaptatives (Profil › Poids) : pesée hebdo, tendance sur 4 semaines, dépense réelle estimée depuis le journal, ajustement proposé (±200 kcal max, 1 fois tous les 14 jours)
- Mode Ramadan (Réglages) : s'hour, ftour, collation du soir, dîner ; dates modifiables (prévision : 8 février – 9 mars 2027) ; séance avant ftour, après ftour ou aucune
- Scan de code-barres (Aliments, et « Ajouter un repas ») : décodage ZXing embarqué (marche hors ligne), fiche Open Food Facts pré-remplie à vérifier, saisie manuelle du code ou de l'étiquette en repli ; un produit scanné une fois est reconnu sans réseau

### v2.0.0

- Liste de courses depuis le planning (rayons, cases à cocher, partage en texte)
- Séance sautée ou ajoutée : change la cible du jour et peut recomposer les repas restants
- Favoris et récents dans « Ajouter un repas » (ajout en un tap)
- Bilan de la semaine : jours réussis, série, protéines par jour, 4 dernières semaines
- Pack de 16 recettes protéinées, dont tajine de poulet, kefta aux œufs, harira, loubia

### v1.0.0 — jalon M4

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
