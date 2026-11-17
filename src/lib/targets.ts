import type { Macros, Settings } from '../types'

/** Glucides = reste des calories une fois protéines (4 kcal/g) et lipides (9 kcal/g) comptés. */
export function computeCarbs(kcal: number, protein: number, fat: number): number {
  const carbs = (kcal - protein * 4 - fat * 9) / 4
  return Math.max(0, Math.floor(carbs))
}

export function buildMacros(kcal: number, protein: number, fat: number): Macros {
  return { kcal, protein, fat, carbs: computeCarbs(kcal, protein, fat) }
}

export function isTrainingDay(date: Date, trainingDays: number[]): boolean {
  return trainingDays.includes(date.getDay())
}

export function targetsForDate(date: Date, settings: Settings): Macros {
  return isTrainingDay(date, settings.trainingDays) ? settings.targets.training : settings.targets.rest
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  weightKg: 70,
  heightCm: 175,
  age: 28,
  // mardi, mercredi, jeudi, samedi, dimanche
  trainingDays: [2, 3, 4, 6, 0],
  trainingTime: 'morning',
  targets: {
    rest: buildMacros(2200, 140, 70),
    training: buildMacros(2400, 140, 70),
  },
  maxRepeatsPerWeekPerSlot: 2,
}

/** Lundi de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return d
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
