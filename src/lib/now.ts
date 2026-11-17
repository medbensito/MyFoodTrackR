import type { Food, Macros, MealSlot } from '../types'
import { addMacros, macrosForGrams, scaleMacros, ZERO } from './nutrition'
import { PORTION_FACTORS, score as baseScore, type PlannerRecipe } from './planner'

/** « Que manger maintenant ? » : fonctions pures, testées. */

export type NowMode = 'meal' | 'rest'

const clamp = (m: Macros): Macros => ({
  kcal: Math.max(0, m.kcal), protein: Math.max(0, m.protein), carbs: Math.max(0, m.carbs), fat: Math.max(0, m.fat),
})
const sub = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal - b.kcal, protein: a.protein - b.protein, carbs: a.carbs - b.carbs, fat: a.fat - b.fat })

/**
 * Ce qu'il faut viser maintenant. En mode « repas », on garde de quoi couvrir les repas suivants
 * de la journée : le repas prévu s'il y en a un, sinon la part habituelle du créneau.
 */
export function targetForNow(p: {
  day: Macros
  consumed: Macros
  mode: NowMode
  /** Créneaux encore à manger après celui-ci. */
  later: MealSlot[]
  plannedLater: Map<MealSlot, Macros>
  slotShare: Record<MealSlot, Macros>
}): Macros {
  const remaining = sub(p.day, p.consumed)
  if (p.mode === 'rest') return clamp(remaining)
  const reserve = p.later.reduce((acc, s) => addMacros(acc, p.plannedLater.get(s) ?? p.slotShare[s]), ZERO)
  return clamp(sub(remaining, reserve))
}

/**
 * Quand il reste beaucoup de protéines mais peu de calories, on vise quand même une source
 * maigre (≈ 5 kcal par gramme de protéines) : mieux vaut dépasser un peu les calories que
 * rater les protéines.
 */
export function withLeanFloor(t: Macros): { target: Macros; lean: boolean } {
  const floor = Math.round(t.protein * 5)
  return t.kcal < floor && t.protein >= 8 ? { target: { ...t, kcal: floor }, lean: true } : { target: t, lean: false }
}

export type NowOption = {
  kind: 'recipe' | 'food'
  id: string
  name: string
  /** Portion (recette) ou grammes (aliment). */
  factor?: number
  grams?: number
  macros: Macros
  /** Dans les tolérances : kcal à ±12 %, protéines atteintes à 5 g près. */
  fits: boolean
}

/** Aliments qui se mangent tels quels. */
const READY: Record<string, (f: Food) => boolean> = {
  laitier: () => true,
  complements: () => true,
  fruits: () => true,
  oleagineux: () => true,
  proteines: (f) => f.state !== 'cru',
}
const GRAM_STEPS = [0.5, 0.75, 1, 1.5, 2]

/** Rien à proposer : la journée est bouclée pour ce repas. */
export const nothingNeeded = (t: Macros) => t.kcal < 80 && t.protein < 8

export function suggestNow(p: {
  target: Macros
  slot: MealSlot
  recipes: PlannerRecipe[]
  foods: Food[]
  /** Recettes déjà mangées aujourd'hui : légèrement pénalisées pour varier. */
  eatenRecipeIds?: Set<string>
  count?: number
}): NowOption[] {
  const { slot, target } = p
  if (nothingNeeded(target)) return []
  // Quand il ne reste presque plus de glucides ou de lipides, ils ne départagent plus :
  // sinon le moindre gramme serait compté comme un écart de 100 %.
  const score = (m: Macros) => {
    const t = { ...target, carbs: target.carbs < 10 ? m.carbs : target.carbs, fat: target.fat < 5 ? m.fat : target.fat }
    return baseScore(m, t)
  }
  const fits = (m: Macros) =>
    Math.abs(m.kcal - target.kcal) <= Math.max(60, target.kcal * 0.12) && m.protein >= target.protein - 5
  const scored: (NowOption & { s: number })[] = []

  for (const r of p.recipes) {
    let best: { f: number; s: number } | null = null
    for (const f of PORTION_FACTORS) {
      const s = score(scaleMacros(r.perServing, f))
      if (!best || s < best.s) best = { f, s }
    }
    if (!best) continue
    const penalty = (r.slots.includes(slot) ? 0 : 0.25) + (p.eatenRecipeIds?.has(r.id) ? 0.4 : 0) - (r.favorite ? 0.05 : 0)
    const macros = scaleMacros(r.perServing, best.f)
    scored.push({ kind: 'recipe', id: r.id, name: r.name, factor: best.f, macros, fits: fits(macros), s: best.s + penalty })
  }

  for (const f of p.foods) {
    if (!READY[f.category]?.(f) || f.defaultPortionG <= 0) continue
    let best: { g: number; s: number } | null = null
    for (const k of GRAM_STEPS) {
      const g = Math.max(5, Math.round((f.defaultPortionG * k) / 5) * 5)
      const s = score(macrosForGrams(f, g))
      if (!best || s < best.s) best = { g, s }
    }
    if (!best) continue
    const macros = macrosForGrams(f, best.g)
    // Un aliment seul convient surtout aux petits besoins (collation, complément de protéines).
    // Viande ou poisson nature en collation : possible, mais en dernier recours.
    const penalty = (target.kcal > 400 ? 0.3 : 0.05) + (slot === 'snack' && f.category === 'proteines' ? 0.3 : 0)
    scored.push({ kind: 'food', id: f.id, name: f.name, grams: best.g, macros, fits: fits(macros), s: best.s + penalty })
  }

  scored.sort((a, b) => a.s - b.s)
  const out: NowOption[] = []
  let foods = 0
  for (const o of scored) {
    if (out.length >= (p.count ?? 3)) break
    if (o.kind === 'food' && foods >= (target.kcal > 400 ? 1 : 2)) continue
    if (o.kind === 'food') foods++
    const { s: _s, ...option } = o
    void _s
    out.push(option)
  }
  return out
}
