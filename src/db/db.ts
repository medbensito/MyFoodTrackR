import Dexie, { type EntityTable } from 'dexie'
import type { DayOverride, Food, LogEntry, PlannedMeal, Recipe, Settings, ShoppingCheck, WeighIn } from '../types'
import { DEFAULT_SETTINGS } from '../lib/targets'
import { initialFoods } from './seed'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from './pack'
import { LEGACY_V4 } from './legacyRecipes'

export class FoodTrackDB extends Dexie {
  foods!: EntityTable<Food, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  plannedMeals!: EntityTable<PlannedMeal, 'id'>
  logEntries!: EntityTable<LogEntry, 'id'>
  settings!: EntityTable<Settings, 'id'>
  shoppingChecks!: EntityTable<ShoppingCheck, 'id'>
  dayOverrides!: EntityTable<DayOverride, 'date'>
  weighIns!: EntityTable<WeighIn, 'date'>

  constructor(name = 'myfoodtrackr') {
    super(name)
    this.version(1).stores({
      foods: 'id, name, category, verified',
      recipes: 'id, name, *slots',
      plannedMeals: 'id, date, [date+slot]',
      logEntries: 'id, date',
      settings: 'id',
    })

    // v2 (M1) : ajoute les recettes d'exemple aux bases créées en M0,
    // et complète les réglages avec le nom et l'objectif.
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        if ((await tx.table('recipes').count()) === 0) {
          await tx.table('recipes').bulkAdd(SAMPLE_RECIPES)
        }
        await tx.table('settings').toCollection().modify((s: Settings) => {
          if (!s.name) s.name = DEFAULT_SETTINGS.name
          if (!s.goal) s.goal = DEFAULT_SETTINGS.goal
        })
      })

    // v3 (v2 de l'app) : cases de la liste de courses, exceptions de séance.
    this.version(3).stores({
      shoppingChecks: 'id',
      dayOverrides: 'date',
    })

    // v4 : pack de recettes protéinées. N'ajoute que ce qui manque, sans toucher aux données existantes.
    this.version(4)
      .stores({})
      .upgrade(async (tx) => {
        const foods = tx.table('foods'), recipes = tx.table('recipes')
        const haveF = new Set(await foods.toCollection().primaryKeys())
        const haveR = new Set(await recipes.toCollection().primaryKeys())
        await foods.bulkAdd(PACK_FOODS.filter((x) => !haveF.has(x.id)))
        await recipes.bulkAdd(PACK_RECIPES.filter((x) => !haveR.has(x.id)))
      })

    // v5 : recettes rééquilibrées (moins de protéines, plus de féculents).
    // Une recette n'est remplacée que si l'utilisateur ne l'a pas modifiée.
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table('recipes')
        const current = new Map([...SAMPLE_RECIPES, ...PACK_RECIPES].map((x) => [x.id, x]))
        for (const [id, old] of Object.entries(LEGACY_V4)) {
          const stored = await table.get(id) as Recipe | undefined
          const next = current.get(id)
          if (!stored || !next) continue
          const same = JSON.stringify([stored.name, stored.servings, stored.slots, stored.ingredients])
            === JSON.stringify([old.name, old.servings, old.slots, old.ingredients])
          if (same) await table.put({ ...next, favorite: stored.favorite })
        }
      })

    // v6 : pesées pour les cibles adaptatives.
    this.version(6).stores({ weighIns: 'date' })
    // v3.3 : aliments scannés, retrouvés par leur code-barres.
    this.version(7).stores({ foods: 'id, name, category, verified, barcode' })

    // Exécuté une seule fois, à la création de la base sur l'appareil.
    this.on('populate', async (tx) => {
      await tx.table('foods').bulkAdd([...initialFoods(), ...PACK_FOODS])
      await tx.table('recipes').bulkAdd([...SAMPLE_RECIPES, ...PACK_RECIPES])
      await tx.table('settings').add(DEFAULT_SETTINGS)
    })
  }
}

export const db = new FoodTrackDB()

/** Recettes qui utilisent un aliment (pour empêcher une suppression qui casserait des recettes). */
export async function recipesUsingFood(foodId: string): Promise<Recipe[]> {
  const all = await db.recipes.toArray()
  return all.filter((r) => r.ingredients.some((i) => i.foodId === foodId))
}
