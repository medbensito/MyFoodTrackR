import Dexie, { type EntityTable } from 'dexie'
import type { Food, LogEntry, PlannedMeal, Recipe, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../lib/targets'
import { initialFoods } from './seed'

export class FoodTrackDB extends Dexie {
  foods!: EntityTable<Food, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  plannedMeals!: EntityTable<PlannedMeal, 'id'>
  logEntries!: EntityTable<LogEntry, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor(name = 'myfoodtrackr') {
    super(name)
    this.version(1).stores({
      foods: 'id, name, category, verified',
      recipes: 'id, name, *slots',
      plannedMeals: 'id, date, [date+slot]',
      logEntries: 'id, date',
      settings: 'id',
    })

    // Exécuté une seule fois, à la création de la base sur l'appareil.
    this.on('populate', async (tx) => {
      await tx.table('foods').bulkAdd(initialFoods())
      await tx.table('settings').add(DEFAULT_SETTINGS)
    })
  }
}

export const db = new FoodTrackDB()
