import type { Food, FoodState, Recipe } from '../types'

/**
 * Pack v3.2 : plats rapides du quotidien, petits-déjeuners / s'hour et collations protéinées.
 * Valeurs approximatives pour 100 g, à vérifier (verified = false).
 */
const f = (id: string, name: string, category: string, state: FoodState, kcal: number, protein: number, carbs: number, fat: number, defaultPortionG: number): Food =>
  ({ id, name, category, state, kcal, protein, carbs, fat, defaultPortionG, source: 'approximation', verified: false, custom: false })

export const PACK3_FOODS: Food[] = [
  f('tortilla-ble', 'Tortilla de blé (wrap)', 'feculents', 'solide', 310, 8.5, 51, 7.5, 60),
  f('pita', 'Pain pita', 'feculents', 'solide', 275, 9, 55, 1.2, 60),
  f('galettes-riz', 'Galettes de riz soufflé', 'feculents', 'sec', 380, 8, 80, 3, 9),
  f('haricots-rouges-cuits', 'Haricots rouges', 'feculents', 'cuit', 115, 8, 16, 0.5, 150),
  f('feta', 'Feta', 'laitier', 'solide', 264, 14, 4, 21, 30),
  f('rumsteck-cuit', 'Steak de bœuf (rumsteck)', 'proteines', 'cuit', 170, 28, 0, 6.5, 120),
  f('dinde-tranches', 'Blanc de dinde en tranches', 'proteines', 'solide', 105, 20, 1.5, 2, 40),
  f('avocat', 'Avocat', 'fruits', 'cru', 160, 2, 2, 15, 70),
  f('fruits-rouges', 'Fruits rouges (surgelés)', 'fruits', 'cru', 40, 1, 7, 0.4, 100),
  f('orange', 'Orange', 'fruits', 'cru', 44, 0.9, 9, 0.2, 150),
  f('concombre', 'Concombre', 'legumes', 'cru', 14, 0.7, 2.2, 0.1, 100),
  f('laitue', 'Salade verte', 'legumes', 'cru', 15, 1.3, 1.7, 0.2, 50),
  f('mais-doux', 'Maïs doux', 'legumes', 'conserve', 85, 2.9, 15, 1.2, 70),
  f('epinards-cuits', 'Épinards', 'legumes', 'cuit', 23, 2.9, 1.6, 0.5, 150),
  f('champignons-cuits', 'Champignons de Paris', 'legumes', 'cuit', 25, 2.2, 2.5, 0.5, 100),
  f('haricots-verts-cuits', 'Haricots verts', 'legumes', 'cuit', 25, 1.9, 3.6, 0.2, 150),
  f('sauce-soja', 'Sauce soja', 'autre', 'liquide', 60, 8, 6, 0.5, 10),
]

const r = (id: string, name: string, slots: Recipe['slots'], ingredients: [string, number][]): Recipe =>
  ({ id, name, servings: 1, slots, ingredients: ingredients.map(([foodId, grams]) => ({ foodId, grams })) })

