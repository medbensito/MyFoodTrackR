import { describe, expect, it } from 'vitest'
import { initialFoods } from '../db/seed'
import { SAMPLE_RECIPES } from '../db/sampleRecipes'
import { buildShoppingList, formatGrams, roundForShopping, shoppingText } from './shopping'

const foods = new Map(initialFoods().map((f) => [f.id, f]))
const recipes = new Map(SAMPLE_RECIPES.map((r) => [r.id, r]))

describe('arrondis', () => {
  it('arrondit au-dessus', () => {
    expect(roundForShopping(0)).toBe(0)
    expect(roundForShopping(12)).toBe(15)
    expect(roundForShopping(187.5)).toBe(190)
  })
  it('formate en kg', () => {
    expect(formatGrams(450)).toBe('450 g')
    expect(formatGrams(1000)).toBe('1 kg')
    expect(formatGrams(1250)).toBe('1,25 kg')
    expect(formatGrams(1500)).toBe('1,5 kg')
  })
})

describe('buildShoppingList', () => {
  it('additionne les grammes selon les portions', () => {
    const { groups, itemCount } = buildShoppingList([
      { recipeId: 'ex-poulet-riz-brocoli', portionFactor: 1 },
      { recipeId: 'ex-poulet-riz-brocoli', portionFactor: 1.5 },
      { recipeId: 'ex-couscous-poulet', portionFactor: 1 },
    ], recipes, foods)
    const all = groups.flatMap((g) => g.items)
    const poulet = all.find((i) => i.food.id === 'poulet-blanc-cuit')!
    expect(poulet.grams).toBe(530) // 525 g arrondi au-dessus
    expect(poulet.uses).toBe(3)
    expect(all.find((i) => i.food.id === 'riz-blanc-cru')!.grams).toBe(230) // 225 arrondi
    expect(itemCount).toBe(all.length)
  })

  it('compte les œufs à la pièce', () => {
    const { groups } = buildShoppingList([
      { recipeId: 'ex-omelette-pain', portionFactor: 1 },
      { recipeId: 'ex-lentilles-oeufs', portionFactor: 1 },
    ], recipes, foods)
    const oeufs = groups.flatMap((g) => g.items).find((i) => i.food.id === 'oeuf-entier')!
    expect(oeufs.count).toEqual({ n: 5, label: 'œufs' })
  })

  it('range par rayon et ignore les recettes supprimées', () => {
    const r = buildShoppingList([{ recipeId: 'ex-saumon-pdt', portionFactor: 1 }, { recipeId: 'inconnue', portionFactor: 1 }], recipes, foods)
    expect(r.missingRecipes).toBe(1)
    expect(r.groups.map((g) => g.key)).toEqual(['legumes', 'proteines', 'feculents'])
  })

  it('produit une version texte sans les articles cochés', () => {
    const { groups } = buildShoppingList([{ recipeId: 'ex-yaourt-amandes', portionFactor: 1 }], recipes, foods)
    const txt = shoppingText('Courses', groups, new Set(['amandes']))
    expect(txt).toContain('CRÈMERIE')
    expect(txt).toContain('Yaourt grec 0 % — 200 g')
    expect(txt).not.toContain('Amandes')
  })
})
