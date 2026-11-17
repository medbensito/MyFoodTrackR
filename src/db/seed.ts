import type { Food, FoodState } from '../types'
import rawBase from '../data/base_aliments_v1.json'

type RawFood = {
  id: string
  nom: string
  categorie: string
  etat: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  portion_defaut_g: number
  source: string
  verifie: boolean
}

export function mapRawFood(raw: RawFood): Food {
  return {
    id: raw.id,
    name: raw.nom,
    category: raw.categorie,
    state: raw.etat as FoodState,
    kcal: raw.kcal,
    protein: raw.proteines,
    carbs: raw.glucides,
    fat: raw.lipides,
    defaultPortionG: raw.portion_defaut_g,
    source: raw.source,
    verified: raw.verifie,
    custom: false,
  }
}

export function initialFoods(): Food[] {
  return (rawBase.aliments as RawFood[]).map(mapRawFood)
}
