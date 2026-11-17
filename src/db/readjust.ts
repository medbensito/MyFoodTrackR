import { db } from './db'
import type { Settings } from '../types'
import type { PlannerRecipe } from '../lib/planner'
import { generateWeek } from '../lib/planner'
import { newId } from '../lib/nutrition'
import { postTrainingSlot } from '../lib/ramadan'
import type { WeekTargets } from './useWeek'

/**
 * Recompose les repas pas encore mangés ni épinglés des jours donnés (déjà planifiés),
 * selon les cibles de la semaine. Renvoie le nombre de repas recomposés.
 */
export async function readjustDays(days: string[], settings: Settings, recipes: PlannerRecipe[], week: WeekTargets): Promise<number> {
  const [meals, logs] = await Promise.all([
    db.plannedMeals.where('date').anyOf(days).toArray(),
    db.logEntries.where('date').anyOf(days).toArray(),
  ])
  const eaten = new Set(logs.map((l) => l.fromPlannedMealId).filter(Boolean))
  const keep = meals.filter((m) => m.pinned || eaten.has(m.id))
  const keepIds = new Set(keep.map((m) => m.id))
  const movable = meals.filter((m) => !keepIds.has(m.id))
  const planned = days.filter((d) => meals.some((m) => m.date === d))
  if (movable.length === 0 || planned.length === 0) return 0

  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
  const res = generateWeek({
    dates: planned,
    trainingDates: new Set(planned.filter(week.isTraining)),
    settings,
    recipes,
    pinned: keep.map((m) => ({ ...m, pinned: true })),
    postSlotFor: (d) => postTrainingSlot(d, settings),
    targetFor: week.planTargetFor,
  }, seed)
  const fresh = res.meals.filter((m) => !keepIds.has(m.id)).map((m) => ({ ...m, id: newId('pm'), pinned: false }))
  await db.transaction('rw', db.plannedMeals, async () => {
    await db.plannedMeals.bulkDelete(movable.map((m) => m.id))
    await db.plannedMeals.bulkPut(fresh)
  })
  return fresh.length
}
