import { describe, expect, it } from 'vitest'
import { initialFoods } from '../db/seed'
import { SAMPLE_RECIPES } from '../db/sampleRecipes'
import { PACK_FOODS, PACK_RECIPES } from '../db/pack'
import { recipeTotals } from './nutrition'
import { DEFAULT_SETTINGS, toISODate, weekDays, isTrainingDay } from './targets'
import {
  dayTarget, dayTotal, gapLabel, generateWeek, slotTargets, suggestAdjustment, withinTolerance,
  type PlannerInput, type PlannerRecipe,
} from './planner'
import type { PlannedMeal } from '../types'

const foods = new Map(initialFoods().map((f) => [f.id, f]))
const recipes: PlannerRecipe[] = SAMPLE_RECIPES.map((r) => ({ id: r.id, name: r.name, slots: r.slots, perServing: recipeTotals(r, foods).perServing }))
const byId = new Map(recipes.map((r) => [r.id, r]))
const days = weekDays(new Date(2026, 10, 18)) // semaine du lundi 16 novembre 2026
const dates = days.map(toISODate)
const trainingDates = new Set(days.filter((d) => isTrainingDay(d, DEFAULT_SETTINGS.trainingDays)).map(toISODate))

const input = (over: Partial<PlannerInput> = {}): PlannerInput => ({
  dates, trainingDates, settings: DEFAULT_SETTINGS, recipes, pinned: [], ...over,
})

describe('slotTargets', () => {
  it('répartit la cible de repos sur les 4 créneaux', () => {
    const t = slotTargets(false, DEFAULT_SETTINGS)
    expect(Math.round(t.breakfast.kcal + t.lunch.kcal + t.dinner.kcal + t.snack.kcal)).toBe(2200)
    expect(Math.round(t.breakfast.protein + t.lunch.protein + t.dinner.protein + t.snack.protein)).toBe(140)
  })
  it('donne le supplément d\'entraînement au petit-déjeuner (séance le matin)', () => {
    const rest = slotTargets(false, DEFAULT_SETTINGS)
    const train = slotTargets(true, DEFAULT_SETTINGS)
    expect(Math.round(train.breakfast.kcal - rest.breakfast.kcal)).toBe(200)
    expect(Math.round(train.breakfast.carbs - rest.breakfast.carbs)).toBe(50)
    expect(train.lunch).toEqual(rest.lunch)
  })
  it('suit le moment de la séance', () => {
    const t = slotTargets(true, { ...DEFAULT_SETTINGS, trainingTime: 'evening' })
    expect(Math.round(t.dinner.kcal - slotTargets(false, DEFAULT_SETTINGS).dinner.kcal)).toBe(200)
  })
})

describe('generateWeek', () => {
  const res = generateWeek(input(), 42)

  it('remplit les 4 créneaux des 7 jours', () => {
    expect(res.meals).toHaveLength(28)
    expect(res.warnings).toEqual([
      'Moins de 3 recettes pour « Petit-déjeuner » : des répétitions sont autorisées.',
      'Moins de 3 recettes pour « Collation » : des répétitions sont autorisées.',
    ])
  })

  it('est reproductible avec la même graine et varie avec une autre', () => {
    const again = generateWeek(input(), 42)
    expect(again.meals.map((m) => m.recipeId)).toEqual(res.meals.map((m) => m.recipeId))
    const other = generateWeek(input(), 7)
    expect(other.meals.map((m) => m.recipeId)).not.toEqual(res.meals.map((m) => m.recipeId))
  })

  it('respecte la variété : 2 fois max par créneau, jamais deux jours de suite', () => {
    for (const slot of ['lunch', 'dinner'] as const) {
      const seq = dates.map((d) => res.meals.find((m) => m.date === d && m.slot === slot)!.recipeId)
      const counts = new Map<string, number>()
      seq.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
      expect(Math.max(...counts.values()), slot).toBeLessThanOrEqual(2)
      for (let i = 1; i < seq.length; i++) expect(seq[i], `${slot} jour ${i}`).not.toBe(seq[i - 1])
    }
  })

  it('limite chaque recette à 3 apparitions dans la semaine', () => {
    const counts = new Map<string, number>()
    res.meals.forEach((m) => counts.set(m.recipeId, (counts.get(m.recipeId) ?? 0) + 1))
    const mains = [...counts.entries()].filter(([id]) => !recipes.find((r) => r.id === id)!.slots.every((s) => s === 'snack' || s === 'breakfast'))
    for (const [id, n] of mains) expect(n, id).toBeLessThanOrEqual(3)
  })

  it('ne sert pas la même recette au déjeuner et au dîner', () => {
    for (const d of dates) {
      const l = res.meals.find((m) => m.date === d && m.slot === 'lunch')!
      const di = res.meals.find((m) => m.date === d && m.slot === 'dinner')!
      expect(l.recipeId).not.toBe(di.recipeId)
    }
  })

  it('atteint les protéines chaque jour et reste proche des calories', () => {
    for (const d of dates) {
      const total = dayTotal(res.meals.filter((m) => m.date === d), byId)
      const target = dayTarget(trainingDates.has(d), DEFAULT_SETTINGS)
      expect(total.protein, d).toBeGreaterThanOrEqual(target.protein - 5)
      expect(Math.abs(total.kcal - target.kcal) / target.kcal, d).toBeLessThan(0.1)
    }
  })

  it('reste dans les tolérances sur la majorité des jours, quelle que soit la graine', () => {
    for (const seed of [1, 2, 3, 99, 2026]) {
      const r = generateWeek(input(), seed)
      const ok = dates.filter((d) => withinTolerance(dayTotal(r.meals.filter((m) => m.date === d), byId), dayTarget(trainingDates.has(d), DEFAULT_SETTINGS)))
      expect(ok.length, `graine ${seed}`).toBeGreaterThanOrEqual(5)
    }
  })

  it('garde les repas épinglés et compense sur les autres', () => {
    const pinned: PlannedMeal = { id: 'pin', date: dates[0], slot: 'lunch', recipeId: 'ex-pates-bolognaise', portionFactor: 1.5, pinned: true }
    const r = generateWeek(input({ pinned: [pinned] }), 42)
    const monday = r.meals.filter((m) => m.date === dates[0])
    expect(monday).toContainEqual(pinned)
    expect(monday).toHaveLength(4)
    const total = dayTotal(monday, byId)
    expect(Math.abs(total.kcal - 2200) / 2200).toBeLessThan(0.1)
  })

  it('laisse vide un créneau sans recette', () => {
    const r = generateWeek(input({ recipes: recipes.filter((x) => !x.slots.includes('snack')) }), 1)
    expect(r.meals.filter((m) => m.slot === 'snack')).toHaveLength(0)
    expect(r.warnings.some((w) => w.startsWith('Aucune recette pour le créneau « Collation »'))).toBe(true)
  })
})

