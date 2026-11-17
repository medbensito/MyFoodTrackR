/**
 * Moteur de planning — fonctions pures, sans accès à la base ni à l'interface.
 *
 * Principe : chaque jour a une cible (repos ou entraînement), répartie entre
 * les 4 créneaux. Pour chaque créneau, on teste les recettes compatibles à
 * plusieurs portions et on garde la meilleure selon un score d'écart pondéré
 * (le manque de protéines pèse le plus). Une part d'aléatoire, tirée d'une
 * graine, permet à « Régénérer » de proposer une autre semaine.
 */
import type { Macros, MealSlot, PlannedMeal, Settings, TrainingTime } from '../types'
import { addMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER, ZERO } from './nutrition'

export const PORTION_FACTORS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

/** Part des kcal (et glucides, lipides) par créneau. */
export const KCAL_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }
/** Part des protéines par créneau : 3 vraies prises + une collation protéinée. */
export const PROTEIN_SHARE: Record<MealSlot, number> = { breakfast: 0.24, lunch: 0.29, dinner: 0.29, snack: 0.18 }

export const POST_TRAINING_SLOT: Record<TrainingTime, MealSlot> = { morning: 'breakfast', noon: 'lunch', evening: 'dinner' }

export const WEIGHTS = { proteinDeficit: 3, proteinExcess: 0.3, kcal: 1, carbs: 0.5, fat: 0.5 }

/** Tolérances d'une journée réussie. */
export const TOLERANCE = { kcalPct: 0.05, proteinMinus: 5 }

export type PlannerRecipe = { id: string; name: string; slots: MealSlot[]; perServing: Macros; favorite?: boolean }

export type PlannerInput = {
  dates: string[]
  trainingDates: Set<string>
  settings: Pick<Settings, 'targets' | 'trainingTime' | 'maxRepeatsPerWeekPerSlot'>
  recipes: PlannerRecipe[]
  /** Repas épinglés de la semaine : conservés tels quels. */
  pinned: PlannedMeal[]
}

export type PlannerResult = { meals: PlannedMeal[]; warnings: string[] }

// ——— Aléatoire reproductible ———
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ——— Cibles ———
function sub(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal - b.kcal, protein: a.protein - b.protein, carbs: a.carbs - b.carbs, fat: a.fat - b.fat }
}

/** Cible de chaque créneau. Les jours d'entraînement, le supplément va au repas qui suit la séance. */
export function slotTargets(
  isTraining: boolean,
  settings: Pick<Settings, 'targets' | 'trainingTime'>,
): Record<MealSlot, Macros> {
  const { rest, training } = settings.targets
  const extra = isTraining ? sub(training, rest) : ZERO
  const post = POST_TRAINING_SLOT[settings.trainingTime]
  const out = {} as Record<MealSlot, Macros>
  for (const s of SLOT_ORDER) {
    const k = KCAL_SHARE[s]
    const base: Macros = { kcal: rest.kcal * k, protein: rest.protein * PROTEIN_SHARE[s], carbs: rest.carbs * k, fat: rest.fat * k }
    out[s] = s === post ? addMacros(base, extra) : base
  }
  return out
}

export function dayTarget(isTraining: boolean, settings: Pick<Settings, 'targets'>): Macros {
  return isTraining ? settings.targets.training : settings.targets.rest
}

// ——— Score ———
const rel = (a: number, t: number) => (t > 0 ? Math.abs(a - t) / t : a > 0 ? 1 : 0)

export function score(actual: Macros, target: Macros): number {
  const pDef = target.protein > 0 ? Math.max(0, target.protein - actual.protein) / target.protein : 0
  const pExc = target.protein > 0 ? Math.max(0, actual.protein - target.protein) / target.protein : 0
  return (
    WEIGHTS.proteinDeficit * pDef +
    WEIGHTS.proteinExcess * pExc +
    WEIGHTS.kcal * rel(actual.kcal, target.kcal) +
    WEIGHTS.carbs * rel(actual.carbs, target.carbs) +
    WEIGHTS.fat * rel(actual.fat, target.fat)
  )
}

export function withinTolerance(actual: Macros, target: Macros): boolean {
  return (
    Math.abs(actual.kcal - target.kcal) <= target.kcal * TOLERANCE.kcalPct &&
    actual.protein >= target.protein - TOLERANCE.proteinMinus
  )
}

