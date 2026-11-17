import { describe, expect, it } from 'vitest'
import { analyze, fmtRate, slopeKgPerDay } from './adaptive'
import { DEFAULT_SETTINGS, toISODate } from './targets'

const day = (offset: number) => { const d = new Date(2026, 10, 30); d.setDate(d.getDate() + offset); return toISODate(d) }
const TODAY = day(0)

/** Pesées hebdomadaires sur 4 semaines avec une pente donnée (kg/semaine). */
const weighIns = (start: number, perWeek: number) => [-28, -21, -14, -7, 0].map((o, i) => ({ date: day(o), kg: start + perWeek * i }))
const intake = (kcal: number, days = 21) => new Map(Array.from({ length: days }, (_, i) => [day(-1 - i), kcal]))

describe('slopeKgPerDay', () => {
  it('retrouve la pente', () => {
    expect(slopeKgPerDay(weighIns(70, -0.35)) * 7).toBeCloseTo(-0.35, 5)
    expect(slopeKgPerDay([{ date: day(0), kg: 70 }])).toBe(0)
  })
})

describe('analyze', () => {
  it('demande plus de pesées au début', () => {
    const r = analyze({ today: TODAY, weighIns: [{ date: day(-3), kg: 70 }, { date: day(0), kg: 69.8 }], intakeByDate: new Map(), settings: DEFAULT_SETTINGS })
    expect(r.status).toBe('insufficient')
  })

  it('valide un rythme de recomposition correct', () => {
    // −0,2 kg/sem ≈ −0,29 % : dans la fourchette ; apport cohérent avec la cible.
    const r = analyze({ today: TODAY, weighIns: weighIns(70, -0.2), intakeByDate: intake(2330), settings: DEFAULT_SETTINGS })
    expect(r.status).toBe('on-track')
  })

  it('propose de baisser quand le poids monte', () => {
    const r = analyze({ today: TODAY, weighIns: weighIns(70, 0.3), intakeByDate: intake(2330), settings: DEFAULT_SETTINGS })
    expect(r.status).toBe('adjust')
    if (r.status !== 'adjust') return
    expect(r.suggested.rest).toBeLessThan(2200)
    expect(r.suggested.rest).toBeGreaterThanOrEqual(2000) // pas plus de 200 kcal d'un coup
    expect(r.suggested.training - r.suggested.rest).toBe(200) // l'écart repos / entraînement est gardé
    expect(r.tdee).not.toBeNull()
  })

  it('propose de monter quand la perte est trop rapide', () => {
    const r = analyze({ today: TODAY, weighIns: weighIns(70, -0.9), intakeByDate: intake(2300), settings: DEFAULT_SETTINGS })
    expect(r.status).toBe('adjust')
    if (r.status === 'adjust') expect(r.suggested.rest).toBeGreaterThan(2200)
  })

  it('se contente du poids quand le suivi est trop rare', () => {
    const r = analyze({ today: TODAY, weighIns: weighIns(70, 0.3), intakeByDate: intake(2300, 4), settings: DEFAULT_SETTINGS })
    expect(r.status).toBe('adjust')
    if (r.status === 'adjust') {
      expect(r.tdee).toBeNull()
      expect(r.suggested.rest).toBe(2100)
    }
  })

  it('formate la vitesse', () => {
    expect(fmtRate(-0.234)).toBe('−0,23 kg/sem')
    expect(fmtRate(0.1)).toBe('+0,10 kg/sem')
  })
})