export const PACK3_RECIPES: Recipe[] = [
  // ——— Plats rapides (moins de 20 min) ———
  r('p3-wrap-poulet', 'Wrap poulet, crudités et feta', ['lunch', 'dinner'], [
    ['tortilla-ble', 120], ['poulet-blanc-cuit', 60], ['feta', 20], ['mais-doux', 50], ['tomate', 80], ['laitue', 30], ['concombre', 60], ['yaourt-grec-0', 50],
  ]),
  r('p3-bowl-thon-avocat', 'Bowl riz, thon et avocat', ['lunch', 'dinner'], [
    ['riz-blanc-cru', 100], ['thon-naturel-egoutte', 80], ['avocat', 50], ['mais-doux', 50], ['concombre', 80], ['sauce-soja', 10],
  ]),
  r('p3-saute-boeuf-riz', 'Sauté de bœuf aux légumes et riz', ['lunch', 'dinner'], [
    ['rumsteck-cuit', 100], ['riz-blanc-cru', 85], ['poivron', 100], ['oignon', 50], ['brocoli-cuit', 100], ['sauce-soja', 15], ['huile-olive', 8],
  ]),
  r('p3-pates-poulet-epinards', 'Pâtes crémeuses poulet, épinards et champignons', ['lunch', 'dinner'], [
    ['pates-crues', 100], ['poulet-blanc-cuit', 50], ['epinards-cuits', 100], ['champignons-cuits', 100], ['fromage-blanc-0', 40], ['emmental', 10], ['huile-olive', 8],
  ]),
  r('p3-chili-express', 'Chili express aux haricots rouges', ['lunch', 'dinner'], [
    ['boeuf-hache-5', 100], ['haricots-rouges-cuits', 150], ['tomate', 200], ['oignon', 50], ['mais-doux', 50], ['riz-blanc-cru', 60], ['huile-olive', 5],
  ]),
  r('p3-steak-pdt-haricots', 'Steak, pommes de terre sautées et haricots verts', ['lunch', 'dinner'], [
    ['rumsteck-cuit', 90], ['pommes-terre-cuites', 300], ['haricots-verts-cuits', 150], ['huile-olive', 10],
  ]),
  r('p3-pita-kefta', 'Pita kefta, salade et sauce yaourt', ['lunch', 'dinner'], [
    ['boeuf-hache-5', 80], ['pita', 120], ['tomate', 80], ['oignon', 20], ['laitue', 30], ['yaourt-grec-0', 40], ['huile-olive', 5],
  ]),
  r('p3-riz-saute-dinde', 'Riz sauté à la dinde et aux œufs', ['lunch', 'dinner'], [
    ['riz-blanc-cru', 80], ['dinde-escalope-cuite', 70], ['oeuf-entier', 100], ['mais-doux', 50], ['poivron', 60], ['sauce-soja', 15], ['huile-olive', 8],
  ]),
  r('p3-omelette-epinards-feta', 'Omelette épinards-feta et pain complet', ['dinner', 'breakfast'], [
    ['oeuf-entier', 150], ['epinards-cuits', 100], ['feta', 20], ['pain-complet', 100], ['huile-olive', 6],
  ]),

  // ——— Petits-déjeuners / s'hour ———
  r('p3-tartines-oeufs-avocat', 'Tartines œufs brouillés et avocat', ['breakfast'], [
    ['pain-complet', 100], ['oeuf-entier', 100], ['blanc-oeuf', 30], ['avocat', 40], ['tomate', 60],
  ]),
  r('p3-overnight-oats', 'Overnight oats au yaourt grec et fruits rouges', ['breakfast'], [
    ['flocons-avoine-crus', 60], ['lait-demi-ecreme', 200], ['yaourt-grec-0', 150], ['fruits-rouges', 80], ['miel', 8],
  ]),
  r('p3-msemen-oeufs-lben', 'Msemen, œufs et lben', ['breakfast'], [
    ['msemen', 80], ['oeuf-entier', 100], ['lben', 250],
  ]),
  r('p3-bol-fromage-blanc-cacahuete', 'Bol fromage blanc, avoine, banane et cacahuète', ['breakfast'], [
    ['fromage-blanc-0', 200], ['flocons-avoine-crus', 40], ['banane', 100], ['beurre-cacahuete', 15],
  ]),
  r('p3-toast-dinde-orange', 'Toasts dinde, jben et tomate, orange', ['breakfast'], [
    ['pain-complet', 100], ['dinde-tranches', 40], ['jben', 30], ['tomate', 60], ['orange', 150],
  ]),
  r('p3-smoothie-fruits-rouges', 'Smoothie protéiné fruits rouges et banane', ['breakfast', 'snack'], [
    ['lait-demi-ecreme', 250], ['whey', 15], ['fruits-rouges', 100], ['banane', 80], ['flocons-avoine-crus', 30],
  ]),

  // ——— Collations protéinées ———
  r('p3-galettes-thon', 'Galettes de riz au thon et fromage frais', ['snack'], [
    ['galettes-riz', 27], ['thon-naturel-egoutte', 70], ['fromage-blanc-0', 30], ['concombre', 40],
  ]),
  r('p3-yaourt-fruits-rouges', 'Yaourt grec, fruits rouges et miel', ['snack', 'breakfast'], [
    ['yaourt-grec-0', 200], ['fruits-rouges', 80], ['miel', 8], ['flocons-avoine-crus', 15],
  ]),
  r('p3-roules-dinde-pomme', 'Roulés de dinde au fromage frais, pomme', ['snack'], [
    ['dinde-tranches', 80], ['fromage-blanc-0', 40], ['concombre', 60], ['pomme', 120],
  ]),
  r('p3-mug-cake', 'Mug cake protéiné', ['snack'], [
    ['whey', 20], ['flocons-avoine-crus', 25], ['oeuf-entier', 50], ['lait-demi-ecreme', 30], ['miel', 5],
  ]),
  r('p3-fromage-blanc-herbes', 'Fromage blanc aux herbes et crudités', ['snack'], [
    ['fromage-blanc-0', 200], ['concombre', 100], ['carotte', 80], ['pita', 30],
  ]),
]
