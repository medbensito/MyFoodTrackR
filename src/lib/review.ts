import type { LogEntry, Macros, MealSlot, PlannedMeal } from '../types'
import { addMacros, roundMacros, SLOT_ORDER, ZERO } from './nutrition'
import { toISODate } from './targets'

/** Journée réussie : protéines atteintes (à 5 g près) et calories à ±10 % de la cible. */
export function isSuccess(consumed: Macros, target: Macros): boolean {
  return consumed.protein >= target.protein - 5 && Math.abs(consumed.kcal - target.kcal) <= target.kcal * 0.1
}

export type DayReview = {
  date: string
  training: boolean
  target: Macros
  /** null si rien n'a été saisi ce jour-là. */
  consumed: Macros | null
  success: boolean | null
  planned: number
  eatenPlanned: number
  skipped: MealSlot[]
}

export type WeekReview = {
  days: DayReview[]
  logged: number
  successes: number
  avgProtein: number | null
  avgKcal: number | null
  plannedTotal: number
  eatenPlannedTotal: number
  mostSkipped: { slot: MealSlot; count: number } | null
  best: DayReview | null
}

export function reviewDay(
  date: string,
  training: boolean,
  target: Macros,
  entries: LogEntry[],
  planned: PlannedMeal[],
): DayReview {
  const consumed = entries.length ? roundMacros(entries.reduce((a, e) => addMacros(a, e.macros), ZERO)) : null
  const eaten = new Set(entries.map((e) => e.fromPlannedMealId).filter(Boolean))
  return {
    date, training, target, consumed,
    success: consumed ? isSuccess(consumed, target) : null,
    planned: planned.length,
    eatenPlanned: planned.filter((m) => eaten.has(m.id)).length,
    // Un repas prévu non coché n'est compté « sauté » que si la journée a été suivie.
    skipped: consumed ? planned.filter((m) => !eaten.has(m.id)).map((m) => m.slot) : [],
  }
}

export function summarizeWeek(days: DayReview[]): WeekReview {
  const logged = days.filter((d) => d.consumed)
  const successes = days.filter((d) => d.success).length
  const avg = (f: (m: Macros) => number) => (logged.length ? Math.round(logged.reduce((a, d) => a + f(d.consumed!), 0) / logged.length) : null)
  const skipCount = new Map<MealSlot, number>()
  for (const d of days) for (const s of d.skipped) skipCount.set(s, (skipCount.get(s) ?? 0) + 1)
  let mostSkipped: WeekReview['mostSkipped'] = null
  for (const s of SLOT_ORDER) {
    const c = skipCount.get(s) ?? 0
    if (c >= 2 && (!mostSkipped || c > mostSkipped.count)) mostSkipped = { slot: s, count: c }
  }
  // Meilleur jour : réussi, et le plus proche de la cible de calories.
  const best = logged
    .filter((d) => d.success)
    .sort((a, b) => Math.abs(a.consumed!.kcal - a.target.kcal) - Math.abs(b.consumed!.kcal - b.target.kcal))[0] ?? null
  return {
    days,
    logged: logged.length,
    successes,
    avgProtein: avg((m) => m.protein),
    avgKcal: avg((m) => m.kcal),
    plannedTotal: logged.reduce((a, d) => a + d.planned, 0),
    eatenPlannedTotal: logged.reduce((a, d) => a + d.eatenPlanned, 0),
    mostSkipped,
    best,
  }
}

/**
 * Série de journées réussies consécutives, en remontant depuis aujourd'hui.
 * Aujourd'hui ne casse pas la série tant qu'il n'est pas réussi : la journée n'est pas finie.
 */
export function currentStreak(today: Date, success: (iso: string) => boolean | null, maxDays = 366): number {
  let n = 0
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let i = 0; i < maxDays; i++) {
    const ok = success(toISODate(d))
    if (ok) n++
    else if (i > 0) break
    d.setDate(d.getDate() - 1)
  }
  return n
}
