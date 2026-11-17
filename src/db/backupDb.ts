import type { FoodTrackDB } from './db'
import { buildBackup, type Backup } from '../lib/backup'

export async function exportAll(db: FoodTrackDB): Promise<Backup> {
  const [foods, recipes, plannedMeals, logEntries, settings] = await Promise.all([
    db.foods.toArray(), db.recipes.toArray(), db.plannedMeals.toArray(), db.logEntries.toArray(), db.settings.toArray(),
  ])
  return buildBackup({ foods, recipes, plannedMeals, logEntries, settings })
}

/** Remplace toutes les données par celles de la sauvegarde, en une seule transaction. */
export async function importAll(db: FoodTrackDB, backup: Backup): Promise<void> {
  const d = backup.data
  await db.transaction('rw', [db.foods, db.recipes, db.plannedMeals, db.logEntries, db.settings], async () => {
    await Promise.all([db.foods.clear(), db.recipes.clear(), db.plannedMeals.clear(), db.logEntries.clear(), db.settings.clear()])
    await db.foods.bulkPut(d.foods)
    await db.recipes.bulkPut(d.recipes)
    await db.plannedMeals.bulkPut(d.plannedMeals)
    await db.logEntries.bulkPut(d.logEntries)
    await db.settings.bulkPut(d.settings)
  })
}
