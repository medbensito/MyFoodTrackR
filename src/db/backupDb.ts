import type { FoodTrackDB } from './db'
import { buildBackup, type Backup } from '../lib/backup'

export async function exportAll(db: FoodTrackDB): Promise<Backup> {
  const [foods, recipes, plannedMeals, logEntries, settings, dayOverrides, shoppingChecks, weighIns] = await Promise.all([
    db.foods.toArray(), db.recipes.toArray(), db.plannedMeals.toArray(), db.logEntries.toArray(), db.settings.toArray(),
    db.dayOverrides.toArray(), db.shoppingChecks.toArray(), db.weighIns.toArray(),
  ])
  return buildBackup({ foods, recipes, plannedMeals, logEntries, settings, dayOverrides, shoppingChecks, weighIns })
}

/** Remplace toutes les données par celles de la sauvegarde, en une seule transaction. */
export async function importAll(db: FoodTrackDB, backup: Backup): Promise<void> {
  const d = backup.data
  const tables = [db.foods, db.recipes, db.plannedMeals, db.logEntries, db.settings, db.dayOverrides, db.shoppingChecks, db.weighIns]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await db.foods.bulkPut(d.foods)
    await db.recipes.bulkPut(d.recipes)
    await db.plannedMeals.bulkPut(d.plannedMeals)
    await db.logEntries.bulkPut(d.logEntries)
    await db.settings.bulkPut(d.settings)
    if (d.dayOverrides) await db.dayOverrides.bulkPut(d.dayOverrides)
    if (d.shoppingChecks) await db.shoppingChecks.bulkPut(d.shoppingChecks)
    if (d.weighIns) await db.weighIns.bulkPut(d.weighIns)
  })
}
