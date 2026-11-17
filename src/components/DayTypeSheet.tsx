import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { loadWeekTargets, useWeekTargets } from '../db/useWeek'
import { readjustDays } from '../db/readjust'
import type { Settings } from '../types'
import { isTrainingDay, toISODate } from '../lib/targets'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const AMOUNTS = [0, 300, 500, 800, 1000]
const LABELS = ['Restaurant', 'Sortie', 'Fête', 'Famille']

/**
 * Ce jour-là : séance sautée ou ajoutée, écart prévu (sortie, fête…). Change la cible du jour,
 * allège les autres jours de la semaine si besoin et peut recomposer les repas pas encore mangés.
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
  const today = toISODate(new Date())
  const canPlanExtra = date >= today
  const week = useWeekTargets(date, settings)
  const current = week?.extras.get(date)
  const [choice, setChoice] = useState(training)
  const [amount, setAmount] = useState<number | null>(null)
  const [label, setLabel] = useState<string | null>(null)
  const [readjust, setReadjust] = useState(true)
  const [busy, setBusy] = useState(false)
  const planner = usePlannerRecipes()
  const affected = week ? week.dates.filter((x) => x >= today) : []
  const movable = useLiveQuery(async () => {
    const [meals, logs] = await Promise.all([
      db.plannedMeals.where('date').anyOf(affected).toArray(),
      db.logEntries.where('date').anyOf(affected).toArray(),
    ])
    const eaten = new Set(logs.map((l) => l.fromPlannedMealId).filter(Boolean))
    return meals.filter((x) => !x.pinned && !eaten.has(x.id)).length
  }, [affected.join()])

  if (!week) return null
  const kcal = amount ?? current?.kcal ?? 0
  const name = label ?? current?.label ?? LABELS[0]
  const extraChanged = canPlanExtra && (kcal !== (current?.kcal ?? 0) || (kcal > 0 && name !== current?.label))
  const changed = choice !== training || extraChanged
  const base = choice ? settings.targets.training : settings.targets.rest
  const preview = extraChanged ? week.cutWithExtra(date, kcal) : null

  const confirm = async () => {
    if (!planner) return
    setBusy(true)
    if (choice !== training) {
      if (choice === usual) await db.dayOverrides.delete(date)
      else await db.dayOverrides.put({ date, training: choice })
    }
    if (extraChanged) {
      if (kcal > 0) await db.extras.put({ date, kcal, label: name, createdAt: Date.now() })
      else await db.extras.delete(date)
    }
    if (readjust && (movable ?? 0) > 0) {
      const fresh = await loadWeekTargets(date, { ...settings })
      // Séance changée : ce jour seulement. Écart changé : tous les jours restants de la semaine.
      const days = extraChanged ? fresh.dates.filter((x) => x >= today) : [date]
      await readjustDays(days, settings, planner.list, fresh)
    }
    setBusy(false)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Ce jour-là" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          <div className="bs-titles">
            <span className="caps caps--lime">{DAY_FMT.format(day)}</span>
            <strong>Ce jour-là</strong>
          </div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        <span className="caps">Séance</span>
        <div className="segmented" role="radiogroup" aria-label="Type de journée" style={{ marginTop: 8 }}>
          <button role="radio" aria-checked={choice} className={choice ? 'seg--on' : ''} onClick={() => setChoice(true)}>Entraînement</button>
          <button role="radio" aria-checked={!choice} className={!choice ? 'seg--on' : ''} onClick={() => setChoice(false)}>Repos</button>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Cible de base : <strong style={{ color: 'var(--text)' }}>{base.kcal} kcal</strong> · {base.protein} g P · {base.carbs} g G.
          {choice !== usual && ` D'habitude, ce jour est ${usual ? "un jour d'entraînement" : 'un jour de repos'}.`}
        </p>

        {canPlanExtra && (
          <>
            <span className="caps" style={{ display: 'block', marginTop: 18 }}>Écart prévu</span>
            <p className="small muted" style={{ marginTop: 4 }}>Ce que tu mangeras en plus d'une journée normale. Un resto à la place du dîner, c'est environ +500 kcal.</p>
            <div className="toggle-chips" role="radiogroup" aria-label="Écart prévu" style={{ marginTop: 10 }}>
              {AMOUNTS.map((a) => (
                <button key={a} role="radio" aria-checked={kcal === a} className={`chip chip--sm ${kcal === a ? 'chip--on' : ''}`} onClick={() => setAmount(a)}>
                  {a === 0 ? 'Aucun' : `+${a}`}
                </button>
              ))}
            </div>
            {kcal > 0 && (
              <div className="toggle-chips" role="radiogroup" aria-label="Occasion" style={{ marginTop: 8 }}>
                {LABELS.map((l) => (
                  <button key={l} role="radio" aria-checked={name === l} className={`chip chip--sm ${name === l ? 'chip--on' : ''}`} onClick={() => setLabel(l)}>{l}</button>
                ))}
              </div>
            )}
            {preview && (
              <p className="small" style={{ marginTop: 10, color: 'var(--text-2)' }}>
                {preview.cut > 0
                  ? <>Les autres jours restants de la semaine passent à <strong>−{preview.cut} kcal</strong> chacun, protéines inchangées.</>
                  : kcal > 0 ? 'Rien à retirer ailleurs cette semaine.' : 'Les autres jours reprennent leur cible habituelle.'}
                {preview.uncovered > 0 && ` ${preview.uncovered} kcal restent non compensées : pas plus de 300 kcal en moins par jour.`}
              </p>
            )}
          </>
        )}

        {changed && (movable ?? 0) > 0 && (
          <label className="field" style={{ marginTop: 8 }}>
            <span>
              Réajuster les repas prévus
              <span className="small muted block">{extraChanged ? 'Jours restants de la semaine' : 'Ce jour-là'} · repas pas encore mangés ni épinglés</span>
            </span>
            <input type="checkbox" className="switch" checked={readjust} onChange={(e) => setReadjust(e.target.checked)} />
          </label>
        )}

        <button className="btn btn--lime btn--block" style={{ marginTop: 14 }} disabled={busy || !changed} onClick={confirm}>
          {changed ? 'Confirmer' : 'Aucun changement'}
        </button>
      </div>
    </div>
  )
}
