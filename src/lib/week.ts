import type { DayExtra, Macros } from '../types'

/**
 * Calories gérées sur la semaine (lundi → dimanche).
 *
 * - Un écart prévu (sortie, fête…) relève la cible de son jour ; l'équivalent est retiré,
 *   à parts égales, des autres jours restants de la semaine.
 * - Un dépassement déjà mangé (journée enregistrée au-dessus de sa cible de base) est
 *   compensé de la même façon sur les jours suivants, si l'option est active.
 * - Une journée mangée en dessous de sa cible réduit d'autant ce qu'il reste à compenser,
 *   sans jamais rajouter de calories ensuite.
 * - Jamais plus de MAX_CUT kcal retirées par jour, et les protéines ne bougent pas : ce qui
 *   ne rentre pas est simplement laissé de côté.
 */
export const MAX_CUT = 300

export type Extra = DayExtra

export type WeekInput = {
  /** Dates ISO de la semaine, dans l'ordre. */
  dates: string[]
  /** Cible de base de chaque jour (repos ou entraînement), en kcal. */
  base: Map<string, number>
  /** kcal mangées, uniquement pour les jours où quelque chose a été enregistré. */
  eaten: Map<string, number>
  extras: Extra[]
  today: string
  /** Compenser aussi les dépassements constatés (pas seulement les écarts prévus). */
  compensate: boolean
}

export type WeekBudget = {
  /** Écart à la cible de base, jour par jour (négatif : allégé ; positif : écart prévu). */
  delta: Map<string, number>
  /** Dépassement net des jours passés, encore à compenser (vu d'aujourd'hui). */
  debt: number
  /** Écarts prévus d'aujourd'hui à dimanche. */
  planned: number
  /** Retrait par jour d'aujourd'hui à dimanche (hors jours d'écart). */
  cut: number
  /** Ce qui n'a pas pu être compensé à cause du plafond. */
  uncovered: number
  baseTotal: number
  adjustedTotal: number
}

const endOfDay = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 23, 59, 59, 999).getTime() }

export function weekBudget(input: WeekInput): WeekBudget {
  const { dates, base, eaten, extras, today, compensate } = input
  const b = (d: string) => base.get(d) ?? 0
  const delta = new Map<string, number>()
  // Un écart n'est « connu » d'un jour passé que s'il avait été saisi avant la fin de ce jour.
  const visible = (e: Extra, asOf: string) => asOf >= today || e.createdAt <= endOfDay(asOf)
  const extraOn = (d: string, asOf: string) => extras.find((e) => e.date === d && visible(e, asOf))

  let snapshot = { debt: 0, planned: 0, cut: 0, uncovered: 0 }
  const firstAhead = dates.find((x) => x >= today)
  for (const d of dates) {
    const asOf = d < today ? d : today
    let debt = 0
    for (const j of dates) {
      if (j >= asOf) break
      const logged = eaten.get(j)
      debt += compensate && logged !== undefined ? logged - b(j) : delta.get(j) ?? 0
    }
    const ahead = dates.filter((j) => j >= asOf)
    const planned = ahead.reduce((s, j) => s + (extraOn(j, asOf)?.kcal ?? 0), 0)
    const window = ahead.filter((j) => !extraOn(j, asOf))
    const total = Math.max(0, debt + planned)
    const cut = window.length ? Math.round(Math.min(MAX_CUT, total / window.length) / 10) * 10 : 0
    if (d === firstAhead) {
      snapshot = { debt: Math.max(0, debt), planned, cut, uncovered: Math.max(0, Math.round(total - cut * window.length)) }
    }
    const extra = extraOn(d, asOf)
    delta.set(d, extra ? extra.kcal : cut ? -cut : 0)
  }
  const baseTotal = dates.reduce((s, d) => s + b(d), 0)
  const adjustedTotal = dates.reduce((s, d) => s + b(d) + (delta.get(d) ?? 0), 0)
  return { delta, ...snapshot, baseTotal, adjustedTotal }
}

/**
 * Applique un écart de kcal à une cible : les protéines ne changent pas. Un retrait vient
 * à 70 % des glucides et 30 % des lipides ; un écart prévu ajoute moitié-moitié.
 */
export function adjustMacros(t: Macros, deltaKcal: number): Macros {
  if (!deltaKcal) return t
  const share = deltaKcal < 0 ? 0.7 : 0.5
  return {
    kcal: t.kcal + deltaKcal,
    protein: t.protein,
    carbs: Math.max(0, Math.round(t.carbs + (deltaKcal * share) / 4)),
    fat: Math.max(0, Math.round(t.fat + (deltaKcal * (1 - share)) / 9)),
  }
}

/** Texte court d'un écart prévu ou d'un allègement. */
export function deltaLabel(delta: number): string {
  return delta > 0 ? `+${delta} kcal` : `−${Math.abs(delta)} kcal`
}
