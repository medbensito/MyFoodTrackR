import { describe, expect, it } from 'vitest'
import type { Food } from '../types'
import { fmtMinutes, stepFromEditable, stepText, stepToEditable } from './steps'

const recipe = { servings: 1, ingredients: [{ foodId: 'poulet-blanc-cuit', grams: 110 }, { foodId: 'riz-blanc-cru', grams: 100 }, { foodId: 'oeuf-entier', grams: 150 }] }
const foods = new Map<string, Food>([
  ['poulet-blanc-cuit', { id: 'poulet-blanc-cuit', name: 'Blanc de poulet cuit' } as Food],
  ['riz-blanc-cru', { id: 'riz-blanc-cru', name: 'Riz blanc cru' } as Food],
])

describe('étapes', () => {
  it('affiche les quantités selon la portion', () => {
    expect(stepText('Rince {riz-blanc-cru} de riz.', recipe)).toBe('Rince 100 g de riz.')
    expect(stepText('Rince {riz-blanc-cru} de riz.', recipe, 1.5)).toBe('Rince 150 g de riz.')
    expect(stepText('Pèse {poulet-blanc-cuit*1.35} de poulet cru.', recipe)).toBe('Pèse ≈ 150 g de poulet cru.')
    expect(stepText('Verse {riz-blanc-cru*1.9 ml} d\'eau.', recipe, 1.25)).toBe('Verse ≈ 240 ml d\'eau.')
    expect(stepText('Bats {oeuf-entier}.', recipe)).toBe('Bats 3 œufs.')
    expect(stepText('Bats {oeuf-entier}.', recipe, 0.5)).toBe('Bats 1,5 œuf.')
    expect(stepText('Ajoute {inconnu} sel.', recipe)).toBe('Ajoute  sel.')
  })

  it('passe par un texte lisible dans l\'éditeur, aller et retour', () => {
    const s = 'Pèse {poulet-blanc-cuit*1.35} de poulet, puis {riz-blanc-cru*1.9 ml} d\'eau.'
    const e = stepToEditable(s, foods)
    expect(e).toBe('Pèse [Blanc de poulet cuit ×1,35] de poulet, puis [Riz blanc cru ×1,9 ml] d\'eau.')
    expect(stepFromEditable(e, recipe.ingredients, foods)).toBe(s)
    expect(stepFromEditable('[Tomate] et [riz blanc cru]', recipe.ingredients, foods)).toBe('[Tomate] et {riz-blanc-cru}')
  })

  it('formate les durées', () => {
    expect(fmtMinutes(35)).toBe('35 min')
    expect(fmtMinutes(75)).toBe('1 h 15')
    expect(fmtMinutes(60)).toBe('1 h')
  })
})
