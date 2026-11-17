/**
 * Versions d'origine des recettes rééquilibrées en v3 (moins de protéines, plus de féculents).
 * La migration ne remplace une recette que si elle est encore identique à ces versions :
 * une recette modifiée par l'utilisateur n'est jamais touchée.
 */
import type { Recipe } from '../types'

export const LEGACY_V4: Record<string, Pick<Recipe, 'name' | 'servings' | 'slots' | 'ingredients'>> = {
  'ex-omelette-pain': {"name":"Omelette et pain complet","servings":1,"slots":["breakfast"],"ingredients":[{"foodId":"oeuf-entier","grams":150},{"foodId":"blanc-oeuf","grams":100},{"foodId":"pain-complet","grams":80},{"foodId":"tomate","grams":120}]},
  'ex-poulet-riz-brocoli': {"name":"Poulet, riz et brocoli","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"poulet-blanc-cuit","grams":150},{"foodId":"riz-blanc-cru","grams":90},{"foodId":"brocoli-cuit","grams":150},{"foodId":"huile-olive","grams":10}]},
  'ex-saumon-pdt': {"name":"Saumon, pommes de terre et brocoli","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"saumon-cuit","grams":150},{"foodId":"pommes-terre-cuites","grams":250},{"foodId":"brocoli-cuit","grams":150}]},
  'ex-pates-thon': {"name":"Pâtes au thon et tomate","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"pates-crues","grams":90},{"foodId":"thon-naturel-egoutte","grams":130},{"foodId":"tomate","grams":150},{"foodId":"huile-olive","grams":10}]},
  'ex-couscous-poulet': {"name":"Couscous poulet et carottes","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"semoule-cru","grams":90},{"foodId":"poulet-blanc-cuit","grams":150},{"foodId":"carotte","grams":150},{"foodId":"huile-olive","grams":10}]},
  'ex-sardines-riz': {"name":"Sardines grillées et riz","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"sardines-grillees","grams":150},{"foodId":"riz-blanc-cru","grams":80},{"foodId":"tomate","grams":150}]},
  'pk-bowl-yaourt-dattes': {"name":"Bowl yaourt grec, avoine et dattes","servings":1,"slots":["breakfast"],"ingredients":[{"foodId":"yaourt-grec-0","grams":250},{"foodId":"flocons-avoine-crus","grams":50},{"foodId":"dattes-medjool","grams":24},{"foodId":"amandes","grams":10}]},
  'pk-shake-banane-avoine': {"name":"Shake whey, banane et avoine","servings":1,"slots":["breakfast","snack"],"ingredients":[{"foodId":"whey","grams":30},{"foodId":"lait-demi-ecreme","grams":300},{"foodId":"banane","grams":120},{"foodId":"flocons-avoine-crus","grams":40}]},
  'pk-tajine-poulet-olives': {"name":"Tajine de poulet aux olives","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"poulet-cuisse-cuite","grams":200},{"foodId":"oignon","grams":80},{"foodId":"carotte","grams":100},{"foodId":"olives-vertes","grams":30},{"foodId":"huile-olive","grams":10},{"foodId":"khobz","grams":60}]},
  'pk-kefta-oeufs': {"name":"Tajine de kefta aux œufs","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"boeuf-hache-5","grams":150},{"foodId":"oeuf-entier","grams":100},{"foodId":"tomate","grams":200},{"foodId":"oignon","grams":50},{"foodId":"huile-olive","grams":5},{"foodId":"khobz","grams":60}]},
  'pk-harira-poulet': {"name":"Harira protéinée au poulet","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"lentilles-cuites","grams":120},{"foodId":"pois-chiches-cuits","grams":80},{"foodId":"poulet-blanc-cuit","grams":100},{"foodId":"tomate","grams":150},{"foodId":"oignon","grams":40},{"foodId":"farine-ble","grams":10},{"foodId":"huile-olive","grams":5}]},
  'pk-loubia-dinde': {"name":"Loubia et dinde","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"haricots-blancs-cuits","grams":200},{"foodId":"dinde-escalope-cuite","grams":120},{"foodId":"tomate","grams":150},{"foodId":"oignon","grams":40},{"foodId":"huile-olive","grams":8},{"foodId":"khobz","grams":50}]},
  'pk-poisson-chermoula': {"name":"Poisson chermoula, patate douce et courgette","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"poisson-blanc-cuit","grams":200},{"foodId":"patate-douce-cuite","grams":250},{"foodId":"courgette-cuite","grams":150},{"foodId":"huile-olive","grams":10}]},
  'pk-crevettes-riz-poivrons': {"name":"Crevettes, riz et poivrons","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"crevettes-cuites","grams":180},{"foodId":"riz-blanc-cru","grams":80},{"foodId":"poivron","grams":120},{"foodId":"huile-olive","grams":10}]},
  'pk-dinde-pates-brocoli': {"name":"Dinde, pâtes et brocoli","servings":1,"slots":["lunch","dinner"],"ingredients":[{"foodId":"dinde-escalope-cuite","grams":150},{"foodId":"pates-crues","grams":90},{"foodId":"brocoli-cuit","grams":150},{"foodId":"huile-olive","grams":8}]},
  'pk-omelette-thon-pdt': {"name":"Omelette thon et pommes de terre","servings":1,"slots":["dinner"],"ingredients":[{"foodId":"oeuf-entier","grams":150},{"foodId":"thon-naturel-egoutte","grams":80},{"foodId":"pommes-terre-cuites","grams":200},{"foodId":"huile-olive","grams":8}]},
}
