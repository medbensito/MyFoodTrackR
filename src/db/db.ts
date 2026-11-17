import Dexie, { type EntityTable } from 'dexie'
import type { DayOverride, Food, LogEntry, PlannedMeal, Recipe, Settings, ShoppingCheck } from '../types'
import { DEFAULT_SETTINGS } from '../lib/targets'
import { initialFoods } from './seed'
import { SAMPLE_RECIPES } from './sampleRecipes'

export class FoodTrackDB extends Dexie {
  foods!: EntityTable<Food, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  plannedMeals!: EntityTable<PlannedMeal, 'id'>
  logEntries!: EntityTable<LogEntry, 'id'>
  settings!: EntityTable<Settings, 'id'>
  shoppingChecks!: EntityTable<ShoppingCheck, 'id'>
  dayOverrides!: EntityTable<DayOverride, 'date'>

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

    // Exécuté une seule fois, à la création de la base sur l'appareil.
    this.on('populate', async (tx) => {
      await tx.table('foods').bulkAdd(initialFoods())
      await tx.table('recipes').bulkAdd(SAMPLE_RECIPES)
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
