import type { Food, Recipe } from '../types'
import { BUY } from '../db/prices'

/** Grammes à acheter pour `grams` comptés (poids cru d'un aliment compté cuit, par exemple). */
export const buyGrams = (food: Pick<Food, 'id'>, grams: number) => grams * (BUY[food.id]?.k ?? 1)

/** Coût en dirhams, ou null si l'aliment n'a pas de prix. */
export function costOf(food: Pick<Food, 'id' | 'pricePerKg'>, grams: number): number | null {
  if (!(food.pricePerKg && food.pricePerKg > 0)) return null
  return (buyGrams(food, grams) * food.pricePerKg) / 1000
}

/** Coût d'une portion ; `missing` : ingrédients sans prix (comptés à 0). */
export function recipeCost(recipe: Pick<Recipe, 'ingredients' | 'servings'>, foods: Map<string, Food>): { perServing: number; missing: number } {
  let total = 0, missing = 0
  for (const ing of recipe.ingredients) {
    const f = foods.get(ing.foodId)
    const c = f ? costOf(f, ing.grams) : null
    if (c === null) missing++
    else total += c
  }
  return { perServing: total / Math.max(1, recipe.servings), missing }
}

/** « 14 DH », « 4,5 DH », « 0,8 DH ». */
export function fmtDh(n: number): string {
  const v = n >= 20 ? Math.round(n) : Math.round(n * 2) / 2
  return `${String(v).replace('.', ',')} DH`
}
