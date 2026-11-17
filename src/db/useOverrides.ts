import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Overrides } from '../lib/targets'

/** Exceptions de séance pour une liste de dates. */
export function useOverrides(dates: string[]): Overrides | undefined {
  return useLiveQuery(
    () => db.dayOverrides.where('date').anyOf(dates).toArray().then((os) => new Map(os.map((o) => [o.date, o.training]))),
    [dates.join()],
  )
}
