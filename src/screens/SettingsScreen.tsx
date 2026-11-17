import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { buildMacros } from '../lib/targets'
import type { Macros, Settings, TrainingTime } from '../types'
import { GOAL_LABEL } from '../lib/labels'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { BackIcon } from '../components/icons'

// Affichage lundi → dimanche, valeurs JS getDay()
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'M' },
  { value: 4, label: 'J' }, { value: 5, label: 'V' }, { value: 6, label: 'S' }, { value: 0, label: 'D' },
]
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const TIMES: { value: TrainingTime; label: string }[] = [
  { value: 'morning', label: 'Matin' },
  { value: 'noon', label: 'Midi' },
  { value: 'evening', label: 'Soir' },
]

function NumberField({ label, value, unit, onChange, step = 1 }: {
  label: string; value: number; unit: string; onChange: (v: number) => void; step?: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )
}

function TargetBlock({ title, m, onChange }: { title: string; m: Macros; onChange: (m: Macros) => void }) {
  const set = (patch: Partial<Macros>) => {
    const next = { ...m, ...patch }
    onChange(buildMacros(next.kcal, next.protein, next.fat))
  }
  return (
    <div className="target-block">
      <h3>{title}</h3>
      <NumberField label="Calories" unit="kcal" value={m.kcal} step={50} onChange={(v) => set({ kcal: v })} />
      <NumberField label="Protéines" unit="g" value={m.protein} step={5} onChange={(v) => set({ protein: v })} />
      <NumberField label="Lipides" unit="g" value={m.fat} step={5} onChange={(v) => set({ fat: v })} />
      <div className="field field--computed">
        <span>Glucides <em>(calculés)</em></span>
        <span className="field-input"><strong>{Number.isFinite(m.carbs) ? m.carbs : '—'}</strong><span className="unit">g</span></span>
      </div>
    </div>
  )
}

function isValid(s: Settings): boolean {
  const nums = [s.weightKg, s.heightCm, s.age,
    s.targets.rest.kcal, s.targets.rest.protein, s.targets.rest.fat,
    s.targets.training.kcal, s.targets.training.protein, s.targets.training.fat]
  return nums.every((n) => Number.isFinite(n) && n > 0)
}

const GOALS = (Object.keys(GOAL_LABEL) as Settings['goal'][]).map((g) => ({ value: g, label: GOAL_LABEL[g].short }))

export function SettingsScreen({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const foodStats = useLiveQuery(async () => {
    const all = await db.foods.toArray()
    return { total: all.length, verified: all.filter((f) => f.verified).length }
  }, [])

  const update = (patch: Partial<Settings>) => { setDraft((d) => ({ ...d, ...patch })); setSaved(false) }
  const toggleDay = (day: number) => {
    const has = draft.trainingDays.includes(day)
    update({ trainingDays: has ? draft.trainingDays.filter((d) => d !== day) : [...draft.trainingDays, day] })
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const valid = isValid(draft)
  const proteinPerKg = draft.weightKg > 0 ? (draft.targets.training.protein / draft.weightKg).toFixed(1) : '—'

  const save = async () => {
    if (!valid) return
    await db.settings.put(draft)
    setSaved(true)
  }

  return (
    <>
    <ScreenHeader
      title="Réglages"
      subtitle="Profil, entraînement et cibles"
      action={<RoundButton label="Retour" onClick={onBack}><BackIcon size={22} /></RoundButton>}
    />
    <section className="screen">
      <div className="card">
        <h2>Profil</h2>
        <label className="field">
          <span>Nom</span>
          <input className="text-input" value={draft.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
        </label>
        <NumberField label="Poids" unit="kg" value={draft.weightKg} step={0.5} onChange={(v) => update({ weightKg: v })} />
        <NumberField label="Taille" unit="cm" value={draft.heightCm} onChange={(v) => update({ heightCm: v })} />
        <NumberField label="Âge" unit="ans" value={draft.age} onChange={(v) => update({ age: v })} />
        <div className="segmented" role="radiogroup" aria-label="Objectif">
          {GOALS.map((g) => (
            <button key={g.value} role="radio" aria-checked={draft.goal === g.value}
              className={draft.goal === g.value ? 'seg--on' : ''} onClick={() => update({ goal: g.value })}>
              {g.label}
            </button>
          ))}
        </div>
        <p className="muted small">Changer d'objectif ne modifie pas les cibles : ajuste-les plus bas.</p>
      </div>

      <div className="card">
        <h2>Entraînement</h2>
        <div className="day-toggles" role="group" aria-label="Jours d'entraînement">
          {DAYS.map((d) => (
            <button
              key={d.value}
              className={`day-toggle ${draft.trainingDays.includes(d.value) ? 'day-toggle--on' : ''}`}
              aria-pressed={draft.trainingDays.includes(d.value)}
              aria-label={DAY_NAMES[d.value]}
              onClick={() => toggleDay(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="muted small">{draft.trainingDays.length} séances par semaine</p>
        <div className="segmented" role="radiogroup" aria-label="Moment de la séance">
          {TIMES.map((t) => (
            <button
              key={t.value}
              role="radio"
              aria-checked={draft.trainingTime === t.value}
              className={draft.trainingTime === t.value ? 'seg--on' : ''}
              onClick={() => update({ trainingTime: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Cibles quotidiennes</h2>
        <TargetBlock title="Jour de repos" m={draft.targets.rest}
          onChange={(m) => update({ targets: { ...draft.targets, rest: m } })} />
        <TargetBlock title="Jour d'entraînement" m={draft.targets.training}
          onChange={(m) => update({ targets: { ...draft.targets, training: m } })} />
        <p className="muted small">Protéines : {proteinPerKg} g par kg de poids corporel.</p>
      </div>

      <div className="card">
        <h2>Base d'aliments</h2>
        <p>
          {foodStats ? `${foodStats.total} aliments · ${foodStats.verified} vérifiés` : '…'}
        </p>
        <p className="muted small">La gestion des aliments arrive au jalon M1, la sauvegarde au jalon M4.</p>
      </div>

      <div className="save-bar">
        {!valid && <span className="error small">Certaines valeurs sont vides ou invalides.</span>}
        {saved && !dirty && <span className="ok small">Enregistré</span>}
        <button className="primary" disabled={!dirty || !valid} onClick={save}>Enregistrer</button>
      </div>
    </section>
    </>
  )
}
