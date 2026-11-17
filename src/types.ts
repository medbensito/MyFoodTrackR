export type FoodState = 'cru' | 'cuit' | 'conserve' | 'liquide' | 'solide' | 'nature' | 'sec'

export type Food = {
  id: string
  name: string
  category: string
  state: FoodState
  /** Valeurs pour 100 g */
  kcal: number
  protein: number
  carbs: number
  fat: number
  defaultPortionG: number
  source: string
  verified: boolean
  custom: boolean
  favorite?: boolean
  /** EAN / UPC du produit scanné. */
  barcode?: string
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type Recipe = {
  id: string
  name: string
  servings: number
  slots: MealSlot[]
  ingredients: { foodId: string; grams: number }[]
  notes?: string
  favorite?: boolean
  /** Minutes de préparation (épluchage, découpe, marinade active). */
  prepMin?: number
  /** Minutes de cuisson (dont mijotage). */
  cookMin?: number
  /** Matériel utile : poêle, cocotte… */
  tools?: string[]
  /**
   * Étapes pour 1 portion. `{foodId}` affiche la quantité de l'ingrédient selon la portion ;
   * `{foodId*1.35}` une quantité dérivée (poids cru, eau…) ; `{foodId*1.9 ml}` dans une autre unité.
   */
  steps?: string[]
  tips?: string[]
}

export type PlannedMeal = {
  id: string
  /** ISO yyyy-mm-dd */
  date: string
  slot: MealSlot
  recipeId: string
  portionFactor: number
  pinned: boolean
}

export type LogEntry = {
  id: string
  date: string
  slot?: MealSlot
  recipeId?: string
  foodId?: string
  grams?: number
  portionFactor?: number
  fromPlannedMealId?: string
  /** Instantané au moment de la saisie : le journal ne change pas si la recette est modifiée ensuite. */
  name: string
  macros: Macros
  /** Horodatage de saisie (ms), pour l'ordre d'affichage. */
  createdAt: number
}

export type Macros = { kcal: number; protein: number; carbs: number; fat: number }

export type TrainingTime = 'morning' | 'noon' | 'evening'

export type Settings = {
  id: 'main'
  name: string
  goal: 'recomposition' | 'perte' | 'prise'
  weightKg: number
  heightCm: number
  age: number
  /** 0 = dimanche … 6 = samedi */
  trainingDays: number[]
  trainingTime: TrainingTime
  targets: { rest: Macros; training: Macros }
  maxRepeatsPerWeekPerSlot: number
  /** Date du dernier export de sauvegarde (ms). */
  lastExportAt?: number
  /** Date du dernier ajustement des cibles accepté (ms). */
  lastAdjustAt?: number
  ramadan?: RamadanSettings
}

export type RamadanSession = 'before-ftour' | 'after-ftour' | 'none'
export type RamadanSettings = { enabled: boolean; start: string; end: string; session: RamadanSession }

/** Case cochée de la liste de courses : id = `${période}|${foodId}`. */
export type ShoppingCheck = { id: string; checked: boolean }

/** Exception ponctuelle au rythme d'entraînement (séance sautée ou ajoutée). */
export type DayOverride = { date: string; training: boolean }

/** Pesée : une par jour au plus. */
export type WeighIn = { date: string; kg: number }