/** Meilleure portion d'une recette pour une cible donnée. */
export function bestFactor(perServing: Macros, target: Macros): { factor: number; score: number } {
  let best = { factor: 1, score: Infinity }
  for (const f of PORTION_FACTORS) {
    const s = score(scaleMacros(perServing, f), target)
    if (s < best.score - 1e-9) best = { factor: f, score: s }
  }
  return best
}

// ——— Génération ———
export function generateWeek(input: PlannerInput, seed: number): PlannerResult {
  const rng = mulberry32(seed)
  const { dates, trainingDates, settings, recipes } = input
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const maxRepeats = Math.max(1, settings.maxRepeatsPerWeekPerSlot)
  const warnings: string[] = []

  const bySlot = {} as Record<MealSlot, PlannerRecipe[]>
  for (const s of SLOT_ORDER) {
    bySlot[s] = recipes.filter((r) => r.slots.includes(s))
    if (bySlot[s].length === 0) warnings.push(`Aucune recette pour le créneau « ${SLOT_LABEL[s]} » : il reste vide.`)
    else if (bySlot[s].length < 3) warnings.push(`Moins de 3 recettes pour « ${SLOT_LABEL[s]} » : des répétitions sont autorisées.`)
  }

  // Historique d'utilisation, épinglés compris.
  const uses = new Map<string, number>() // `${slot}|${recipeId}` → nombre
  const usedOn = new Map<string, Set<number>>() // `${slot}|${recipeId}` → indices de jours
  const weekUses = new Map<string, number>() // recipeId → nombre, tous créneaux confondus
  const markUse = (slot: MealSlot, recipeId: string, dayIndex: number) => {
    const k = `${slot}|${recipeId}`
    uses.set(k, (uses.get(k) ?? 0) + 1)
    usedOn.set(k, (usedOn.get(k) ?? new Set()).add(dayIndex))
    weekUses.set(recipeId, (weekUses.get(recipeId) ?? 0) + 1)
  }
  // Une recette sert au plus `maxRepeats + 1` fois par semaine, tous créneaux confondus.
  const maxWeekUses = maxRepeats + 1
  for (const p of input.pinned) {
    const di = dates.indexOf(p.date)
    if (di >= 0) markUse(p.slot, p.recipeId, di)
  }

  const meals: PlannedMeal[] = []

  dates.forEach((date, di) => {
    const training = trainingDates.has(date)
    const target = dayTarget(training, settings)
    const slotT = slotTargets(training, settings)
    const pinnedToday = input.pinned.filter((p) => p.date === date)
    const pinnedSlots = new Set(pinnedToday.map((p) => p.slot))
    const freeSlots = SLOT_ORDER.filter((s) => !pinnedSlots.has(s))

    // Ce qui reste à couvrir une fois les épinglés comptés, réparti au prorata des créneaux libres.
    const pinnedTotal = pinnedToday.reduce((acc, p) => {
      const r = byId.get(p.recipeId)
      return r ? addMacros(acc, scaleMacros(r.perServing, p.portionFactor)) : acc
    }, ZERO)
    const remaining = sub(target, pinnedTotal)
    const freeSum = freeSlots.reduce((acc, s) => addMacros(acc, slotT[s]), ZERO)
    const ratio = (key: keyof Macros) => (freeSum[key] > 0 ? Math.max(0, remaining[key]) / freeSum[key] : 0)
    const adjusted = {} as Record<MealSlot, Macros>
    for (const s of freeSlots) {
      adjusted[s] = {
        kcal: slotT[s].kcal * ratio('kcal'),
        protein: slotT[s].protein * ratio('protein'),
        carbs: slotT[s].carbs * ratio('carbs'),
        fat: slotT[s].fat * ratio('fat'),
      }
    }

    const today: PlannedMeal[] = [...pinnedToday]
    const usedToday = new Set(pinnedToday.map((p) => p.recipeId))

    for (const slot of freeSlots) {
      const pool = bySlot[slot]
      if (pool.length === 0) continue
      const allowed = (r: PlannerRecipe, strict: boolean) => {
        const k = `${slot}|${r.id}`
        if (usedToday.has(r.id) && pool.length > 1) return false
        if (!strict) return true
        // Pas le même plat au dîner puis au déjeuner du lendemain.
        const lastNightDinner = slot === 'lunch' && usedOn.get(`dinner|${r.id}`)?.has(di - 1)
        return (
          (uses.get(k) ?? 0) < maxRepeats &&
          (weekUses.get(r.id) ?? 0) < maxWeekUses &&
          !usedOn.get(k)?.has(di - 1) &&
          !lastNightDinner
        )
      }
      let candidates = pool.filter((r) => allowed(r, true))
      if (candidates.length === 0) candidates = pool.filter((r) => allowed(r, false))
      if (candidates.length === 0) candidates = pool

      let best: { r: PlannerRecipe; factor: number; total: number } | null = null
      for (const r of candidates) {
        const { factor, score: s } = bestFactor(r.perServing, adjusted[slot])
        const total = s + rng() * 0.2 // variété contrôlée par la graine
        if (!best || total < best.total) best = { r, factor, total }
      }
      if (!best) continue
      today.push({ id: `pm-${date}-${slot}`, date, slot, recipeId: best.r.id, portionFactor: best.factor, pinned: false })
      usedToday.add(best.r.id)
      markUse(slot, best.r.id, di)
    }

    refineDay(today, target, byId)
    meals.push(...today)
  })

  return { meals, warnings }
}

