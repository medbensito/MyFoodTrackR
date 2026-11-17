import type { Food, Recipe } from '../types'
import { normalize } from './nutrition'

/** Aliments qu'on compte à la pièce plutôt qu'au gramme. */
const PIECES: Record<string, { g: number; one: string; many: string }> = {
  'oeuf-entier': { g: 50, one: 'œuf', many: 'œufs' },
  'blanc-oeuf': { g: 30, one: 'blanc', many: 'blancs' },
  'dattes-medjool': { g: 24, one: 'datte', many: 'dattes' },
}

const TOKEN = /\{([a-z0-9-]+)(?:\*([\d.]+))?(?: (ml|g))?\}/g

export type StepPart = { text: string } | { qty: string }

const round5 = (n: number) => (n < 50 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5)
const fmt = (n: number) => String(n).replace('.', ',')

/**
 * Découpe une étape en texte et quantités, pour `factor` portions de la recette
 * (les grammes de la recette sont pour toute la recette, divisés par `servings`).
 */
export function stepParts(step: string, recipe: Pick<Recipe, 'ingredients' | 'servings'>, factor: number): StepPart[] {
  const per = factor / Math.max(1, recipe.servings)
  const parts: StepPart[] = []
  let last = 0
  for (const m of step.matchAll(TOKEN)) {
    const [raw, foodId, mult, unit] = m
    const ing = recipe.ingredients.find((i) => i.foodId === foodId)
    if (m.index > last) parts.push({ text: step.slice(last, m.index) })
    last = m.index + raw.length
    if (!ing) { parts.push({ text: '' }); continue }
    const base = ing.grams * per
    if (mult) {
      parts.push({ qty: `≈ ${round5(base * Number(mult))} ${unit ?? 'g'}` })
    } else if (PIECES[foodId]) {
      const p = PIECES[foodId]
      const n = Math.max(1, Math.round((base / p.g) * 2) / 2)
      parts.push({ qty: `${fmt(n)} ${n >= 2 ? p.many : p.one}` })
    } else {
      parts.push({ qty: `${round5(base)} ${unit ?? 'g'}` })
    }
  }
  if (last < step.length) parts.push({ text: step.slice(last) })
  return parts.filter((p) => !('text' in p) || p.text !== '')
}

/** « 3 œufs » pour les aliments comptés à la pièce, sinon null. */
export function piecesLabel(foodId: string, grams: number): string | null {
  const p = PIECES[foodId]
  if (!p) return null
  const n = Math.max(1, Math.round((grams / p.g) * 2) / 2)
  return `${fmt(n)} ${n >= 2 ? p.many : p.one}`
}

export const stepText = (step: string, recipe: Pick<Recipe, 'ingredients' | 'servings'>, factor = 1) =>
  stepParts(step, recipe, factor).map((p) => ('qty' in p ? p.qty : p.text)).join('')

/** Pour l'éditeur : `{foodId*1.35}` devient `[Nom de l'aliment ×1,35]`. */
export function stepToEditable(step: string, foods: Map<string, Food>): string {
  return step.replace(TOKEN, (raw, id: string, mult?: string, unit?: string) => {
    const f = foods.get(id)
    if (!f) return raw
    return `[${f.name}${mult ? ` ×${fmt(Number(mult))}` : ''}${unit ? ` ${unit}` : ''}]`
  })
}

/** Inverse de `stepToEditable` : seuls les ingrédients de la recette sont reconnus. */
export function stepFromEditable(text: string, ingredients: Recipe['ingredients'], foods: Map<string, Food>): string {
  return text.replace(/\[([^\]×]+?)(?: ×([\d.,]+))?(?: (ml|g))?\]/g, (raw, name: string, mult?: string, unit?: string) => {
    const ing = ingredients.find((i) => { const f = foods.get(i.foodId); return f && normalize(f.name) === normalize(name) })
    if (!ing) return raw
    return `{${ing.foodId}${mult ? `*${Number(mult.replace(',', '.'))}` : ''}${unit ? ` ${unit}` : ''}}`
  })
}

export const totalMinutes = (r: Pick<Recipe, 'prepMin' | 'cookMin'>) => (r.prepMin ?? 0) + (r.cookMin ?? 0)
export function fmtMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}
