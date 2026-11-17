import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useFoodsMap } from './hooks'
import { recipeTotals } from '../lib/nutrition'
import type { PlannerRecipe } from '../lib/planner'

/** Recettes avec leurs macros par portion, prêtes pour le moteur de planning. */
export function usePlannerRecipes(): { list: PlannerRecipe[]; byId: Map<string, PlannerRecipe> } | undefined {
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const foods = useFoodsMap()
  return useMemo(() => {
    if (!recipes || !foods) return undefined
    const list = recipes.map((r) => ({ id: r.id, name: r.name, slots: r.slots, perServing: recipeTotals(r, foods).perServing, favorite: !!r.favorite }))
    return { list, byId: new Map(list.map((r) => [r.id, r])) }
  }, [recipes, foods])
}
