import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { FoodTrackDB } from './db'
import { initialFoods } from './seed'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from './pack'
import { DEFAULT_SETTINGS } from '../lib/targets'
import Dexie from 'dexie'

describe('base locale', () => {
  it('importe les aliments et les réglages au premier lancement', async () => {
    const db = new FoodTrackDB('test-' + Math.random())
    expect(await db.foods.count()).toBe(33 + PACK_FOODS.length)
    const settings = await db.settings.get('main')
    expect(settings?.weightKg).toBe(70)
    expect(settings?.trainingTime).toBe('morning')
    const poulet = await db.foods.get('poulet-blanc-cuit')
    expect(poulet).toMatchObject({ name: 'Poulet, blanc cuit sans peau', protein: 31, verified: false, custom: false })
    db.close()
  })

  it('crée les recettes d\'exemple sur une base neuve', async () => {
    const db = new FoodTrackDB('test-' + Math.random())
    expect(await db.recipes.count()).toBe(SAMPLE_RECIPES.length + PACK_RECIPES.length)
    db.close()
  })

  it('ajoute les recettes d\'exemple à une base créée en M0', async () => {
    const name = 'test-upgrade-' + Math.random()
    const v1 = new Dexie(name)
    v1.version(1).stores({ foods: 'id, name, category, verified', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id' })
    await v1.table('settings').add({ ...DEFAULT_SETTINGS, name: undefined, goal: undefined })
    v1.close()

    const db = new FoodTrackDB(name)
    expect(await db.recipes.count()).toBe(SAMPLE_RECIPES.length + PACK_RECIPES.length)
    const s = await db.settings.get('main')
    expect(s?.name).toBe(DEFAULT_SETTINGS.name)
    expect(s?.goal).toBe('recomposition')
    db.close()
  })

  it('ajoute le pack sans écraser une recette modifiée', async () => {
    const name = 'test-pack-' + Math.random()
    const v3 = new Dexie(name)
    v3.version(3).stores({ foods: 'id, name, category, verified', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id', shoppingChecks: 'id', dayOverrides: 'date' })
    await v3.table('recipes').add({ ...PACK_RECIPES[0], name: 'Ma version' })
    await v3.table('settings').add(DEFAULT_SETTINGS)
    v3.close()
    const db = new FoodTrackDB(name)
    expect((await db.recipes.get(PACK_RECIPES[0].id))?.name).toBe('Ma version')
    expect(await db.recipes.count()).toBe(PACK_RECIPES.length)
    expect(await db.foods.count()).toBe(PACK_FOODS.length)
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
