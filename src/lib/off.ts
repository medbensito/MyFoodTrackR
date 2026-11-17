import type { Food, FoodState } from '../types'

/** Codes-barres alimentaires : EAN-13, EAN-8, UPC-A (12 chiffres). */
export function isValidBarcode(raw: string): boolean {
  const code = raw.trim()
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()!
  // Poids 3 sur le chiffre le plus à droite (hors clé), puis alternance 1/3.
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

/** Un UPC-A lu en EAN-13 commence par 0 : on ramène les deux formes au même code. */
export function normalizeBarcode(raw: string): string {
  const code = raw.trim()
  return code.length === 12 ? `0${code}` : code
}

export const OFF_FIELDS = 'product_name,product_name_fr,generic_name_fr,brands,quantity,serving_size,serving_quantity,categories_tags,nutriments'
export const offUrl = (code: string) => `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`

type OffNutriments = Record<string, number | string | undefined>
export type OffProduct = {
  product_name?: string
  product_name_fr?: string
  generic_name_fr?: string
  brands?: string
  quantity?: string
  serving_size?: string
  serving_quantity?: number | string
  categories_tags?: string[]
  nutriments?: OffNutriments
}

/** Brouillon d'aliment tiré d'Open Food Facts ; `missing` liste les valeurs absentes de la fiche. */
export type FoodDraft = Omit<Food, 'id'> & { barcode: string; missing: ('kcal' | 'protein' | 'carbs' | 'fat')[] }

const CATEGORY_RULES: [RegExp, string][] = [
  [/protein-powders|dietary-supplements|bodybuilding/, 'complements'],
  [/dairies|yogurts|cheeses|milks|fromages/, 'laitier'],
  [/meats|fishes|seafood|eggs|poultr|tunas|sardines/, 'proteines'],
  [/nuts|almonds|peanut|seeds/, 'oleagineux'],
  [/fats|oils|butters/, 'matieres-grasses'],
  [/pastas|rices|cereals|breads|flours|oat|semolina|couscous|legumes-and-their-products|pulses/, 'feculents'],
  [/fruits|dates/, 'fruits'],
  [/vegetables/, 'legumes'],
]

function category(tags: string[]): string {
  const t = tags.join(' ')
  return CATEGORY_RULES.find(([re]) => re.test(t))?.[1] ?? 'autre'
}

function state(tags: string[]): FoodState {
  const t = tags.join(' ')
  if (/beverages|drinks|milks/.test(t)) return 'liquide'
  if (/canned/.test(t)) return 'conserve'
  if (/dried|pastas|rices|flours|cereals/.test(t)) return 'sec'
  return 'nature'
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}
const r1 = (n: number) => Math.round(n * 10) / 10

export function offToDraft(code: string, p: OffProduct): FoodDraft {
  const n = p.nutriments ?? {}
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g'])
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== null ? kj / 4.184 : null)
  const protein = num(n.proteins_100g), carbs = num(n.carbohydrates_100g), fat = num(n.fat_100g)
  const missing = ([['kcal', kcal], ['protein', protein], ['carbs', carbs], ['fat', fat]] as const)
    .filter(([, v]) => v === null).map(([k]) => k)

  const base = (p.product_name_fr || p.product_name || p.generic_name_fr || '').trim()
  const brand = (p.brands ?? '').split(',')[0].trim()
  const name = base && brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${base} (${brand})` : base || brand
  const serving = num(p.serving_quantity)
  const tags = p.categories_tags ?? []

  return {
    name,
    category: category(tags),
    state: state(tags),
    kcal: kcal === null ? NaN : Math.round(kcal),
    protein: protein === null ? NaN : r1(protein),
    carbs: carbs === null ? NaN : r1(carbs),
    fat: fat === null ? NaN : r1(fat),
    defaultPortionG: serving && serving > 0 && serving <= 1000 ? Math.round(serving) : 100,
    source: 'Open Food Facts',
    verified: false,
    custom: true,
    barcode: code,
    missing,
  }
}

export type LookupResult =
  | { status: 'found'; draft: FoodDraft }
  | { status: 'not-found' }
  | { status: 'offline' }
  | { status: 'error' }

export async function lookupOff(code: string, fetchFn: typeof fetch = fetch, timeoutMs = 8000): Promise<LookupResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetchFn(offUrl(code), { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (res.status === 404) return { status: 'not-found' }
    if (!res.ok) return { status: 'error' }
    const json = await res.json() as { status?: number; product?: OffProduct }
    if (json.status !== 1 || !json.product) return { status: 'not-found' }
    const draft = offToDraft(code, json.product)
    return draft.name ? { status: 'found', draft } : { status: 'not-found' }
  } catch {
    return { status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error' }
  } finally {
    clearTimeout(timer)
  }
}
