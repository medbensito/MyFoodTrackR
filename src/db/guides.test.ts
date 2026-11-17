import { describe, expect, it } from 'vitest'
import { GUIDES, withGuide } from './guides'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { PACK_RECIPES } from './pack'

describe('fiches de préparation', () => {
  const seeds = [...SAMPLE_RECIPES, ...PACK_RECIPES]
  it('couvre toutes les recettes fournies', () => {
    expect(Object.keys(GUIDES).sort()).toEqual(seeds.map((r) => r.id).sort())
  })
  it("ne cite que des ingrédients de la recette, et s'applique à chacune", () => {
    for (const r of seeds) {
      const g = GUIDES[r.id]
      const ids = new Set(r.ingredients.map((i) => i.foodId))
      for (const [, id] of [...g.steps, ...(g.tips ?? [])].join(' ').matchAll(/\{([a-z0-9-]+)/g)) expect(ids, `${r.id} cite ${id}`).toContain(id)
      expect(withGuide(r).steps, r.id).toEqual(g.steps)
      expect(g.steps.length, r.id).toBeGreaterThanOrEqual(3)
    }
  })
  it("cite chaque ingrédient au moins une fois", () => {
    for (const r of seeds) {
      const text = [...GUIDES[r.id].steps].join(' ')
      for (const i of r.ingredients) expect(text, `${r.id} : ${i.foodId}`).toContain(`{${i.foodId}`)
    }
  })
})
