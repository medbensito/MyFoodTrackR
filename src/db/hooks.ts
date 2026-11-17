import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from './db'
import type { Food } from '../types'

export function useFoods(): Food[] | undefined {
  return useLiveQuery(() => db.foods.toArray().then((a) => a.sort((x, y) => x.name.localeCompare(y.name, 'fr'))), [])
}

export function useFoodsMap(): Map<string, Food> | undefined {
  const foods = useFoods()
  return useMemo(() => (foods ? new Map(foods.map((f) => [f.id, f])) : undefined), [foods])
}
