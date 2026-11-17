import { describe, expect, it } from 'vitest'
import { initialFoods } from '../db/seed'
import { entryFromFood, entryFromPlanned, entryFromRecipe, remainingLabel, slotForHour, totalOf } from './journal'
import { roundMacros } from './nutrition'
import type { PlannerRecipe } from './planner'

const foods = new Map(initialFoods().map((f) => [f.id, f]))
const recipe: PlannerRecipe = { id: 'r1', name: 'Test', slots: ['lunch'], perServing: { kcal: 600, protein: 40, carbs: 60, fat: 20 } }

describe('journal', () => {
  it('fige les macros d\'un repas planifié', () => {
    const e = entryFromPlanned({ id: 'pm1', date: '2026-11-17', slot: 'lunch', recipeId: 'r1', portionFactor: 1.5, pinned: false }, recipe)
    expect(e.macros).toEqual({ kcal: 900, protein: 60, carbs: 90, fat: 30 })
    expect(e.fromPlannedMealId).toBe('pm1')
    expect(e.name).toBe('Test')
  })
  it('crée une entrée depuis une recette ou un aliment', () => {
    const r = entryFromRecipe('2026-11-17', 'dinner', recipe, 0.5)
    expect(r.macros.kcal).toBe(300)
    const f = entryFromFood('2026-11-17', 'snack', foods.get('banane')!, 120)
    expect(roundMacros(f.macros)).toEqual({ kcal: 107, protein: 1, carbs: 28, fat: 0 })
    expect(f.grams).toBe(120)
  })
  it('additionne la journée', () => {
    const t = totalOf([{ macros: { kcal: 100, protein: 10, carbs: 5, fat: 2 } }, { macros: { kcal: 50, protein: 5, carbs: 5, fat: 1 } }])
    expect(t).toEqual({ kcal: 150, protein: 15, carbs: 10, fat: 3 })
  })
  it('propose un créneau selon l\'heure', () => {
    expect(slotForHour(8)).toBe('breakfast')
    expect(slotForHour(13)).toBe('lunch')
    expect(slotForHour(16)).toBe('snack')
    expect(slotForHour(20)).toBe('dinner')
  })
  it('indique ce qu\'il reste', () => {
    const target = { kcal: 2200, protein: 140, carbs: 252, fat: 70 }
    expect(remainingLabel({ kcal: 1500, protein: 100, carbs: 0, fat: 0 }, target)).toBe('Il te reste 40 g de protéines et 700 kcal.')
    expect(remainingLabel({ kcal: 2210, protein: 145, carbs: 0, fat: 0 }, target)).toBe('Objectif atteint pour aujourd\'hui.')
    expect(remainingLabel({ kcal: 2500, protein: 150, carbs: 0, fat: 0 }, target)).toBe('Calories dépassées de 300 kcal.')
  })
})
