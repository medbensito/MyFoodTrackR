import { describe, expect, it } from 'vitest'
import type { Food } from '../types'
import { suggestNow, targetForNow, withLeanFloor } from './now'
import type { PlannerRecipe } from './planner'

const M = (kcal: number, protein: number, carbs: number, fat: number) => ({ kcal, protein, carbs, fat })
const share = { breakfast: M(550, 34, 63, 18), lunch: M(770, 41, 88, 25), dinner: M(660, 41, 76, 21), snack: M(220, 25, 25, 7) }

const recipes: PlannerRecipe[] = [
  { id: 'poulet-riz', name: 'Poulet riz', slots: ['lunch', 'dinner'], perServing: M(650, 45, 80, 14) },
  { id: 'pates', name: 'Pâtes bolo', slots: ['lunch', 'dinner'], perServing: M(700, 48, 85, 18) },
  { id: 'porridge', name: 'Porridge', slots: ['breakfast'], perServing: M(560, 35, 85, 9) },
  { id: 'shake', name: 'Shake whey', slots: ['snack'], perServing: M(230, 31, 14, 5) },
]
const whey = { id: 'whey', name: 'Whey', category: 'complements', state: 'sec', kcal: 380, protein: 78, carbs: 8, fat: 6, defaultPortionG: 30 } as Food
const oeuf = { id: 'oeuf', name: 'Œuf', category: 'proteines', state: 'cru', kcal: 143, protein: 13, carbs: 1, fat: 9.5, defaultPortionG: 50 } as Food

describe('que manger maintenant', () => {
  it('garde de quoi couvrir les repas suivants', () => {
    const t = targetForNow({ day: M(2200, 140, 252, 70), consumed: M(800, 60, 90, 25), mode: 'meal', later: ['snack', 'dinner'], plannedLater: new Map([['dinner', M(600, 40, 70, 18)]]), slotShare: share })
    expect(t).toEqual(M(580, 15, 67, 20))
    const all = targetForNow({ day: M(2200, 140, 252, 70), consumed: M(800, 60, 90, 25), mode: 'rest', later: ['snack', 'dinner'], plannedLater: new Map(), slotShare: share })
    expect(all.kcal).toBe(1400)
  })

  it('propose la recette et la portion qui collent', () => {
    const opts = suggestNow({ target: M(660, 42, 78, 18), slot: 'dinner', recipes, foods: [whey, oeuf] })
    expect(opts[0].kind).toBe('recipe')
    expect(['poulet-riz', 'pates']).toContain(opts[0].id)
    expect(opts[0].fits).toBe(true)
    expect(opts[0].factor).toBe(1)
    expect(opts.length).toBe(3)
  })

  it('pour un petit manque de protéines, un aliment suffit', () => {
    const opts = suggestNow({ target: M(120, 25, 3, 2), slot: 'snack', recipes, foods: [whey, oeuf] })
    expect(opts[0]).toMatchObject({ kind: 'food', id: 'whey', grams: 30 })
    expect(opts.some((o) => o.id === 'oeuf')).toBe(false) // cru : pas tel quel
  })

  it('ne propose rien quand la journée est bouclée', () => {
    expect(suggestNow({ target: M(50, 3, 5, 1), slot: 'snack', recipes, foods: [whey] })).toEqual([])
  })

  it('évite de reproposer une recette déjà mangée', () => {
    const opts = suggestNow({ target: M(660, 42, 78, 18), slot: 'dinner', recipes, foods: [], eatenRecipeIds: new Set(['pates']) })
    expect(opts[0].id).toBe('poulet-riz')
  })
  it('peu de calories mais des protéines à prendre : une source maigre', () => {
    const { target, lean } = withLeanFloor(M(40, 45, 0, 0))
    expect(lean).toBe(true)
    expect(target.kcal).toBe(225)
    const opts = suggestNow({ target, slot: 'snack', recipes, foods: [whey] })
    expect(opts.some((o) => o.id === 'whey' || o.id === 'shake')).toBe(true)
    expect(withLeanFloor(M(600, 40, 60, 20)).lean).toBe(false)
  })
})
