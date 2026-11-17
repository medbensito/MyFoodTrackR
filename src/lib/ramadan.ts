import type { MealSlot, RamadanSettings, Settings } from '../types'
import { SLOT_LABEL, SLOT_ORDER, SLOT_SHORT, SLOT_THE } from './nutrition'
import { POST_TRAINING_SLOT } from './planner'

/** Dates prévisionnelles (calculs astronomiques) : à confirmer par l'annonce officielle du ministère des Habous. */
export const DEFAULT_RAMADAN: RamadanSettings = { enabled: false, start: '2027-02-08', end: '2027-03-09', session: 'before-ftour' }

export function isRamadan(iso: string, settings: Pick<Settings, 'ramadan'>): boolean {
  const r = settings.ramadan
  return !!r?.enabled && iso >= r.start && iso <= r.end
}

/** Jour du jeûne (1 = premier jour), ou null hors Ramadan. */
export function ramadanDay(iso: string, settings: Pick<Settings, 'ramadan'>): number | null {
  if (!isRamadan(iso, settings)) return null
  const t = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(iso) - t(settings.ramadan!.start)) / 86_400_000) + 1
}

export type SlotNames = {
  label: Record<MealSlot, string>
  short: Record<MealSlot, string>
  the: Record<MealSlot, string>
  /** Ordre dans la journée. */
  order: MealSlot[]
}

const RAMADAN_NAMES: SlotNames = {
  // Les clés internes ne changent pas : les recettes « petit-déjeuner » servent au s'hour, « déjeuner » au ftour.
  // Ordre du jour calendaire : le s'hour (avant l'aube) ouvre la journée, le dîner la ferme.
  label: { breakfast: "S'hour", lunch: 'Ftour', snack: 'Collation du soir', dinner: 'Dîner' },
  short: { breakfast: "S'hour", lunch: 'Ftour', snack: 'Collation', dinner: 'Dîner' },
  the: { breakfast: "Le s'hour", lunch: 'Le ftour', snack: 'La collation', dinner: 'Le dîner' },
  order: ['breakfast', 'lunch', 'snack', 'dinner'],
}
const DEFAULT_NAMES: SlotNames = { label: SLOT_LABEL, short: SLOT_SHORT, the: SLOT_THE, order: SLOT_ORDER }

export function slotNames(iso: string, settings: Pick<Settings, 'ramadan'>): SlotNames {
  return isRamadan(iso, settings) ? RAMADAN_NAMES : DEFAULT_NAMES
}

/** Repas qui reçoit le supplément d'entraînement ce jour-là. */
export function postTrainingSlot(iso: string, settings: Pick<Settings, 'ramadan' | 'trainingTime'>): MealSlot | null {
  if (!isRamadan(iso, settings)) return POST_TRAINING_SLOT[settings.trainingTime]
  const s = settings.ramadan!.session
  return s === 'before-ftour' ? 'lunch' : s === 'after-ftour' ? 'dinner' : null
}

/** Créneau proposé selon l'heure, en tenant compte du Ramadan. */
export function slotAt(date: Date, iso: string, settings: Pick<Settings, 'ramadan'>): MealSlot {
  const h = date.getHours()
  if (isRamadan(iso, settings)) {
    if (h < 7) return 'breakfast'
    if (h >= 17 && h < 21) return 'lunch'
    if (h >= 21) return 'dinner'
    return 'snack'
  }
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}
