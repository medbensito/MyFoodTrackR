import type { DayOverride, Food, LogEntry, PlannedMeal, Recipe, Settings, ShoppingCheck, WeighIn } from '../types'

export const BACKUP_APP = 'MyFoodTrackR'
export const BACKUP_VERSION = 1

export type BackupData = {
  foods: Food[]
  recipes: Recipe[]
  plannedMeals: PlannedMeal[]
  logEntries: LogEntry[]
  settings: Settings[]
  /** Ajoutés en v2 de l'app : absents des sauvegardes plus anciennes. */
  dayOverrides?: DayOverride[]
  shoppingChecks?: ShoppingCheck[]
  /** Ajouté en v3 de l'app. */
  weighIns?: WeighIn[]
}

export type Backup = { app: string; version: number; exportedAt: string; data: BackupData }

export type BackupCounts = Record<'foods' | 'recipes' | 'plannedMeals' | 'logEntries' | 'settings', number>

export function buildBackup(data: BackupData, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
}

export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `myfoodtrackr-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`
}

export function countsOf(data: BackupData): BackupCounts {
  return {
    foods: data.foods.length,
    recipes: data.recipes.length,
    plannedMeals: data.plannedMeals.length,
    logEntries: data.logEntries.length,
    settings: data.settings.length,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const hasId = (v: unknown) => isObj(v) && typeof v.id === 'string' && v.id.length > 0
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

export type ParseResult =
  | { ok: true; backup: Backup; counts: BackupCounts }
  | { ok: false; error: string }

/** Lit et vérifie un fichier de sauvegarde avant tout remplacement des données. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return { ok: false, error: 'Ce fichier n\'est pas un JSON valide.' } }
  if (!isObj(raw) || raw.app !== BACKUP_APP) return { ok: false, error: 'Ce fichier n\'est pas une sauvegarde MyFoodTrackR.' }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'Cette sauvegarde vient d\'une version plus récente de l\'app. Mets l\'app à jour puis réessaie.' }
  }
  const d = raw.data
  if (!isObj(d)) return { ok: false, error: 'Sauvegarde incomplète : données manquantes.' }

  const keys = ['foods', 'recipes', 'plannedMeals', 'logEntries', 'settings'] as const
  for (const k of keys) {
    if (!Array.isArray(d[k])) return { ok: false, error: `Sauvegarde incomplète : « ${k} » manquant.` }
    if (!(d[k] as unknown[]).every(hasId)) return { ok: false, error: `Sauvegarde abîmée : un élément de « ${k} » n'a pas d'identifiant.` }
  }
  const data = d as unknown as BackupData

  if (!data.foods.every((f) => typeof f.name === 'string' && num(f.kcal) && num(f.protein) && num(f.carbs) && num(f.fat))) {
    return { ok: false, error: 'Sauvegarde abîmée : un aliment a des valeurs invalides.' }
  }
  if (!data.recipes.every((r) => typeof r.name === 'string' && Array.isArray(r.ingredients) && Array.isArray(r.slots))) {
    return { ok: false, error: 'Sauvegarde abîmée : une recette est invalide.' }
  }
  if (!data.logEntries.every((e) => isObj(e.macros) && num(e.macros.kcal))) {
    return { ok: false, error: 'Sauvegarde abîmée : une entrée du journal est invalide.' }
  }
  for (const k of ['dayOverrides', 'shoppingChecks', 'weighIns'] as const) {
    if (d[k] !== undefined && !Array.isArray(d[k])) return { ok: false, error: `Sauvegarde abîmée : « ${k} » invalide.` }
  }
  if (!data.settings.some((s) => s.id === 'main')) return { ok: false, error: 'Sauvegarde incomplète : réglages manquants.' }

  return { ok: true, backup: raw as unknown as Backup, counts: countsOf(data) }
}

export function daysSince(ts: number | undefined, now = Date.now()): number | null {
  if (!ts) return null
  return Math.floor((now - ts) / 86_400_000)
}
