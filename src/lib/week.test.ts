import { describe, expect, it } from 'vitest'
import { adjustMacros, weekBudget, type Extra } from './week'

const dates = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']
const base = new Map(dates.map((d) => [d, 2200]))
const run = (o: { eaten?: [string, number][]; extras?: Extra[]; today?: string; compensate?: boolean }) =>
  weekBudget({ dates, base, eaten: new Map(o.eaten ?? []), extras: o.extras ?? [], today: o.today ?? '2026-11-16', compensate: o.compensate ?? true })
const at = (iso: string, h = 12) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, h).getTime() }

describe('calories sur la semaine', () => {
  it('sans écart, rien ne change', () => {
    const w = run({})
    expect([...w.delta.values()].every((v) => v === 0)).toBe(true)
    expect(w.adjustedTotal).toBe(w.baseTotal)
  })

  it('un écart prévu est retiré des autres jours restants', () => {
    const w = run({ extras: [{ date: '2026-11-20', kcal: 600, label: 'Sortie', createdAt: at('2026-11-16', 8) }] })
    expect(w.delta.get('2026-11-20')).toBe(600)
    expect(w.delta.get('2026-11-16')).toBe(-100)
    expect(w.cut).toBe(100)
    expect(w.adjustedTotal).toBe(w.baseTotal)
  })

  it('compense un dépassement constaté sur les jours suivants', () => {
    const w = run({ today: '2026-11-18', eaten: [['2026-11-16', 2200], ['2026-11-17', 2700]] })
    expect(w.delta.get('2026-11-16')).toBe(0)
    expect(w.delta.get('2026-11-17')).toBe(0)
    expect(w.delta.get('2026-11-18')).toBe(-100)
    expect(w.delta.get('2026-11-22')).toBe(-100)
    expect(w.debt).toBe(500)
  })

  it("une journée sous la cible réduit ce qu'il reste à compenser, sans bonus", () => {
    const w = run({ today: '2026-11-18', eaten: [['2026-11-16', 1900], ['2026-11-17', 2700]] })
    expect(w.cut).toBe(40)
    const under = run({ today: '2026-11-18', eaten: [['2026-11-16', 1800]] })
    expect(under.cut).toBe(0)
    expect([...under.delta.values()].every((v) => v === 0)).toBe(true)
  })

  it('sans compensation, seuls les écarts prévus comptent', () => {
    const w = run({ today: '2026-11-18', eaten: [['2026-11-17', 2900]], compensate: false })
    expect(w.cut).toBe(0)
  })

  it('plafonne le retrait par jour et signale le reste', () => {
    const w = run({ today: '2026-11-21', eaten: [['2026-11-20', 3500]] })
    expect(w.cut).toBe(300)
    expect(w.uncovered).toBe(700)
  })

  it("garde les cibles passées telles qu'elles étaient ce jour-là", () => {
    // Lundi dépassé, mardi allégé ; l'écart du samedi n'est saisi que jeudi.
    const w = run({
      today: '2026-11-19',
      eaten: [['2026-11-16', 2800], ['2026-11-17', 2100], ['2026-11-18', 2100]],
      extras: [{ date: '2026-11-21', kcal: 500, label: 'Fête', createdAt: at('2026-11-19', 9) }],
    })
    expect(w.delta.get('2026-11-17')).toBe(-100) // 600 / 6 jours
    expect(w.delta.get('2026-11-18')).toBe(-100) // 600 − 100 (mardi sous la cible de base) = 500, sur 5 jours
    expect(w.delta.get('2026-11-21')).toBe(500)
    // Jeudi : dette 600 − 100 − 100 = 400, + 500 prévus = 900, sur jeu, ven, dim → 300
    expect(w.delta.get('2026-11-19')).toBe(-300)
  })

  it('les protéines ne bougent jamais', () => {
    const t = { kcal: 2200, protein: 140, carbs: 252, fat: 70 }
    expect(adjustMacros(t, -300)).toEqual({ kcal: 1900, protein: 140, carbs: 200, fat: 60 })
    expect(adjustMacros(t, 600)).toEqual({ kcal: 2800, protein: 140, carbs: 327, fat: 103 })
  })
})
