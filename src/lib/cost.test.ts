import { describe, expect, it } from 'vitest'
import type { Food } from '../types'
import { costOf, fmtDh, recipeCost } from './cost'

const foods = new Map<string, Food>([
  ['poulet-blanc-cuit', { id: 'poulet-blanc-cuit', pricePerKg: 50 } as Food],
  ['riz-blanc-cru', { id: 'riz-blanc-cru', pricePerKg: 16 } as Food],
  ['lentilles-cuites', { id: 'lentilles-cuites', pricePerKg: 22 } as Food],
  ['perso', { id: 'perso' } as Food],
])

describe('coût', () => {
  it('compte le poids acheté, pas le poids cuit', () => {
    expect(costOf(foods.get('poulet-blanc-cuit')!, 100)).toBeCloseTo(6.75) // 135 g crus à 50 DH/kg
    expect(costOf(foods.get('lentilles-cuites')!, 250)).toBeCloseTo(2.2) // 100 g secs à 22 DH/kg
    expect(costOf(foods.get('riz-blanc-cru')!, 100)).toBeCloseTo(1.6)
    expect(costOf(foods.get('perso')!, 100)).toBeNull()
  })

  it('donne le coût par portion et signale les prix manquants', () => {
    const r = recipeCost({ servings: 2, ingredients: [{ foodId: 'poulet-blanc-cuit', grams: 200 }, { foodId: 'riz-blanc-cru', grams: 200 }, { foodId: 'perso', grams: 50 }] }, foods)
    expect(r.perServing).toBeCloseTo((13.5 + 3.2) / 2)
    expect(r.missing).toBe(1)
  })

  it('arrondit lisiblement', () => {
    expect(fmtDh(14.3)).toBe('14,5 DH')
    expect(fmtDh(0.8)).toBe('1 DH')
    expect(fmtDh(126.4)).toBe('126 DH')
  })
})
