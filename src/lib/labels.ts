import type { Settings, TrainingTime } from '../types'

export const GOAL_LABEL: Record<Settings['goal'], { short: string; long: string }> = {
  recomposition: { short: 'Recomposition', long: 'Réduire la masse grasse et gagner du muscle' },
  perte: { short: 'Perte de gras', long: 'Réduire la masse grasse en préservant le muscle' },
  prise: { short: 'Prise de muscle', long: 'Gagner du muscle avec un léger surplus' },
}

export const TIME_LABEL: Record<TrainingTime, string> = { morning: 'Matin', noon: 'Midi', evening: 'Soir' }

const SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const shortDay = (d: Date) => SHORT[d.getDay()]

/** "Mar, Mer, Jeu, Sam, Dim" dans l'ordre lundi → dimanche. */
export function trainingDaysLabel(days: number[]): string {
  if (days.length === 0) return 'Aucun'
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => SHORT[d]).join(', ')
}

/** Part de chaque macro dans les calories, en pourcentage arrondi. */
export function macroShares(m: { kcal: number; protein: number; carbs: number; fat: number }) {
  if (m.kcal <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round((m.protein * 4 * 100) / m.kcal),
    carbs: Math.round((m.carbs * 4 * 100) / m.kcal),
    fat: Math.round((m.fat * 9 * 100) / m.kcal),
  }
}