describe('suggestAdjustment', () => {
  it('propose d\'ajuster un autre repas après une modification', () => {
    const day = generateWeek(input(), 42).meals.filter((m) => m.date === dates[0])
    const edited = day.find((m) => m.slot === 'lunch')!
    const modified = day.map((m) => (m.id === edited.id ? { ...m, portionFactor: 0.5, pinned: true } : m))
    const s = suggestAdjustment(modified, edited.id, DEFAULT_SETTINGS.targets.rest, byId)
    expect(s).not.toBeNull()
    expect(s!.mealId).not.toBe(edited.id)
    expect(s!.to).toBeGreaterThan(s!.from)
  })
  it('ne propose rien si la journée est déjà dans la cible', () => {
    const day = generateWeek(input(), 42).meals.filter((m) => m.date === dates[0])
    if (withinTolerance(dayTotal(day, byId), DEFAULT_SETTINGS.targets.rest)) {
      expect(suggestAdjustment(day, day[0].id, DEFAULT_SETTINGS.targets.rest, byId)).toBeNull()
    }
  })
})

describe('gapLabel', () => {
  it('décrit l\'écart', () => {
    expect(gapLabel({ kcal: 2000, protein: 120, carbs: 0, fat: 0 }, { kcal: 2200, protein: 140, carbs: 0, fat: 0 })).toBe('−20 g de protéines · −200 kcal')
    expect(gapLabel({ kcal: 2210, protein: 141, carbs: 0, fat: 0 }, { kcal: 2200, protein: 140, carbs: 0, fat: 0 })).toBeNull()
  })
})

describe('avec le pack de recettes', () => {
  const allFoods = new Map([...initialFoods(), ...PACK_FOODS].map((f) => [f.id, f]))
  const all: PlannerRecipe[] = [...SAMPLE_RECIPES, ...PACK_RECIPES].map((r) => ({ id: r.id, name: r.name, slots: r.slots, perServing: recipeTotals(r, allFoods).perServing }))
  const allById = new Map(all.map((r) => [r.id, r]))
  it('ne signale plus de manque de recettes et reste dans la cible', () => {
    for (const seed of [1, 7, 42, 2026]) {
      const r = generateWeek(input({ recipes: all }), seed)
      expect(r.warnings, `graine ${seed}`).toEqual([])
      const ok = dates.filter((d) => withinTolerance(dayTotal(r.meals.filter((m) => m.date === d), allById), dayTarget(trainingDates.has(d), DEFAULT_SETTINGS)))
      expect(ok.length, `graine ${seed}`).toBeGreaterThanOrEqual(5)
    }
  })
  it('varie davantage les petits-déjeuners', () => {
    const r = generateWeek(input({ recipes: all }), 42)
    const breakfasts = new Set(r.meals.filter((m) => m.slot === 'breakfast').map((m) => m.recipeId))
    expect(breakfasts.size).toBeGreaterThanOrEqual(4)
  })
})
