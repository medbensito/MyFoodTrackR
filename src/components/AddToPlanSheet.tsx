import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MealSlot, Recipe } from '../types'
import { fmtFactor, newId } from '../lib/nutrition'
import { toISODate } from '../lib/targets'
import { slotNames } from '../lib/ramadan'

const DN = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

/** Place une recette sur un jour et un créneau des 7 prochains jours (repas épinglé). */
export function AddToPlanSheet({ recipe, factor, onClose, onDone }: {
  recipe: Recipe
  factor: number
  onClose: () => void
  onDone: (label: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d })
  const dates = days.map(toISODate)
  const settings = useLiveQuery(() => db.settings.get('main'), [])
  const [date, setDate] = useState(dates[0])
  const names = slotNames(date, settings ?? {})
  const slots = names.order.filter((s) => recipe.slots.includes(s))
  const [slot, setSlot] = useState<MealSlot>(slots[0] ?? 'lunch')
  const current = useLiveQuery(() => db.plannedMeals.where('[date+slot]').equals([date, slot]).first(), [date, slot])
  const currentRecipe = useLiveQuery(async () => (current ? db.recipes.get(current.recipeId) : undefined), [current?.recipeId])

  const confirm = async () => {
    await db.transaction('rw', db.plannedMeals, async () => {
      if (current) await db.plannedMeals.delete(current.id)
      await db.plannedMeals.add({ id: newId('pm'), date, slot, recipeId: recipe.id, portionFactor: factor, pinned: true })
    })
    const d = days[dates.indexOf(date)]
    onDone(`${names.label[slot]} du ${DN[d.getDay()].toLowerCase()}. ${d.getDate()}`)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Ajouter au planning" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          <div className="bs-titles">
            <span className="caps caps--lime">{recipe.name} · {fmtFactor(factor)}</span>
            <strong>Ajouter au planning</strong>
          </div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        <span className="caps">Jour</span>
        <div className="day-picker" role="radiogroup" aria-label="Jour" style={{ marginTop: 8 }}>
          {days.map((d, i) => (
            <button key={dates[i]} role="radio" aria-checked={date === dates[i]}
              className={`day-btn ${date === dates[i] ? 'day-btn--sel' : ''}`} onClick={() => setDate(dates[i])}>
              <span className="dn">{i === 0 ? 'AUJ.' : DN[d.getDay()]}</span>
              <span className="dd">{d.getDate()}</span>
            </button>
          ))}
        </div>

        <span className="caps" style={{ display: 'block', marginTop: 18 }}>Créneau</span>
        <div className="toggle-chips" role="radiogroup" aria-label="Créneau" style={{ marginTop: 8 }}>
          {slots.map((s) => (
            <button key={s} role="radio" aria-checked={slot === s} className={`chip chip--sm ${slot === s ? 'chip--on' : ''}`} onClick={() => setSlot(s)}>
              {names.label[s]}
            </button>
          ))}
        </div>

        <p className="small" style={{ marginTop: 16, minHeight: 18, color: current ? 'var(--amber)' : 'var(--muted)' }}>
          {current
            ? `Remplace « ${currentRecipe?.name ?? 'un repas'} » prévu sur ce créneau.`
            : 'Créneau libre.'}
        </p>
        <button className="btn btn--lime btn--block" style={{ marginTop: 12 }} onClick={confirm}>Confirmer</button>
      </div>
    </div>
  )
}
