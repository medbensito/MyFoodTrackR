import { describe, expect, it } from 'vitest'
import { isoWeek, buildMacros, computeCarbs, DEFAULT_SETTINGS, isTrainingDay, startOfWeek, targetsForDate, toISODate, weekDays } from './targets'

describe('computeCarbs', () => {
  it('calcule les glucides restants', () => {
    expect(computeCarbs(2200, 140, 70)).toBe(252)
    expect(computeCarbs(2400, 140, 70)).toBe(302)
  })
  it('ne descend jamais sous zéro', () => {
    expect(computeCarbs(800, 140, 70)).toBe(0)
  })
})

describe('cibles par défaut', () => {
  it('correspondent au cadrage', () => {
    expect(DEFAULT_SETTINGS.targets.rest).toEqual({ kcal: 2200, protein: 140, fat: 70, carbs: 252 })
    expect(DEFAULT_SETTINGS.targets.training).toEqual({ kcal: 2400, protein: 140, fat: 70, carbs: 302 })
    expect(buildMacros(2400, 140, 70).carbs).toBe(302)
  })
})

describe('jours d\'entraînement', () => {
  // Semaine du lundi 16 novembre 2026
  const days = weekDays(new Date(2026, 10, 18))
  it('commence le lundi', () => {
    expect(toISODate(startOfWeek(new Date(2026, 10, 22)))).toBe('2026-11-16')
    expect(days.map(toISODate)[0]).toBe('2026-11-16')
    expect(days).toHaveLength(7)
  })
  it('marque mardi, mercredi, jeudi, samedi, dimanche', () => {
    const flags = days.map((d) => isTrainingDay(d, DEFAULT_SETTINGS.trainingDays))
    // L  M     M     J     V      S     D
    expect(flags).toEqual([false, true, true, true, false, true, true])
  })
  it('applique la bonne cible', () => {
    expect(targetsForDate(days[0], DEFAULT_SETTINGS).kcal).toBe(2200)
    expect(targetsForDate(days[1], DEFAULT_SETTINGS).kcal).toBe(2400)
  })
})

describe('isoWeek', () => {
  it('suit la norme ISO', () => {
    expect(isoWeek(new Date(2026, 10, 17))).toBe(47)
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53)
  })
})
