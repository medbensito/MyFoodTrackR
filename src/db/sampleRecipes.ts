import type { Recipe } from '../types'

/** Recettes d'exemple, 1 portion chacune. Modifiables et supprimables. */
export const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'ex-porridge-proteine',
    name: 'Porridge protéiné banane',
    servings: 1,
    slots: ['breakfast'],
    ingredients: [
      { foodId: 'flocons-avoine-crus', grams: 70 },
      { foodId: 'lait-demi-ecreme', grams: 250 },
      { foodId: 'banane', grams: 120 },
      { foodId: 'yaourt-grec-0', grams: 150 },
    ],
    notes: 'Cuire les flocons dans le lait, ajouter la banane en rondelles et le yaourt grec hors du feu.',
  },
  {
    id: 'ex-omelette-pain',
    name: 'Omelette et pain complet',
    servings: 1,
    slots: ['breakfast'],
    ingredients: [
      { foodId: 'oeuf-entier', grams: 150 },
      { foodId: 'pain-complet', grams: 120 },
      { foodId: 'tomate', grams: 120 },
      { foodId: 'huile-olive', grams: 5 },
    ],
    notes: '3 œufs en omelette, pain complet grillé.',
  },
  {
    id: 'ex-poulet-riz-brocoli',
    name: 'Poulet, riz et brocoli',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'poulet-blanc-cuit', grams: 110 },
      { foodId: 'riz-blanc-cru', grams: 100 },
      { foodId: 'brocoli-cuit', grams: 150 },
      { foodId: 'huile-olive', grams: 10 },
    ],
  },
  {
    id: 'ex-pates-bolognaise',
    name: 'Pâtes bolognaise maison',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'pates-crues', grams: 100 },
      { foodId: 'boeuf-hache-5', grams: 150 },
      { foodId: 'tomate', grams: 200 },
      { foodId: 'huile-olive', grams: 10 },
    ],
  },
  {
    id: 'ex-saumon-pdt',
    name: 'Saumon, pommes de terre et brocoli',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'saumon-cuit', grams: 130 },
      { foodId: 'pommes-terre-cuites', grams: 300 },
      { foodId: 'brocoli-cuit', grams: 150 },
    ],
  },
  {
    id: 'ex-pates-thon',
    name: 'Pâtes au thon et tomate',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'pates-crues', grams: 100 },
      { foodId: 'thon-naturel-egoutte', grams: 100 },
      { foodId: 'tomate', grams: 150 },
      { foodId: 'huile-olive', grams: 10 },
    ],
  },
  {
    id: 'ex-couscous-poulet',
    name: 'Couscous poulet et carottes',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'semoule-cru', grams: 100 },
      { foodId: 'poulet-blanc-cuit', grams: 110 },
      { foodId: 'carotte', grams: 150 },
      { foodId: 'huile-olive', grams: 10 },
    ],
  },
  {
    id: 'ex-sardines-riz',
    name: 'Sardines grillées et riz',
    servings: 1,
    slots: ['lunch', 'dinner'],
    ingredients: [
      { foodId: 'sardines-grillees', grams: 120 },
      { foodId: 'riz-blanc-cru', grams: 90 },
      { foodId: 'tomate', grams: 150 },
    ],
  },
  {
    id: 'ex-lentilles-oeufs',
    name: 'Lentilles, œufs et carottes',
    servings: 1,
    slots: ['dinner'],
    ingredients: [
      { foodId: 'lentilles-cuites', grams: 250 },
      { foodId: 'oeuf-entier', grams: 100 },
      { foodId: 'carotte', grams: 100 },
      { foodId: 'huile-olive', grams: 10 },
    ],
  },
  {
    id: 'ex-yaourt-amandes',
    name: 'Yaourt grec et amandes',
    servings: 1,
    slots: ['snack'],
    ingredients: [
      { foodId: 'yaourt-grec-0', grams: 200 },
      { foodId: 'amandes', grams: 20 },
    ],
  },
  {
    id: 'ex-fromage-blanc-pomme',
    name: 'Fromage blanc et pomme',
    servings: 1,
    slots: ['snack'],
    ingredients: [
      { foodId: 'fromage-blanc-0', grams: 250 },
      { foodId: 'pomme', grams: 150 },
    ],
  },
]
