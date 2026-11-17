/**
 * Cibles adaptatives : à partir des pesées et de ce qui a été réellement mangé,
 * estime la dépense réelle et propose (sans jamais appliquer seul) de nouvelles calories.
 */
import type { Settings, WeighIn } from '../types'

export const KCAL_PER_KG = 7700
export const WINDOW_DAYS = 28
export const MIN_WEIGHINS = 3
export const MIN_SPAN_DAYS = 14
export const MIN_LOGGED_DAYS = 10
export const MAX_STEP = 200

/** Variation de poids attendue, en % du poids par semaine. */
export const GOAL_RATE: Record<Settings['goal'], { min: number; max: number; factor: number }> = {
  recomposition: { min: -0.5, max: -0.1, factor: 0.9 },
  perte: { min: -1.0, max: -0.5, factor: 0.8 },
  prise: { min: 0.15, max: 0.5, factor: 1.08 },
}

const DAY = 86_400_000
const toTime = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) }
const round50 = (n: number) => Math.round(n / 50) * 50

/** Pente de la droite des moindres carrés, en kg par jour. */
export function slopeKgPerDay(points: WeighIn[]): number {
  if (points.length < 2) return 0
  const xs = points.map((p) => toTime(p.date) / DAY)
  const x0 = xs[0]
  const X = xs.map((x) => x - x0)
  const mx = X.reduce((a, b) => a + b, 0) / X.length
  const my = points.reduce((a, p) => a + p.kg, 0) / points.length
  let num = 0, den = 0
  points.forEach((p, i) => { num += (X[i] - mx) * (p.kg - my); den += (X[i] - mx) ** 2 })
  return den === 0 ? 0 : num / den
}

export type Adaptive =
  | { status: 'insufficient'; weighIns: number; spanDays: number; loggedDays: number; reason: string }
  | {
    status: 'on-track' | 'adjust'
    rateKgWeek: number
    ratePct: number
    expected: { min: number; max: number }
    tdee: number | null
    avgIntake: number | null
    loggedDays: number
    current: { rest: number; training: number }
    suggested: { rest: number; training: number }
    reason: string
  }

export function analyze(params: {
  today: string
  weighIns: WeighIn[]
  /** kcal réellement mangées par jour suivi (jours sans saisie exclus). */
  intakeByDate: Map<string, number>
  settings: Pick<Settings, 'goal' | 'targets' | 'trainingDays' | 'weightKg'>
}): Adaptive {
  const { today, settings } = params
  const start = toTime(today) - WINDOW_DAYS * DAY
  const pts = params.weighIns.filter((w) => toTime(w.date) >= start && toTime(w.date) <= toTime(today))
    .sort((a, b) => a.date.localeCompare(b.date))
  const spanDays = pts.length ? Math.round((toTime(pts[pts.length - 1].date) - toTime(pts[0].date)) / DAY) : 0
  const intakes = [...params.intakeByDate.entries()].filter(([d]) => toTime(d) >= start && toTime(d) < toTime(today)).map(([, k]) => k)
  const loggedDays = intakes.length

  if (pts.length < MIN_WEIGHINS || spanDays < MIN_SPAN_DAYS) {
    return {
      status: 'insufficient', weighIns: pts.length, spanDays, loggedDays,
      reason: `Il faut au moins ${MIN_WEIGHINS} pesées sur ${MIN_SPAN_DAYS} jours (tu en as ${pts.length} sur ${spanDays} j).`,
    }
  }

  const slope = slopeKgPerDay(pts)
  const rateKgWeek = slope * 7
  const refKg = pts[pts.length - 1].kg
  const ratePct = (rateKgWeek / refKg) * 100
  const goal = GOAL_RATE[settings.goal ?? 'recomposition']
  const { rest, training } = { rest: settings.targets.rest.kcal, training: settings.targets.training.kcal }
  const delta = training - rest
  const tPerWeek = settings.trainingDays.length

  let tdee: number | null = null
  let avgIntake: number | null = null
  let newRest = rest
  let reason: string

  if (loggedDays >= MIN_LOGGED_DAYS) {
    avgIntake = intakes.reduce((a, b) => a + b, 0) / intakes.length
    tdee = avgIntake - slope * KCAL_PER_KG
    const weeklyAvgTarget = tdee * goal.factor
    newRest = weeklyAvgTarget - (delta * tPerWeek) / 7
    reason = `Tu as mangé en moyenne ${Math.round(avgIntake)} kcal et ton poids évolue de ${fmtRate(rateKgWeek)} : ta dépense réelle est d'environ ${round50(tdee)} kcal.`
  } else {
    // Pas assez de jours suivis : simple correction de cap à partir du poids seul.
    if (ratePct > goal.max) newRest = rest - 100
    else if (ratePct < goal.min) newRest = rest + 100
    reason = `Ton poids évolue de ${fmtRate(rateKgWeek)}. Avec seulement ${loggedDays} jours suivis, l'ajustement se base sur le poids seul.`
  }

  newRest = round50(Math.max(rest - MAX_STEP, Math.min(rest + MAX_STEP, newRest)))
  const inRange = ratePct >= goal.min && ratePct <= goal.max
  const status = Math.abs(newRest - rest) < 75 || (inRange && Math.abs(newRest - rest) < 150) ? 'on-track' : 'adjust'
  return {
    status, rateKgWeek, ratePct, expected: goal, tdee: tdee === null ? null : round50(tdee),
    avgIntake: avgIntake === null ? null : Math.round(avgIntake), loggedDays,
    current: { rest, training },
    suggested: status === 'adjust' ? { rest: newRest, training: newRest + delta } : { rest, training },
    reason,
  }
}

export function fmtRate(kgPerWeek: number): string {
  const v = Math.round(kgPerWeek * 100) / 100
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2).replace('.', ',')} kg/sem`
}
