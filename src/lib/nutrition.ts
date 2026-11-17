import type { Food, Macros, MealSlot, Recipe } from '../types'

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/** Macros d'une quantité en grammes d'un aliment (valeurs pour 100 g). */
export function macrosForGrams(food: Food, grams: number): Macros {
  const f = grams / 100
  return { kcal: food.kcal * f, protein: food.protein * f, carbs: food.carbs * f, fat: food.fat * f }
}

export function addMacros(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return { kcal: m.kcal * factor, protein: m.protein * factor, carbs: m.carbs * factor, fat: m.fat * factor }
}

/** Arrondi d'affichage : kcal à l'unité, macros à l'unité. */
export function roundMacros(m: Macros): Macros {
  return { kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) }
}

export type RecipeTotals = {
  total: Macros
  perServing: Macros
  /** Ingrédients dont l'aliment n'existe plus dans la base. */
  missingFoodIds: string[]
  /** Ingrédients dont les valeurs ne sont pas encore vérifiées. */
  unverifiedFoodIds: string[]
  totalGrams: number
}

/** Les macros d'une recette sont toujours calculées depuis ses ingrédients. */
export function recipeTotals(recipe: Pick<Recipe, 'ingredients' | 'servings'>, foods: Map<string, Food>): RecipeTotals {
  let total = ZERO
  let totalGrams = 0
  const missingFoodIds: string[] = []
  const unverifiedFoodIds: string[] = []
  for (const ing of recipe.ingredients) {
    const food = foods.get(ing.foodId)
    if (!food) { missingFoodIds.push(ing.foodId); continue }
    if (!food.verified && !unverifiedFoodIds.includes(food.id)) unverifiedFoodIds.push(food.id)
    const grams = Number.isFinite(ing.grams) && ing.grams > 0 ? ing.grams : 0
    total = addMacros(total, macrosForGrams(food, grams))
    totalGrams += grams
  }
  const servings = recipe.servings > 0 ? recipe.servings : 1
  return { total, perServing: scaleMacros(total, 1 / servings), missingFoodIds, unverifiedFoodIds, totalGrams }
}

/** kcal recalculées depuis les macros (4/4/9), pour repérer une erreur de saisie. */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9
}

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
}
export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Libellé court pour les colonnes étroites. */
export const SLOT_SHORT: Record<MealSlot, string> = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' }
/** « Le dîner », « La collation »… pour les phrases. */
export const SLOT_THE: Record<MealSlot, string> = { breakfast: 'Le petit-déj', lunch: 'Le déjeuner', dinner: 'Le dîner', snack: 'La collation' }

export const fmtFactor = (f: number) => `×${String(f).replace('.', ',')}`

export const CATEGORY_LABEL: Record<string, string> = {
  proteines: 'Protéines',
  laitier: 'Produits laitiers',
  feculents: 'Féculents',
  fruits: 'Fruits',
  legumes: 'Légumes',
  'matieres-grasses': 'Matières grasses',
  oleagineux: 'Oléagineux',
  maroc: 'Maroc',
  complements: 'Compléments',
  autre: 'Autre',
}

/** Recherche insensible à la casse et aux accents. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function newId(prefix: string): string {
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rnd}`
}
