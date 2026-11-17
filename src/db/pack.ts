import type { Food, FoodState, Recipe } from '../types'

/**
 * Pack v2 : aliments et recettes protéinées, dont des plats marocains.
 * Valeurs approximatives pour 100 g, à vérifier (verified = false).
 */
const f = (id: string, name: string, category: string, state: FoodState, kcal: number, protein: number, carbs: number, fat: number, defaultPortionG: number): Food =>
  ({ id, name, category, state, kcal, protein, carbs, fat, defaultPortionG, source: 'approximation', verified: false, custom: false })

export const PACK_FOODS: Food[] = [
  f('pois-chiches-cuits', 'Pois chiches', 'feculents', 'cuit', 140, 8, 20, 2.5, 150),
  f('haricots-blancs-cuits', 'Haricots blancs (loubia)', 'feculents', 'cuit', 105, 7.3, 14, 0.5, 200),
  f('patate-douce-cuite', 'Patate douce', 'feculents', 'cuit', 90, 2, 20, 0.1, 200),
  f('farine-ble', 'Farine de blé', 'feculents', 'sec', 350, 10, 73, 1.2, 10),
  f('poulet-cuisse-cuite', 'Poulet, cuisse sans peau', 'proteines', 'cuit', 175, 26, 0, 7.8, 200),
  f('dinde-escalope-cuite', 'Escalope de dinde', 'proteines', 'cuit', 135, 29, 0, 1.5, 120),
  f('poisson-blanc-cuit', 'Poisson blanc (merlan)', 'proteines', 'cuit', 100, 21, 0, 1.5, 180),
  f('crevettes-cuites', 'Crevettes décortiquées', 'proteines', 'cuit', 99, 24, 0.2, 0.3, 150),
  f('lben', 'Lben (lait fermenté)', 'laitier', 'liquide', 40, 3.2, 4.5, 1, 250),
  f('jben', 'Jben (fromage frais)', 'laitier', 'solide', 150, 11, 3, 10, 50),
  f('oignon', 'Oignon', 'legumes', 'cru', 40, 1.1, 9, 0.1, 80),
  f('poivron', 'Poivron', 'legumes', 'cru', 30, 1, 6, 0.3, 120),
  f('courgette-cuite', 'Courgette', 'legumes', 'cuit', 17, 1.2, 3, 0.3, 150),
  f('miel', 'Miel', 'autre', 'nature', 304, 0.3, 82, 0, 10),
  f('whey', 'Whey protéine (poudre)', 'complements', 'sec', 380, 78, 8, 6, 30),
]

const r = (id: string, name: string, slots: Recipe['slots'], ingredients: [string, number][], notes: string): Recipe =>
  ({ id, name, servings: 1, slots, ingredients: ingredients.map(([foodId, grams]) => ({ foodId, grams })), notes })

