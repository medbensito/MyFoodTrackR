/**
 * Prix d'achat indicatifs au Maroc (novembre 2026), en dirhams par kilo (ou par litre)
 * TEL QU'ACHETÉ : cru, sec, entier… Repères : bulletins des marchés de gros de Casablanca
 * (+ marge de détail), presse économique marocaine, Marjane pour la whey.
 * Ce sont des estimations : chacun ajuste dans la fiche de l'aliment.
 */
export const PRICES: Record<string, number> = {
  // Viandes, poissons, œufs
  'poulet-blanc-cuit': 50, 'poulet-cuisse-cuite': 28, 'dinde-escalope-cuite': 60, 'dinde-tranches': 90,
  'boeuf-hache-5': 110, 'rumsteck-cuit': 130, 'saumon-cuit': 200, 'poisson-blanc-cuit': 60,
  'crevettes-cuites': 120, 'sardines-grillees': 20, 'thon-naturel-egoutte': 130,
  'oeuf-entier': 26, 'blanc-oeuf': 43,
  // Crèmerie
  'yaourt-grec-0': 45, 'fromage-blanc-0': 35, 'lait-demi-ecreme': 8, lben: 7, jben: 60, emmental: 120, feta: 110,
  // Féculents, pain
  'riz-blanc-cru': 16, 'riz-blanc-cuit': 16, 'pates-crues': 14, 'pates-cuites': 14, 'flocons-avoine-crus': 30,
  'semoule-cru': 12, 'semoule-cuite': 12, 'pommes-terre-cuites': 6, 'patate-douce-cuite': 10, 'pain-complet': 25,
  khobz: 8, msemen: 30, 'farine-ble': 7, 'lentilles-cuites': 22, 'pois-chiches-cuits': 20,
  'haricots-blancs-cuits': 22, 'haricots-rouges-cuits': 25, 'tortilla-ble': 70, pita: 30, 'galettes-riz': 150,
  // Fruits et légumes
  banane: 15, pomme: 12, orange: 7, avocat: 30, 'fruits-rouges': 60, 'dattes-medjool': 100,
  tomate: 10, carotte: 5, oignon: 5, poivron: 10, concombre: 6, laitue: 8, 'brocoli-cuit': 15,
  'courgette-cuite': 10, 'haricots-verts-cuits': 12, 'epinards-cuits': 30, 'champignons-cuits': 40, 'mais-doux': 45,
  // Épicerie
  'huile-olive': 65, amandes: 120, 'beurre-cacahuete': 100, 'olives-vertes': 30, miel: 150, 'sauce-soja': 60,
  whey: 425,
}

/**
 * Pour les aliments comptés cuits (ou égouttés), ce qu'on achète vraiment :
 * `k` grammes achetés par gramme compté, et sous quelle forme.
 */
export const BUY: Record<string, { k: number; form: string }> = {
  'poulet-blanc-cuit': { k: 1.35, form: 'cru' },
  'poulet-cuisse-cuite': { k: 1.7, form: 'avec os' },
  'dinde-escalope-cuite': { k: 1.3, form: 'crue' },
  'rumsteck-cuit': { k: 1.25, form: 'cru' },
  'saumon-cuit': { k: 1.2, form: 'cru' },
  'poisson-blanc-cuit': { k: 1.25, form: 'cru' },
  'crevettes-cuites': { k: 1.25, form: 'crues' },
  'sardines-grillees': { k: 2, form: 'entières' },
  'riz-blanc-cuit': { k: 0.4, form: 'cru' },
  'pates-cuites': { k: 0.43, form: 'crues' },
  'semoule-cuite': { k: 0.36, form: 'crue' },
  'pommes-terre-cuites': { k: 1.15, form: 'crues' },
  'patate-douce-cuite': { k: 1.25, form: 'crue' },
  'lentilles-cuites': { k: 0.4, form: 'sèches' },
  'pois-chiches-cuits': { k: 0.45, form: 'secs' },
  'haricots-blancs-cuits': { k: 0.4, form: 'secs' },
  'haricots-rouges-cuits': { k: 0.4, form: 'secs' },
  'brocoli-cuit': { k: 1.4, form: 'cru' },
  'courgette-cuite': { k: 1.15, form: 'crue' },
  'haricots-verts-cuits': { k: 1.05, form: 'crus' },
  'champignons-cuits': { k: 1.4, form: 'crus' },
}
