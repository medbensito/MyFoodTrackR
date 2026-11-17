import type { Food, PlannedMeal, Recipe } from '../types'

export type ShoppingItem = {
  food: Food
  /** Quantité arrondie pour l'achat, dans l'état de l'aliment (cru, cuit…). */
  grams: number
  /** Nombre de pièces pour les aliments qu'on achète à l'unité. */
  count?: { n: number; label: string }
  /** Nombre de repas qui utilisent cet aliment. */
  uses: number
}
export type ShoppingGroup = { key: string; label: string; items: ShoppingItem[] }

/** Rayons dans l'ordre d'un parcours de supermarché. */
export const RAYONS: { key: string; label: string }[] = [
  { key: 'legumes', label: 'Légumes' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'proteines', label: 'Viandes, poissons, œufs' },
  { key: 'laitier', label: 'Crèmerie' },
  { key: 'feculents', label: 'Féculents et pain' },
  { key: 'maroc', label: 'Épicerie marocaine' },
  { key: 'oleagineux', label: 'Fruits secs' },
  { key: 'matieres-grasses', label: 'Huiles' },
  { key: 'complements', label: 'Compléments' },
  { key: 'autre', label: 'Autre' },
]

/** Aliments achetés à la pièce : libellé au pluriel. */
const COUNTABLE: Record<string, string> = {
  'oeuf-entier': 'œufs',
  banane: 'bananes',
  pomme: 'pommes',
  'dattes-medjool': 'dattes',
}

/** Arrondi d'achat : au 5 g près sous 100 g, au 10 g près au-delà. */
export function roundForShopping(g: number): number {
  if (g <= 0) return 0
  const step = g < 100 ? 5 : 10
  return Math.ceil(g / step) * step
}

export function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 2).replace(/0$/, '').replace('.', ',')} kg`
  return `${g} g`
}

/** Additionne les ingrédients de tous les repas planifiés, aliment par aliment. */
export function buildShoppingList(
  meals: Pick<PlannedMeal, 'recipeId' | 'portionFactor'>[],
  recipes: Map<string, Recipe>,
  foods: Map<string, Food>,
): { groups: ShoppingGroup[]; itemCount: number; missingRecipes: number } {
  const totals = new Map<string, { grams: number; uses: number }>()
  let missingRecipes = 0
  for (const m of meals) {
    const r = recipes.get(m.recipeId)
    if (!r) { missingRecipes++; continue }
    const factor = m.portionFactor / Math.max(1, r.servings)
    const seen = new Set<string>()
    for (const ing of r.ingredients) {
      if (!foods.has(ing.foodId) || !(ing.grams > 0)) continue
      const t = totals.get(ing.foodId) ?? { grams: 0, uses: 0 }
      t.grams += ing.grams * factor
      if (!seen.has(ing.foodId)) { t.uses++; seen.add(ing.foodId) }
      totals.set(ing.foodId, t)
    }
  }

  const byRayon = new Map<string, ShoppingItem[]>()
  for (const [foodId, t] of totals) {
    const food = foods.get(foodId)!
    const grams = roundForShopping(t.grams)
    const label = COUNTABLE[foodId]
    const item: ShoppingItem = {
      food, grams, uses: t.uses,
      count: label && food.defaultPortionG > 0 ? { n: Math.ceil(t.grams / food.defaultPortionG - 0.05), label } : undefined,
    }
    const key = RAYONS.some((r) => r.key === food.category) ? food.category : 'autre'
    byRayon.set(key, [...(byRayon.get(key) ?? []), item])
  }

  const groups = RAYONS
    .filter((r) => byRayon.has(r.key))
    .map((r) => ({ ...r, items: byRayon.get(r.key)!.sort((a, b) => a.food.name.localeCompare(b.food.name, 'fr')) }))
  return { groups, itemCount: totals.size, missingRecipes }
}

export function itemLabel(it: ShoppingItem): string {
  const qty = it.count ? `${it.count.n} ${it.count.label} (${formatGrams(it.grams)})` : formatGrams(it.grams)
  return `${it.food.name}${it.food.state === 'cuit' ? ' (poids cuit)' : it.food.state === 'cru' && it.food.category === 'feculents' ? ' (cru)' : ''} — ${qty}`
}

/** Version texte, pour l'envoyer par message. */
export function shoppingText(title: string, groups: ShoppingGroup[], checked: Set<string>): string {
  const lines = [title, '']
  for (const g of groups) {
    const items = g.items.filter((it) => !checked.has(it.food.id))
    if (items.length === 0) continue
    lines.push(g.label.toUpperCase())
    for (const it of items) lines.push(`- ${itemLabel(it)}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}
