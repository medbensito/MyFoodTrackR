import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackup, daysSince, parseBackup } from './backup'
import { exportAll, importAll } from '../db/backupDb'
import { FoodTrackDB } from '../db/db'
import { initialFoods } from '../db/seed'
import { SAMPLE_RECIPES } from '../db/sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from '../db/pack'
import { PACK3_FOODS, PACK3_RECIPES } from '../db/pack3'
import { DEFAULT_SETTINGS } from './targets'

const sample = () => buildBackup({
  foods: initialFoods(), recipes: SAMPLE_RECIPES, plannedMeals: [], logEntries: [], settings: [DEFAULT_SETTINGS],
}, new Date(2026, 10, 17))

describe('parseBackup', () => {
  it('accepte une sauvegarde valide', () => {
    const r = parseBackup(JSON.stringify(sample()))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.counts).toMatchObject({ foods: 33, recipes: SAMPLE_RECIPES.length, settings: 1 })
  })
  it('refuse un fichier qui n\'est pas du JSON', () => {
    expect(parseBackup('pas du json')).toEqual({ ok: false, error: 'Ce fichier n\'est pas un JSON valide.' })
  })
  it('refuse un autre JSON', () => {
    expect(parseBackup('{"hello":1}').ok).toBe(false)
  })
  it('refuse une version future', () => {
    const r = parseBackup(JSON.stringify({ ...sample(), version: 99 }))
    expect(r.ok === false && r.error).toContain('plus récente')
  })
  it('refuse des données abîmées', () => {
    const b = sample(); b.data.foods[0] = { ...b.data.foods[0], kcal: 'beaucoup' as unknown as number }
    expect(parseBackup(JSON.stringify(b)).ok).toBe(false)
    const c = sample(); c.data.settings = []
    expect(parseBackup(JSON.stringify(c)).ok).toBe(false)
  })
})

describe('utilitaires', () => {
  it('nomme le fichier avec la date', () => {
    expect(backupFileName(new Date(2026, 10, 7))).toBe('myfoodtrackr-2026-11-07.json')
  })
  it('compte les jours depuis le dernier export', () => {
    expect(daysSince(undefined)).toBeNull()
    expect(daysSince(Date.UTC(2026, 10, 10), Date.UTC(2026, 10, 17, 12))).toBe(7)
  })
})

describe('aller-retour en base', () => {
  it('exporte puis réimporte à l\'identique', async () => {
    const a = new FoodTrackDB('a-' + Math.random())
    await a.foods.put({ ...initialFoods()[0], id: 'perso-x', name: 'Harira', custom: true })
    await a.logEntries.add({ id: 'l1', date: '2026-11-17', name: 'Test', macros: { kcal: 100, protein: 10, carbs: 5, fat: 3 }, createdAt: 1 })
    const backup = await exportAll(a)
    const b = new FoodTrackDB('b-' + Math.random())
    await b.recipes.clear()
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    await importAll(b, parsed.backup)
    expect(await b.foods.count()).toBe(33 + PACK_FOODS.length + PACK3_FOODS.length + 1)
    expect((await b.foods.get('perso-x'))?.name).toBe('Harira')
    expect(await b.recipes.count()).toBe(SAMPLE_RECIPES.length + PACK_RECIPES.length + PACK3_RECIPES.length)
    expect((await b.logEntries.get('l1'))?.macros.kcal).toBe(100)
    a.close(); b.close()
  })
})
