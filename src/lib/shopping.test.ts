import { describe, expect, it } from 'vitest'
import { initialFoods } from '../db/seed'
import { SAMPLE_RECIPES } from '../db/sampleRecipes'
import { buildShoppingList, formatGrams, roundForShopping, shoppingText, shoppingTotal } from './shopping'
import { PRICES } from '../db/prices'

const foods = new Map(initialFoods().map((f) => [f.id, { ...f, pricePerKg: PRICES[f.id] }]))
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
    expect(poulet.grams).toBe(390) // 110 × 2,5 + 110 = 385 g, arrondi au-dessus
    expect(poulet.uses).toBe(3)
    expect(all.find((i) => i.food.id === 'riz-blanc-cru')!.grams).toBe(250)
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
  it('donne le poids à acheter et le coût', () => {
    const { groups } = buildShoppingList([{ recipeId: 'ex-poulet-riz-brocoli', portionFactor: 1 }], recipes, foods)
    const all = groups.flatMap((g) => g.items)
    const poulet = all.find((i) => i.food.id === 'poulet-blanc-cuit')!
    expect(poulet.buy).toEqual({ grams: 150, form: 'cru' }) // 110 g cuits → 148,5 g crus
    expect(poulet.cost).toBeCloseTo(0.11 * 1.35 * 50)
    const t = shoppingTotal(groups)
    expect(t.unpriced).toBe(0)
    expect(t.total).toBeGreaterThan(10)
    expect(shoppingTotal(groups, new Set(['poulet-blanc-cuit'])).total).toBeCloseTo(t.total - poulet.cost!)
    expect(shoppingText('Courses', groups, new Set())).toContain('Poulet, blanc cuit sans peau — 150 g cru (pour 110 g cuits)')
  })
})