export function mealMacros(m: Pick<PlannedMeal, 'recipeId' | 'portionFactor'>, byId: Map<string, PlannerRecipe>): Macros {
  const r = byId.get(m.recipeId)
  return r ? scaleMacros(r.perServing, m.portionFactor) : ZERO
}

export function dayTotal(meals: Pick<PlannedMeal, 'recipeId' | 'portionFactor'>[], byId: Map<string, PlannerRecipe>): Macros {
  return meals.reduce((acc, m) => addMacros(acc, mealMacros(m, byId)), ZERO)
}

/**
 * Correction de fin de journée : ajuste une portion à la fois (repas non épinglés)
 * tant que le score de la journée s'améliore. Corrige notamment un manque de protéines.
 */
export function refineDay(today: PlannedMeal[], target: Macros, byId: Map<string, PlannerRecipe>, maxIter = 4) {
  for (let iter = 0; iter < maxIter; iter++) {
    const current = score(dayTotal(today, byId), target)
    let best: { idx: number; factor: number; s: number } | null = null
    today.forEach((m, idx) => {
      if (m.pinned) return
      for (const f of PORTION_FACTORS) {
        if (f === m.portionFactor) continue
        const trial = today.map((x, k) => (k === idx ? { ...x, portionFactor: f } : x))
        const s = score(dayTotal(trial, byId), target)
        if (s < current - 0.005 && (!best || s < best.s)) best = { idx, factor: f, s }
      }
    })
    if (!best) return
    const b = best as { idx: number; factor: number }
    today[b.idx] = { ...today[b.idx], portionFactor: b.factor }
  }
}

export type Suggestion = { mealId: string; from: number; to: number; before: Macros; after: Macros }

/**
 * Après une modification manuelle, propose d'ajuster la portion d'un AUTRE repas
 * du jour. Rien n'est appliqué : l'interface affiche la proposition.
 */
export function suggestAdjustment(
  dayMeals: PlannedMeal[],
  editedMealId: string,
  target: Macros,
  byId: Map<string, PlannerRecipe>,
): Suggestion | null {
  const before = dayTotal(dayMeals, byId)
  if (withinTolerance(before, target)) return null
  const current = score(before, target)
  let best: (Suggestion & { s: number }) | null = null
  for (const m of dayMeals) {
    if (m.id === editedMealId || !byId.has(m.recipeId)) continue
    for (const f of PORTION_FACTORS) {
      if (f === m.portionFactor) continue
      const trial = dayMeals.map((x) => (x.id === m.id ? { ...x, portionFactor: f } : x))
      const after = dayTotal(trial, byId)
      const s = score(after, target)
      if (s < current - 0.02 && (!best || s < best.s)) best = { mealId: m.id, from: m.portionFactor, to: f, before, after, s }
    }
  }
  if (!best) return null
  const { s: _s, ...suggestion } = best
  void _s
  return suggestion
}

/** Texte court de l'écart d'une journée : « −18 g de protéines · +120 kcal ». */
export function gapLabel(actual: Macros, target: Macros): string | null {
  if (withinTolerance(actual, target)) return null
  const parts: string[] = []
  const dp = Math.round(actual.protein - target.protein)
  const dk = Math.round(actual.kcal - target.kcal)
  if (actual.protein < target.protein - TOLERANCE.proteinMinus) parts.push(`${dp} g de protéines`.replace('-', '−'))
  if (Math.abs(dk) > target.kcal * TOLERANCE.kcalPct) parts.push(`${dk > 0 ? '+' : '−'}${Math.abs(dk)} kcal`)
  return parts.join(' · ') || null
}
