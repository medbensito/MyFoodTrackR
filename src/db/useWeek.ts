import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { DayExtra, Macros, Settings } from '../types'
import { targetsForDate, toISODate, trainingOn, weekDays } from '../lib/targets'
import { adjustMacros, weekBudget, type WeekBudget } from '../lib/week'

export type WeekTargets = {
  dates: string[]
  budget: WeekBudget
  extras: Map<string, DayExtra>
  isTraining: (iso: string) => boolean
  /** Cible de base (repos / entraînement). */
  baseFor: (iso: string) => Macros
  /** Cible à atteindre ce jour-là : écart prévu ou allègement compris (Tracker). */
  targetFor: (iso: string) => Macros
  /**
   * Cible des repas planifiés : allégée si besoin, mais sans l'écart prévu,
   * qui se mange en dehors du plan (resto, fête…).
   */
  planTargetFor: (iso: string) => Macros
  /** Allègement des jours suivants si la journée `iso` se terminait à `kcal`. */
  cutIfDayEndsAt: (iso: string, kcal: number) => number
  /** Allègement par jour si l'écart prévu de `iso` passait à `kcal` (0 : supprimé). */
  cutWithExtra: (iso: string, kcal: number) => { cut: number; uncovered: number }
}

const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const next = (iso: string) => { const d = parse(iso); d.setDate(d.getDate() + 1); return toISODate(d) }

/** Cibles de la semaine (lundi → dimanche) qui contient `anchor`. */
export async function loadWeekTargets(anchor: Date | string, settings: Settings): Promise<WeekTargets> {
  const dates = weekDays(typeof anchor === 'string' ? parse(anchor) : anchor).map(toISODate)
  const [logs, extras, overrides] = await Promise.all([
    db.logEntries.where('date').between(dates[0], dates[6], true, true).toArray(),
    db.extras.where('date').between(dates[0], dates[6], true, true).toArray(),
    db.dayOverrides.where('date').between(dates[0], dates[6], true, true).toArray(),
  ])
  const ov = new Map(overrides.map((o) => [o.date, o.training]))
  const baseFor = (iso: string) => targetsForDate(parse(iso), settings, ov)
  const base = new Map(dates.map((d) => [d, baseFor(d).kcal]))
  const eaten = new Map<string, number>()
  for (const l of logs) eaten.set(l.date, (eaten.get(l.date) ?? 0) + l.macros.kcal)
  const input = { dates, base, eaten, extras, today: toISODate(new Date()), compensate: settings.weekBalance !== false }
  const budget = weekBudget(input)
  const delta = (iso: string) => budget.delta.get(iso) ?? 0
  const extraMap = new Map(extras.map((e) => [e.date, e]))

  return {
    dates,
    budget,
    extras: extraMap,
    isTraining: (iso) => trainingOn(parse(iso), settings, ov),
    baseFor,
    targetFor: (iso) => adjustMacros(baseFor(iso), delta(iso)),
    planTargetFor: (iso) => adjustMacros(baseFor(iso), Math.min(0, delta(iso))),
    cutIfDayEndsAt: (iso, kcal) => {
      if (!input.compensate || iso === dates[6]) return 0
      const e = new Map(eaten); e.set(iso, kcal)
      return weekBudget({ ...input, eaten: e, today: next(iso) }).cut
    },
    cutWithExtra: (iso, kcal) => {
      const others = extras.filter((x) => x.date !== iso)
      const b = weekBudget({ ...input, extras: kcal > 0 ? [...others, { date: iso, kcal, label: '', createdAt: Date.now() }] : others })
      return { cut: b.cut, uncovered: b.uncovered }
    },
  }
}

export function useWeekTargets(anchor: Date | string, settings: Settings): WeekTargets | undefined {
  const key = typeof anchor === 'string' ? anchor : toISODate(anchor)
  const monday = toISODate(weekDays(parse(key))[0])
  return useLiveQuery(() => loadWeekTargets(monday, settings), [monday, settings])
}
