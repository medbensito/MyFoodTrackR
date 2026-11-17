import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useNav } from '../nav'
import { BackupCard } from '../components/BackupCard'
import { InstallCard } from '../components/InstallCard'
import { buildMacros } from '../lib/targets'
import type { Macros, Settings, TrainingTime } from '../types'
import { GOAL_LABEL } from '../lib/labels'
import { DEFAULT_RAMADAN } from '../lib/ramadan'
import type { RamadanSession } from '../types'
import { ScreenHeader } from '../components/ScreenHeader'

// Affichage lundi → dimanche, valeurs JS getDay()
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'L' }, { value: 2, label: 'Ma' }, { value: 3, label: 'Me' },
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
          className="input input--num"
          aria-label={label}
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
      <div className="field">
        <span>Glucides <span className="small muted">calculés</span></span>
        <span className="field-input"><strong className="computed">{Number.isFinite(m.carbs) ? m.carbs : '—'}</strong><span className="unit">g</span></span>
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

const SESSIONS: { value: RamadanSession; label: string }[] = [
  { value: 'before-ftour', label: 'Avant ftour' },
  { value: 'after-ftour', label: 'Après ftour' },
  { value: 'none', label: 'Aucune' },
]

const GOALS = (Object.keys(GOAL_LABEL) as Settings['goal'][]).map((g) => ({ value: g, label: GOAL_LABEL[g].short }))

export function SettingsScreen({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const nav = useNav()
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
  // La date d'export est gérée à part : elle ne doit ni rendre le formulaire « modifié », ni être écrasée.
  const comparable = (x: Settings) => JSON.stringify({ ...x, lastExportAt: undefined })
  const dirty = comparable(draft) !== comparable(settings)
  const ramadan = draft.ramadan ?? DEFAULT_RAMADAN
  const valid = isValid(draft)
  const proteinPerKg = draft.weightKg > 0 ? (draft.targets.training.protein / draft.weightKg).toFixed(1).replace('.', ',') : '—'

  const save = async () => {
    if (!valid) return
    await db.settings.put({ ...draft, lastExportAt: settings.lastExportAt })
    setSaved(true)
  }

  return (
    <>
    <ScreenHeader
      title="Réglages"
      subtitle="Profil, entraînement et cibles"
      back={onBack}
    />
    <section className="screen" style={{ marginTop: 18, paddingBottom: dirty ? 'calc(var(--safe-bottom) + 130px)' : undefined }}>
      {saved && !dirty && <p className="ok small" role="status" style={{ marginBottom: 12 }}>Réglages enregistrés.</p>}
      <div className="card">
        <h2>Profil</h2>
        <label className="field">
          <span>Nom</span>
          <input className="input input--text" aria-label="Nom" value={draft.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
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
        <p className="muted small" style={{ marginTop: 10 }}>Changer d'objectif ne modifie pas les cibles : ajuste-les plus bas.</p>
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
        <p className="muted small" style={{ marginTop: 10 }}>{draft.trainingDays.length} séances par semaine</p>
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
        <h2>Ramadan</h2>
        <label className="field">
          <span>
            Mode Ramadan
            <span className="small muted block">S'hour, ftour, collation du soir et dîner à la place des repas habituels</span>
          </span>
          <input type="checkbox" className="switch" checked={ramadan.enabled}
            onChange={(e) => update({ ramadan: { ...ramadan, enabled: e.target.checked } })} />
        </label>
        {ramadan.enabled && (
          <>
            <label className="field">
              <span>Premier jour</span>
              <input className="input" type="date" value={ramadan.start} onChange={(e) => update({ ramadan: { ...ramadan, start: e.target.value } })} />
            </label>
            <label className="field">
              <span>Dernier jour</span>
              <input className="input" type="date" value={ramadan.end} min={ramadan.start} onChange={(e) => update({ ramadan: { ...ramadan, end: e.target.value } })} />
            </label>
            <span className="caps" style={{ display: 'block', marginTop: 10 }}>Séance pendant le jeûne</span>
            <div className="segmented" role="radiogroup" aria-label="Séance pendant le Ramadan">
              {SESSIONS.map((x) => (
                <button key={x.value} role="radio" aria-checked={ramadan.session === x.value}
                  className={ramadan.session === x.value ? 'seg--on' : ''} onClick={() => update({ ramadan: { ...ramadan, session: x.value } })}>
                  {x.label}
                </button>
              ))}
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              Dates prévisionnelles (calculs astronomiques) : ajuste-les après l'annonce officielle du ministère des Habous.
              {ramadan.session === 'none' ? ' Sans séance, tous les jours du Ramadan passent en cible repos.' : ' Les glucides en plus vont au repas qui suit la séance.'}
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Cibles quotidiennes</h2>
        <label className="field">
          <span>
            Équilibrer sur la semaine
            <span className="small muted block">Un dépassement allège les jours suivants (300 kcal max par jour, protéines inchangées). Les écarts prévus sont toujours compensés.</span>
          </span>
          <input type="checkbox" className="switch" checked={draft.weekBalance !== false}
            onChange={(e) => update({ weekBalance: e.target.checked })} />
        </label>
        <TargetBlock title="Jour de repos" m={draft.targets.rest}
          onChange={(m) => update({ targets: { ...draft.targets, rest: m } })} />
        <TargetBlock title="Jour d'entraînement" m={draft.targets.training}
          onChange={(m) => update({ targets: { ...draft.targets, training: m } })} />
        <p className="muted small" style={{ marginTop: 10 }}>Protéines : {proteinPerKg} g par kg de poids corporel.</p>
      </div>

      <div className="card">
        <h2>Base d'aliments</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{foodStats ? `${foodStats.total} aliments · ${foodStats.verified} vérifiés` : '…'}</span>
          <button className="btn btn--sm" onClick={() => nav.push({ type: 'foods' })}>Gérer</button>
        </div>
      </div>


      <BackupCard lastExportAt={settings.lastExportAt} />
      <InstallCard />
    </section>
    {dirty && (
      <div className="cta-bar">
        <div>
          {!valid && <p className="error small" style={{ marginBottom: 8, textAlign: 'center' }}>Certaines valeurs sont vides ou invalides.</p>}
          <button className="btn btn--lime btn--block" disabled={!valid} onClick={save}>Enregistrer les réglages</button>
        </div>
      </div>
    )}
    </>
  )
}
