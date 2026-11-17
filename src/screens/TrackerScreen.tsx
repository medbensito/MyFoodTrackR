import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Macros, Settings } from '../types'
import { db } from '../db/db'
import { useFoods } from '../db/hooks'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { isTrainingDay, targetsForDate, toISODate } from '../lib/targets'
import { roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { dayTotal } from '../lib/planner'
import { entryFromPlanned, remainingLabel, totalOf } from '../lib/journal'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl, bowlFor } from '../components/Bowl'
import { AddEntrySheet } from '../components/AddEntrySheet'
import { BackIcon, CalendarIcon, ChevronIcon, DropIcon, FlameIcon, LeafIcon, PlusIcon } from '../components/icons'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtFactor = (f: number) => `×${String(f).replace('.', ',')}`
const signed = (n: number, unit: string) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} ${unit}`

function Ring({ value, target }: { value: number; target: number }) {
  const r = 92
  const c = 2 * Math.PI * r
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const over = target > 0 && value > target * 1.05
  return (
    <svg className="ring" viewBox="0 0 220 220" aria-hidden>
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={over ? '#ffc078' : '#b9f27c'} />
          <stop offset="100%" stopColor={over ? '#ef6a22' : '#34c46a'} />
        </linearGradient>
        <radialGradient id="ring-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1f6a43" />
          <stop offset="100%" stopColor="#0b3523" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="110" r="78" fill="url(#ring-core)" />
      <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="13" />
      {pct > 0 && (
        <circle cx="110" cy="110" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 110 110)" style={{ transition: 'stroke-dasharray 0.4s' }} />
      )}
    </svg>
  )
}

function MacroTile({ icon, tone, label, value, target }: { icon: ReactNode; tone: string; label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="tile">
      <span className={`tile-icon tile-icon--${tone}`}>{icon}</span>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value} g</span>
      <span className="tile-share">/ {target} g</span>
      <span className={`tile-bar tile-bar--${tone}`}><span style={{ width: `${pct}%` }} /></span>
    </div>
  )
}

function CompareCol({ label, m }: { label: string; m: Macros }) {
  return (
    <div className="compare-col">
      <span className="compare-label">{label}</span>
      <strong>{m.kcal} kcal</strong>
      <span className="small muted">P {m.protein} · G {m.carbs} · L {m.fat}</span>
    </div>
  )
}

export function TrackerScreen({ settings }: { settings: Settings }) {
  const [offset, setOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const day = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d }, [offset])
  const iso = toISODate(day)

  const planner = usePlannerRecipes()
  const foods = useFoods()
  const planned = useLiveQuery(() => db.plannedMeals.where('date').equals(iso).toArray(), [iso])
  const entries = useLiveQuery(() => db.logEntries.where('date').equals(iso).toArray(), [iso])

  if (!planner || !foods || !planned || !entries) return <div className="loading">Chargement…</div>

  const t = targetsForDate(day, settings)
  const training = isTrainingDay(day, settings.trainingDays)
  const consumed = roundMacros(totalOf(entries))
  const pct = Math.round((consumed.kcal / t.kcal) * 100)
  const plannedTotal = roundMacros(dayTotal(planned, planner.byId))
  const plannedSorted = [...planned].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))
  const extra = entries
    .filter((e) => !e.fromPlannedMealId)
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot ?? 'snack') - SLOT_ORDER.indexOf(b.slot ?? 'snack') || a.createdAt - b.createdAt)
  const eatenCount = entries.filter((e) => e.fromPlannedMealId).length

  const togglePlanned = async (mealId: string) => {
    const existing = entries.find((e) => e.fromPlannedMealId === mealId)
    if (existing) { await db.logEntries.delete(existing.id); return }
    const meal = planned.find((m) => m.id === mealId)
    const recipe = meal && planner.byId.get(meal.recipeId)
    if (meal && recipe) await db.logEntries.add(entryFromPlanned(meal, recipe))
  }

  return (
    <>
      <ScreenHeader
        title="Tracker"
        subtitle="Suivez votre progression en temps réel"
        action={<RoundButton label="Revenir à aujourd'hui" onClick={() => setOffset(0)}><CalendarIcon size={22} /></RoundButton>}
      >
        <div className="ring-wrap">
          <Ring value={consumed.kcal} target={t.kcal} />
          <div className="ring-center">
            <span className="flame flame--lg"><FlameIcon size={26} /></span>
            <span className="ring-value">{consumed.kcal}</span>
            <span className="ring-target">/ {t.kcal} kcal</span>
            <span className="ring-pill">{pct}%</span>
          </div>
        </div>
        <p className="ring-hint">{remainingLabel(consumed, t)}</p>
      </ScreenHeader>

      <section className="screen screen--overlap">
        <div className="week-nav">
          <button className="icon-plain" aria-label="Jour précédent" onClick={() => setOffset((o) => o - 1)}><BackIcon size={20} /></button>
          <span className="day-nav-label">
            {offset === 0 ? 'Aujourd\'hui' : DATE_FMT.format(day)}
            <span className={`tag ${training ? 'tag--training' : 'tag--rest'}`}>{training ? 'Entraînement' : 'Repos'}</span>
          </span>
          <button className="icon-plain" aria-label="Jour suivant" onClick={() => setOffset((o) => o + 1)}><ChevronIcon size={20} /></button>
        </div>

        <div className="tiles">
          <MacroTile icon={<FlameIcon />} tone="protein" label="Protéines" value={consumed.protein} target={t.protein} />
          <MacroTile icon={<LeafIcon />} tone="carbs" label="Glucides" value={consumed.carbs} target={t.carbs} />
          <MacroTile icon={<DropIcon />} tone="fat" label="Lipides" value={consumed.fat} target={t.fat} />
        </div>

        <div className="section-head">
          <h2>Repas prévus</h2>
          {planned.length > 0 && <span className="muted small">{eatenCount} / {planned.length} mangés</span>}
        </div>
        {plannedSorted.length === 0 ? (
          <div className="card empty empty--sm">
            <p className="muted">Aucun repas planifié ce jour-là. Génère la semaine dans l'onglet Planning, ou ajoute ce que tu manges ci-dessous.</p>
          </div>
        ) : (
          <ul className="card meal-list">
            {plannedSorted.map((m) => {
              const r = planner.byId.get(m.recipeId)
              const eaten = entries.some((e) => e.fromPlannedMealId === m.id)
              const mm = r ? roundMacros(scaleMacros(r.perServing, m.portionFactor)) : null
              return (
                <li key={m.id} className={`meal-row ${eaten ? 'meal-row--eaten' : ''}`}>
                  <span className="meal-thumb">{r && <Bowl variant={bowlFor(r.name, r.slots)} size={56} />}</span>
                  <span className="meal-info">
                    <span className="plan-meal-slot">{SLOT_LABEL[m.slot]}</span>
                    <strong>{r?.name ?? 'Recette supprimée'}</strong>
                    {mm && <span className="muted small">{fmtFactor(m.portionFactor)} · {mm.kcal} kcal · P {mm.protein} g</span>}
                  </span>
                  <button
                    className={`check-btn ${eaten ? 'check-btn--on' : ''}`}
                    aria-pressed={eaten}
                    aria-label={eaten ? `Annuler : ${r?.name ?? 'repas'} mangé` : `Marquer ${r?.name ?? 'le repas'} comme mangé`}
                    disabled={!r}
                    onClick={() => togglePlanned(m.id)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path d="M6 12.5l4 4L18 8.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {extra.length > 0 && (
          <>
            <div className="section-head"><h2>Hors plan</h2><span className="muted small">{extra.length} ajout{extra.length > 1 ? 's' : ''}</span></div>
            <ul className="card ing-list">
              {extra.map((e) => {
                const mm = roundMacros(e.macros)
                return (
                  <li key={e.id} className="ing-row">
                    <span className="ing-name">
                      <span className="plan-meal-slot">{e.slot ? SLOT_LABEL[e.slot] : 'Repas'}</span>
                      <strong>{e.name}</strong>
                      <span className="small muted">
                        {e.grams ? `${e.grams} g` : fmtFactor(e.portionFactor ?? 1)} · {mm.kcal} kcal · P {mm.protein} g
                      </span>
                    </span>
                    <button className="remove-btn" aria-label={`Retirer ${e.name}`} onClick={() => db.logEntries.delete(e.id)}>×</button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <button className="cta" onClick={() => setAdding(true)}>Ajouter un repas <PlusIcon /></button>

        {planned.length > 0 && (
          <>
            <div className="section-head"><h2>Prévu / réel</h2></div>
            <div className="card compare">
              <div className="compare-cols">
                <CompareCol label="Prévu" m={plannedTotal} />
                <span className="compare-sep" aria-hidden>→</span>
                <CompareCol label="Réel" m={consumed} />
              </div>
              <p className="compare-delta">
                {entries.length === 0
                  ? 'Rien de saisi pour l\'instant.'
                  : `Écart avec le plan : ${signed(consumed.kcal - plannedTotal.kcal, 'kcal')} · ${signed(consumed.protein - plannedTotal.protein, 'g de protéines')}`}
              </p>
            </div>
          </>
        )}
      </section>

      {adding && (
        <AddEntrySheet
          date={iso}
          recipes={planner.list}
          foods={foods}
          onClose={() => setAdding(false)}
          onAdd={async (e) => { await db.logEntries.add(e); setAdding(false) }}
        />
      )}
    </>
  )
}
