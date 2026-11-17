import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { FoodTrackDB } from './db'
import { initialFoods } from './seed'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from './pack'
import { PACK3_FOODS, PACK3_RECIPES } from './pack3'
import { PRICES } from './prices'
import { LEGACY_V4 } from './legacyRecipes'
import { DEFAULT_SETTINGS } from '../lib/targets'
import Dexie from 'dexie'

describe('base locale', () => {
  it('importe les aliments et les réglages au premier lancement', async () => {
    const db = new FoodTrackDB('test-' + Math.random())
    expect(await db.foods.count()).toBe(33 + PACK_FOODS.length + PACK3_FOODS.length)
    const settings = await db.settings.get('main')
    expect(settings?.weightKg).toBe(70)
    expect(settings?.trainingTime).toBe('morning')
    const poulet = await db.foods.get('poulet-blanc-cuit')
    expect(poulet).toMatchObject({ name: 'Poulet, blanc cuit sans peau', protein: 31, verified: false, custom: false })
    db.close()
  })

  it('crée les recettes d\'exemple sur une base neuve', async () => {
    const db = new FoodTrackDB('test-' + Math.random())
    expect(await db.recipes.count()).toBe(SAMPLE_RECIPES.length + PACK_RECIPES.length + PACK3_RECIPES.length)
    db.close()
  })

  it('ajoute les recettes d\'exemple à une base créée en M0', async () => {
    const name = 'test-upgrade-' + Math.random()
    const v1 = new Dexie(name)
    v1.version(1).stores({ foods: 'id, name, category, verified', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id' })
    await v1.table('settings').add({ ...DEFAULT_SETTINGS, name: undefined, goal: undefined })
    v1.close()

    const db = new FoodTrackDB(name)
    expect(await db.recipes.count()).toBe(SAMPLE_RECIPES.length + PACK_RECIPES.length + PACK3_RECIPES.length)
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
    expect(await db.recipes.count()).toBe(PACK_RECIPES.length + PACK3_RECIPES.length)
    expect(await db.foods.count()).toBe(PACK_FOODS.length + PACK3_FOODS.length)
    db.close()
  })

  it('rééquilibre les recettes non modifiées, garde les autres', async () => {
    const name = 'test-v5-' + Math.random()
    const v4 = new Dexie(name)
    v4.version(4).stores({ foods: 'id, name, category, verified', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id', shoppingChecks: 'id', dayOverrides: 'date' })
    const old = LEGACY_V4['ex-poulet-riz-brocoli']
    await v4.table('recipes').add({ id: 'ex-poulet-riz-brocoli', ...old, notes: undefined, favorite: true })
    await v4.table('recipes').add({ id: 'ex-pates-thon', ...LEGACY_V4['ex-pates-thon'], name: 'Mes pâtes au thon' })
    await v4.table('settings').add(DEFAULT_SETTINGS)
    v4.close()
    const db = new FoodTrackDB(name)
    const updated = await db.recipes.get('ex-poulet-riz-brocoli')
    const target = SAMPLE_RECIPES.find((r) => r.id === 'ex-poulet-riz-brocoli')!
    expect(updated?.ingredients).toEqual(target.ingredients)
    expect(updated?.favorite).toBe(true)
    expect((await db.recipes.get('ex-pates-thon'))?.name).toBe('Mes pâtes au thon')
    expect((await db.recipes.get('ex-pates-thon'))?.ingredients).toEqual(LEGACY_V4['ex-pates-thon'].ingredients)
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

describe('fiches de préparation (v8)', () => {
  it('ajoute la fiche aux recettes fournies, sans écraser une recette modifiée', async () => {
    const { GUIDES } = await import('./guides')
    const name = 'mft-v7-' + Math.random()
    const v7 = new Dexie(name)
    v7.version(7).stores({ foods: 'id, name, category, verified, barcode', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id', shoppingChecks: 'id', dayOverrides: 'date', weighIns: 'date' })
    const tajine = PACK_RECIPES.find((r) => r.id === 'pk-tajine-poulet-olives')!
    const porridge = SAMPLE_RECIPES.find((r) => r.id === 'ex-porridge-proteine')!
    await v7.table('recipes').bulkAdd([
      tajine,
      { ...porridge, notes: 'Ma façon à moi' },
      { ...SAMPLE_RECIPES.find((r) => r.id === 'ex-poulet-riz-brocoli')!, ingredients: [{ foodId: 'poulet-blanc-cuit', grams: 110 }] },
    ])
    v7.close()
    const db = new FoodTrackDB(name)
    await db.open()
    const t = await db.recipes.get('pk-tajine-poulet-olives')
    expect(t?.steps).toEqual(GUIDES['pk-tajine-poulet-olives'].steps)
    expect(t?.notes).toBeUndefined()
    const p = await db.recipes.get('ex-porridge-proteine')
    expect(p?.steps?.length).toBeGreaterThan(0)
    expect(p?.notes).toBe('Ma façon à moi')
    expect((await db.recipes.get('ex-poulet-riz-brocoli'))?.steps).toBeUndefined()
    db.close()
  })
})

describe('pack v3.2 (v9)', () => {
  it('ajoute les nouvelles recettes avec leur fiche, sans toucher aux existantes', async () => {
    const name = 'test-v9-' + Math.random()
    const v8 = new Dexie(name)
    v8.version(8).stores({ foods: 'id, name, category, verified, barcode', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id', shoppingChecks: 'id', dayOverrides: 'date', weighIns: 'date' })
    await v8.table('recipes').add({ ...PACK_RECIPES[0], name: 'Ma version' })
    await v8.table('foods').add({ ...PACK3_FOODS[0], name: 'Ma tortilla' })
    await v8.table('settings').add(DEFAULT_SETTINGS)
    v8.close()
    const db = new FoodTrackDB(name)
    expect((await db.recipes.get(PACK_RECIPES[0].id))?.name).toBe('Ma version')
    expect((await db.foods.get(PACK3_FOODS[0].id))?.name).toBe('Ma tortilla')
    expect(await db.recipes.count()).toBe(1 + PACK3_RECIPES.length)
    expect((await db.recipes.get('p3-wrap-poulet'))?.steps?.length).toBeGreaterThan(3)
    expect(await db.extras.count()).toBe(0)
    db.close()
  })
})

describe('prix (v10)', () => {
  it('pré-remplit les prix sans écraser un prix saisi', async () => {
    const name = 'test-v10-' + Math.random()
    const v9 = new Dexie(name)
    v9.version(9).stores({ foods: 'id, name, category, verified, barcode', recipes: 'id, name, *slots', plannedMeals: 'id, date, [date+slot]', logEntries: 'id, date', settings: 'id', shoppingChecks: 'id', dayOverrides: 'date', weighIns: 'date', extras: 'date' })
    const seed = initialFoods()
    await v9.table('foods').bulkAdd([{ ...seed.find((f) => f.id === 'riz-blanc-cru')!, pricePerKg: 19 }, seed.find((f) => f.id === 'banane')!, { ...seed[0], id: 'perso-x' }])
    await v9.table('settings').add(DEFAULT_SETTINGS)
    v9.close()
    const db = new FoodTrackDB(name)
    expect((await db.foods.get('riz-blanc-cru'))?.pricePerKg).toBe(19)
    expect((await db.foods.get('banane'))?.pricePerKg).toBe(15)
    expect((await db.foods.get('perso-x'))?.pricePerKg).toBeUndefined()
    db.close()
  })

  it('chaque aliment fourni a un prix', () => {
    for (const f of [...initialFoods(), ...PACK_FOODS, ...PACK3_FOODS]) expect(PRICES[f.id], f.id).toBeGreaterThan(0)
  })
})
