import { describe, expect, it } from 'vitest'
import type { LogEntry, PlannedMeal } from '../types'
import { currentStreak, isSuccess, reviewDay, summarizeWeek } from './review'

const T = { kcal: 2200, protein: 140, carbs: 252, fat: 70 }
const entry = (date: string, kcal: number, protein: number, fromPlannedMealId?: string): LogEntry => ({
  id: Math.random().toString(36), date, name: 'x', macros: { kcal, protein, carbs: 0, fat: 0 }, createdAt: 0, fromPlannedMealId,
})
const meal = (id: string, date: string, slot: PlannedMeal['slot']): PlannedMeal => ({ id, date, slot, recipeId: 'r', portionFactor: 1, pinned: false })

describe('isSuccess', () => {
  it('demande les protéines et des calories proches', () => {
    expect(isSuccess({ kcal: 2150, protein: 136, carbs: 0, fat: 0 }, T)).toBe(true)
    expect(isSuccess({ kcal: 2150, protein: 130, carbs: 0, fat: 0 }, T)).toBe(false)
    expect(isSuccess({ kcal: 2500, protein: 150, carbs: 0, fat: 0 }, T)).toBe(false)
  })
})

describe('reviewDay et summarizeWeek', () => {
  const planned = [meal('a', 'd1', 'breakfast'), meal('b', 'd1', 'snack'), meal('c', 'd2', 'snack'), meal('d', 'd3', 'snack')]
  const days = [
    reviewDay('d1', true, T, [entry('d1', 1200, 80, 'a'), entry('d1', 1000, 62)], planned.filter((m) => m.date === 'd1')),
    reviewDay('d2', false, T, [entry('d2', 1500, 90)], planned.filter((m) => m.date === 'd2')),
    reviewDay('d3', false, T, [], planned.filter((m) => m.date === 'd3')),
  ]
  it('calcule chaque journée', () => {
    expect(days[0]).toMatchObject({ consumed: { kcal: 2200, protein: 142 }, success: true, planned: 2, eatenPlanned: 1, skipped: ['snack'] })
    expect(days[2]).toMatchObject({ consumed: null, success: null, skipped: [] })
  })
  it('résume la semaine', () => {
    const w = summarizeWeek(days)
    expect(w).toMatchObject({ logged: 2, successes: 1, avgProtein: 116, avgKcal: 1850, plannedTotal: 3, eatenPlannedTotal: 1 })
    expect(w.mostSkipped).toEqual({ slot: 'snack', count: 2 })
    expect(w.best?.date).toBe('d1')
  })
})

describe('currentStreak', () => {
  const ok = new Map([['2026-11-14', true], ['2026-11-15', true], ['2026-11-16', true], ['2026-11-13', false]])
  const s = (iso: string) => ok.get(iso) ?? null
  it('ne casse pas la série sur la journée en cours', () => {
    expect(currentStreak(new Date(2026, 10, 17), s)).toBe(3)
  })
  it('compte aujourd\'hui quand il est réussi', () => {
    const s2 = (iso: string) => (iso === '2026-11-17' ? true : s(iso))
    expect(currentStreak(new Date(2026, 10, 17), s2)).toBe(4)
  })
  it('vaut 0 sans journée réussie hier', () => {
    expect(currentStreak(new Date(2026, 10, 20), s)).toBe(0)
  })
})
