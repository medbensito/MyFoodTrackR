import { describe, expect, it } from 'vitest'
import { initialFoods } from '../db/seed'
import { SAMPLE_RECIPES } from '../db/sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from '../db/pack'
import { kcalFromMacros, macrosForGrams, normalize, recipeTotals, roundMacros } from './nutrition'
import type { Food } from '../types'

const foods = new Map(initialFoods().map((f) => [f.id, f]))

describe('macrosForGrams', () => {
  it('applique la règle de trois sur 100 g', () => {
    const poulet = foods.get('poulet-blanc-cuit')!
    expect(roundMacros(macrosForGrams(poulet, 150))).toEqual({ kcal: 248, protein: 47, carbs: 0, fat: 5 })
  })
})

describe('recipeTotals', () => {
  it('calcule le total et la portion', () => {
    const r = recipeTotals(
      { servings: 2, ingredients: [{ foodId: 'riz-blanc-cru', grams: 100 }, { foodId: 'poulet-blanc-cuit', grams: 200 }] },
      foods,
    )
    expect(Math.round(r.total.kcal)).toBe(360 + 330)
    expect(Math.round(r.perServing.protein)).toBe(Math.round((7 + 62) / 2))
    expect(r.totalGrams).toBe(300)
  })

  it('signale les aliments manquants et non vérifiés', () => {
    const verified: Food = { ...foods.get('banane')!, verified: true }
    const map = new Map(foods); map.set('banane', verified)
    const r = recipeTotals({ servings: 1, ingredients: [
      { foodId: 'banane', grams: 100 }, { foodId: 'pomme', grams: 100 }, { foodId: 'inconnu', grams: 50 },
    ] }, map)
    expect(r.missingFoodIds).toEqual(['inconnu'])
    expect(r.unverifiedFoodIds).toEqual(['pomme'])
    expect(Math.round(r.total.kcal)).toBe(89 + 52)
  })

  it('ignore les grammes invalides et les portions nulles', () => {
    const r = recipeTotals({ servings: 0, ingredients: [{ foodId: 'banane', grams: NaN }, { foodId: 'pomme', grams: 100 }] }, foods)
    expect(Math.round(r.perServing.kcal)).toBe(52)
  })
})

describe('recettes d\'exemple', () => {
  it('référencent toutes des aliments existants', () => {
    for (const r of SAMPLE_RECIPES) {
      expect(recipeTotals(r, foods).missingFoodIds, r.name).toEqual([])
      expect(r.slots.length, r.name).toBeGreaterThan(0)
    }
  })
  it('couvrent les 4 créneaux', () => {
    const slots = new Set(SAMPLE_RECIPES.flatMap((r) => r.slots))
    expect([...slots].sort()).toEqual(['breakfast', 'dinner', 'lunch', 'snack'])
  })
  it('ont des protéines adaptées au créneau', () => {
    for (const r of SAMPLE_RECIPES) {
      const p = recipeTotals(r, foods).perServing.protein
      expect(p, r.name).toBeGreaterThanOrEqual(r.slots.includes('snack') ? 15 : 30)
    }
  })
})

describe('utilitaires', () => {
  it('normalise accents et casse', () => {
    expect(normalize('  Œuf ENTIER ')).toBe('œuf entier')
    expect(normalize('Pâtes')).toBe('pates')
  })
  it('recalcule les kcal', () => {
    expect(kcalFromMacros(31, 0, 3.6)).toBeCloseTo(156.4)
  })
})

describe('pack de recettes', () => {
  const all = new Map([...initialFoods(), ...PACK_FOODS].map((f) => [f.id, f]))
  it('a des identifiants uniques', () => {
    const ids = [...initialFoods(), ...PACK_FOODS].map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    const rids = [...SAMPLE_RECIPES, ...PACK_RECIPES].map((r) => r.id)
    expect(new Set(rids).size).toBe(rids.length)
  })
  it('référence des aliments existants et vise assez de protéines', () => {
    for (const r of PACK_RECIPES) {
      const t = recipeTotals(r, all)
      expect(t.missingFoodIds, r.name).toEqual([])
      expect(t.perServing.protein, r.name).toBeGreaterThanOrEqual(r.slots.every((s) => s === 'snack') ? 15 : 30)
    }
  })
  it('a des valeurs nutritionnelles cohérentes', () => {
    for (const f of PACK_FOODS) {
      expect(f.protein + f.carbs + f.fat, f.name).toBeLessThanOrEqual(100)
      expect(Math.abs(kcalFromMacros(f.protein, f.carbs, f.fat) - f.kcal) / f.kcal, f.name).toBeLessThan(0.15)
    }
  })
})
