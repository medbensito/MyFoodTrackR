import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { FoodTrackDB } from './db'
import { initialFoods } from './seed'

describe('base locale', () => {
  it('importe les aliments et les réglages au premier lancement', async () => {
    const db = new FoodTrackDB('test-' + Math.random())
    expect(await db.foods.count()).toBe(33)
    const settings = await db.settings.get('main')
    expect(settings?.weightKg).toBe(70)
    expect(settings?.trainingTime).toBe('morning')
    const poulet = await db.foods.get('poulet-blanc-cuit')
    expect(poulet).toMatchObject({ name: 'Poulet, blanc cuit sans peau', protein: 31, verified: false, custom: false })
    db.close()
  })

  it('a des identifiants uniques et des valeurs cohérentes', () => {
    const foods = initialFoods()
    expect(new Set(foods.map((f) => f.id)).size).toBe(foods.length)
    for (const f of foods) {
      expect(f.protein + f.carbs + f.fat).toBeLessThanOrEqual(100.5)
      expect(f.defaultPortionG).toBeGreaterThan(0)
    }
  })
})