export const PACK_RECIPES: Recipe[] = [
  // Petits-déjeuners
  r('pk-bowl-yaourt-dattes', 'Bowl yaourt grec, avoine et dattes', ['breakfast'],
    [['yaourt-grec-0', 200], ['flocons-avoine-crus', 60], ['dattes-medjool', 24], ['amandes', 10]],
    'Mélanger le yaourt et les flocons, ajouter les dattes coupées et les amandes concassées.'),
  r('pk-pancakes-proteines', 'Pancakes protéinés avoine-banane', ['breakfast'],
    [['flocons-avoine-crus', 60], ['blanc-oeuf', 150], ['oeuf-entier', 50], ['banane', 100], ['miel', 10]],
    'Mixer flocons, œuf, blancs et banane. Cuire 4 petits pancakes à la poêle antiadhésive. Miel au moment de servir.'),
  r('pk-oeufs-khobz-jben', 'Œufs, khobz et jben', ['breakfast'],
    [['oeuf-entier', 150], ['khobz', 60], ['jben', 50], ['tomate', 100], ['olives-vertes', 15]],
    'Œufs brouillés au cumin, khobz, jben, tomate et quelques olives.'),
  r('pk-shake-banane-avoine', 'Shake whey, banane et avoine', ['breakfast', 'snack'],
    [['whey', 25], ['lait-demi-ecreme', 300], ['banane', 120], ['flocons-avoine-crus', 50]],
    'Mixer le tout avec quelques glaçons.'),

  // Déjeuners et dîners
  r('pk-tajine-poulet-olives', 'Tajine de poulet aux olives', ['lunch', 'dinner'],
    [['poulet-cuisse-cuite', 150], ['oignon', 80], ['carotte', 100], ['olives-vertes', 30], ['huile-olive', 10], ['khobz', 100]],
    "Faire revenir l'oignon dans l'huile avec gingembre, curcuma et safran. Ajouter le poulet et les carottes, mijoter 40 min, olives en fin de cuisson. Servir avec le khobz."),
  r('pk-kefta-oeufs', 'Tajine de kefta aux œufs', ['lunch', 'dinner'],
    [['boeuf-hache-5', 110], ['oeuf-entier', 50], ['tomate', 200], ['oignon', 50], ['huile-olive', 5], ['khobz', 110]],
    'Boulettes de kefta (cumin, paprika, persil) dans une sauce tomate-oignon. Casser les œufs dessus et couvrir 5 min.'),
  r('pk-harira-poulet', 'Harira protéinée au poulet', ['lunch', 'dinner'],
    [['lentilles-cuites', 150], ['pois-chiches-cuits', 100], ['poulet-blanc-cuit', 60], ['tomate', 150], ['oignon', 40], ['farine-ble', 15], ['huile-olive', 5], ['dattes-medjool', 24]],
    'Poulet effiloché à la place de la viande grasse. Lier avec la farine délayée en fin de cuisson. Céleri, coriandre et persil à volonté. Une datte à côté, comme au ftour.'),
  r('pk-loubia-dinde', 'Loubia et dinde', ['lunch', 'dinner'],
    [['haricots-blancs-cuits', 200], ['dinde-escalope-cuite', 70], ['tomate', 150], ['oignon', 40], ['huile-olive', 10], ['khobz', 100]],
    'Haricots mijotés en sauce tomate (cumin, paprika, ail), dinde poêlée en lamelles.'),
  r('pk-poisson-chermoula', 'Poisson chermoula, patate douce et courgette', ['lunch', 'dinner'],
    [['poisson-blanc-cuit', 160], ['patate-douce-cuite', 300], ['courgette-cuite', 150], ['huile-olive', 12], ['khobz', 50]],
    'Chermoula : coriandre, persil, ail, cumin, paprika, citron. Mariner 20 min, cuire au four 15 min avec les légumes.'),
  r('pk-crevettes-riz-poivrons', 'Crevettes, riz et poivrons', ['lunch', 'dinner'],
    [['crevettes-cuites', 130], ['riz-blanc-cru', 100], ['poivron', 120], ['huile-olive', 10]],
    'Sauter les poivrons, ajouter les crevettes et un peu de pil-pil. Servir sur le riz.'),
  r('pk-dinde-pates-brocoli', 'Dinde, pâtes et brocoli', ['lunch', 'dinner'],
    [['dinde-escalope-cuite', 90], ['pates-crues', 110], ['brocoli-cuit', 150], ['huile-olive', 10]],
    'Dinde poêlée en dés, pâtes et brocoli cuits ensemble les 4 dernières minutes.'),
  r('pk-omelette-thon-pdt', 'Omelette thon et pommes de terre', ['dinner'],
    [['oeuf-entier', 150], ['thon-naturel-egoutte', 50], ['pommes-terre-cuites', 250], ['huile-olive', 8]],
    'Pommes de terre en rondelles dorées à la poêle, puis les œufs battus avec le thon émietté.'),

  // Collations
  r('pk-lben-dattes', 'Lben, dattes et amandes', ['snack'],
    [['lben', 400], ['dattes-medjool', 24], ['amandes', 15]],
    'Un grand verre de lben bien frais, une datte et une poignée d’amandes.'),
  r('pk-fromage-blanc-miel', 'Fromage blanc, miel et amandes', ['snack'],
    [['fromage-blanc-0', 250], ['miel', 10], ['amandes', 15]],
    ''),
  r('pk-oeufs-durs-pomme', 'Œufs durs et pomme', ['snack'],
    [['oeuf-entier', 150], ['pomme', 150]],
    'Cuire les œufs 10 min, en préparer plusieurs à l’avance au frigo.'),
  r('pk-shake-whey', 'Shake whey au lait', ['snack'],
    [['whey', 30], ['lait-demi-ecreme', 250]],
    ''),
].map((x) => (x.notes ? x : { ...x, notes: undefined }))
