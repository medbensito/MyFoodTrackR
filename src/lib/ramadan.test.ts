import { describe, expect, it } from 'vitest'
import { DEFAULT_RAMADAN, isRamadan, postTrainingSlot, ramadanDay, slotAt, slotNames } from './ramadan'
import { DEFAULT_SETTINGS, targetsForDate, trainingOn } from './targets'
import { slotTargets } from './planner'

const on = { ...DEFAULT_SETTINGS, ramadan: { ...DEFAULT_RAMADAN, enabled: true } }

describe('mode Ramadan', () => {
  it('ne s\'applique que s\'il est activé et entre les dates', () => {
    expect(isRamadan('2027-02-10', DEFAULT_SETTINGS)).toBe(false)
    expect(isRamadan('2027-02-10', { ramadan: DEFAULT_RAMADAN })).toBe(false)
    expect(isRamadan('2027-02-10', on)).toBe(true)
    expect(isRamadan('2027-03-10', on)).toBe(false)
    expect(ramadanDay('2027-02-08', on)).toBe(1)
    expect(ramadanDay('2027-03-09', on)).toBe(30)
  })

  it('renomme les repas', () => {
    const n = slotNames('2027-02-10', on)
    expect(n.order).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
    expect(n.label.lunch).toBe('Ftour')
    expect(n.label.breakfast).toBe("S'hour")
    expect(slotNames('2027-01-10', on).label.lunch).toBe('Déjeuner')
  })

  it('met le supplément d\'entraînement au repas qui suit la séance', () => {
    expect(postTrainingSlot('2027-02-10', on)).toBe('lunch')
    expect(postTrainingSlot('2027-02-10', { ...on, ramadan: { ...on.ramadan, session: 'after-ftour' } })).toBe('dinner')
    expect(postTrainingSlot('2027-01-10', on)).toBe('breakfast')
    const t = slotTargets(true, on, 'lunch'), r = slotTargets(false, on)
    expect(Math.round(t.lunch.kcal - r.lunch.kcal)).toBe(200)
    expect(Math.round(t.breakfast.kcal - r.breakfast.kcal)).toBe(0)
  })

  it('sans séance pendant le jeûne, les jours passent en repos', () => {
    const none = { ...on, ramadan: { ...on.ramadan, session: 'none' as const } }
    const mardi = new Date(2027, 1, 9)
    expect(trainingOn(mardi, none)).toBe(false)
    expect(targetsForDate(mardi, none).kcal).toBe(2200)
    expect(trainingOn(mardi, on)).toBe(true)
    expect(trainingOn(mardi, none, new Map([['2027-02-09', true]]))).toBe(true)
  })

  it('propose le créneau selon l\'heure', () => {
    const at = (h: number) => { const d = new Date(2027, 1, 10, h); return slotAt(d, '2027-02-10', on) }
    expect(at(4)).toBe('breakfast')
    expect(at(19)).toBe('lunch')
    expect(at(22)).toBe('dinner')
    expect(at(13)).toBe('snack')
  })
})
