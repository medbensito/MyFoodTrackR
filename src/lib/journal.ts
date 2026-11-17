import type { Food, LogEntry, Macros, MealSlot, PlannedMeal } from '../types'
import { addMacros, macrosForGrams, newId, scaleMacros, ZERO } from './nutrition'
import type { PlannerRecipe } from './planner'

export function entryFromPlanned(meal: PlannedMeal, recipe: PlannerRecipe, now = Date.now()): LogEntry {
  return {
    id: newId('log'),
    date: meal.date,
    slot: meal.slot,
    recipeId: recipe.id,
    portionFactor: meal.portionFactor,
    fromPlannedMealId: meal.id,
    name: recipe.name,
    macros: scaleMacros(recipe.perServing, meal.portionFactor),
    createdAt: now,
  }
}

export function entryFromRecipe(date: string, slot: MealSlot, recipe: PlannerRecipe, portionFactor: number, now = Date.now()): LogEntry {
  return {
    id: newId('log'), date, slot, recipeId: recipe.id, portionFactor,
    name: recipe.name, macros: scaleMacros(recipe.perServing, portionFactor), createdAt: now,
  }
}

export function entryFromFood(date: string, slot: MealSlot, food: Food, grams: number, now = Date.now()): LogEntry {
  return {
    id: newId('log'), date, slot, foodId: food.id, grams,
    name: food.name, macros: macrosForGrams(food, grams), createdAt: now,
  }
}

export function totalOf(entries: Pick<LogEntry, 'macros'>[]): Macros {
  return entries.reduce((acc, e) => addMacros(acc, e.macros ?? ZERO), ZERO)
}

/** Créneau proposé par défaut selon l'heure. */
export function slotForHour(hour: number): MealSlot {
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

/** Message court sur ce qu'il reste à manger, protéines en priorité. */
export function remainingLabel(consumed: Macros, target: Macros): string {
  const p = Math.round(target.protein - consumed.protein)
  const k = Math.round(target.kcal - consumed.kcal)
  if (p <= 0 && Math.abs(k) <= target.kcal * 0.05) return 'Objectif atteint pour aujourd\'hui.'
  const parts: string[] = []
  if (p > 0) parts.push(`${p} g de protéines`)
  if (k > 0) parts.push(`${k} kcal`)
  if (parts.length === 0) return `Calories dépassées de ${-k} kcal.`
  return `Il te reste ${parts.join(' et ')}.`
}
