import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import type { Settings } from '../types'
import { isTrainingDay } from '../lib/targets'
import { generateWeek } from '../lib/planner'
import { newId } from '../lib/nutrition'
import { postTrainingSlot } from '../lib/ramadan'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Séance sautée ou ajoutée : change la cible du jour et, si on le souhaite,
 * recompose les repas pas encore mangés ni épinglés de ce jour.
 */
export function DayTypeSheet({ date, training, settings, onClose }: {
  date: string
  training: boolean
  settings: Settings
  onClose: () => void
}) {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  const usual = isTrainingDay(day, settings.trainingDays)
  const [choice, setChoice] = useState(training)
  const [readjust, setReadjust] = useState(true)
  const [busy, setBusy] = useState(false)
  const planner = usePlannerRecipes()
  const meals = useLiveQuery(() => db.plannedMeals.where('date').equals(date).toArray(), [date])
  const logs = useLiveQuery(() => db.logEntries.where('date').equals(date).toArray(), [date])

  const eaten = new Set((logs ?? []).map((l) => l.fromPlannedMealId).filter(Boolean))
  const keep = (meals ?? []).filter((x) => x.pinned || eaten.has(x.id))
  const movable = (meals ?? []).length - keep.length
  const target = choice ? settings.targets.training : settings.targets.rest

  const confirm = async () => {
    if (!planner || !meals) return
    setBusy(true)
    if (choice === usual) await db.dayOverrides.delete(date)
    else await db.dayOverrides.put({ date, training: choice })

    if (readjust && choice !== training && movable > 0) {
      // Les repas déjà mangés ou épinglés restent : le moteur compose le reste autour d'eux.
      const fixed = keep.map((x) => ({ ...x, pinned: true }))
      const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
      const res = generateWeek({
        dates: [date],
        trainingDates: choice ? new Set([date]) : new Set<string>(),
        settings,
        recipes: planner.list,
        pinned: fixed,
        postSlotFor: (d) => postTrainingSlot(d, settings),
      }, seed)
      const keepIds = new Set(keep.map((x) => x.id))
      await db.transaction('rw', db.plannedMeals, async () => {
        await db.plannedMeals.bulkDelete(meals.filter((x) => !keepIds.has(x.id)).map((x) => x.id))
        await db.plannedMeals.bulkPut(res.meals.filter((x) => !keepIds.has(x.id)).map((x) => ({ ...x, id: newId('pm'), pinned: false })))
      })
    }
    setBusy(false)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Type de journée" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          <div className="bs-titles">
            <span className="caps caps--lime">{DAY_FMT.format(day)}</span>
            <strong>Séance du jour</strong>
          </div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        <div className="segmented" role="radiogroup" aria-label="Type de journée" style={{ marginTop: 0 }}>
          <button role="radio" aria-checked={choice} className={choice ? 'seg--on' : ''} onClick={() => setChoice(true)}>Entraînement</button>
          <button role="radio" aria-checked={!choice} className={!choice ? 'seg--on' : ''} onClick={() => setChoice(false)}>Repos</button>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Cible : <strong style={{ color: 'var(--text)' }}>{target.kcal} kcal</strong> · {target.protein} g P · {target.carbs} g G.
          {choice !== usual && ` D'habitude, ce jour est ${usual ? "un jour d'entraînement" : 'un jour de repos'}.`}
        </p>

        {choice !== training && movable > 0 && (
          <label className="field" style={{ marginTop: 8 }}>
            <span>
              Réajuster les repas restants
              <span className="small muted block">{movable} repas pas encore mangé{movable > 1 ? 's' : ''} ni épinglé{movable > 1 ? 's' : ''}</span>
            </span>
            <input type="checkbox" className="switch" checked={readjust} onChange={(e) => setReadjust(e.target.checked)} />
          </label>
        )}

        <button className="btn btn--lime btn--block" style={{ marginTop: 14 }} disabled={busy || choice === training} onClick={confirm}>
          {choice === training ? 'Aucun changement' : 'Confirmer'}
        </button>
      </div>
    </div>
  )
}
