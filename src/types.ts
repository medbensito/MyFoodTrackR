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
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type Recipe = {
  id: string
  name: string
  servings: number
  slots: MealSlot[]
  ingredients: { foodId: string; grams: number }[]
  notes?: string
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
}
