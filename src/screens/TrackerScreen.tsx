import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Macros, Settings } from '../types'
import { db } from '../db/db'
import { useFoods } from '../db/hooks'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { isTrainingDay, targetsForDate, toISODate } from '../lib/targets'
import { fmtFactor, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER, SLOT_SHORT, SLOT_THE } from '../lib/nutrition'
import { dayTotal } from '../lib/planner'
import { entryFromPlanned, totalOf } from '../lib/journal'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { AddEntrySheet } from '../components/AddEntrySheet'
import { BackIcon, CheckIcon, ChevronIcon, PlusIcon } from '../components/icons'

const SUB_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const TITLE_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' })
const signed = (n: number, unit: string) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} ${unit}`
const clean = (s: string) => s.replace(/\./g, '')

/** Jauge en 14 segments ; le segment en cours est rempli au prorata. */
function Segments({ value, target }: { value: number; target: number }) {
  const n = 14
  const filled = target > 0 ? Math.min(n, (value / target) * n) : 0
  return (
    <div className="segments" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const part = Math.max(0, Math.min(1, filled - i))
        const style = part >= 1 ? { background: 'var(--lime)' }
          : part > 0 ? { background: `linear-gradient(90deg, var(--lime) ${part * 100}%, var(--line) ${part * 100}%)` }
          : undefined
        return <span key={i} style={style} />
      })}
    </div>
  )
}

function Stat({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="stat">
      <span className="caps">{label}</span>
      <span className="stat-val">{value}<small> /{target}</small></span>
      <span className="bar"><span style={{ width: `${pct}%`, background: color }} /></span>
    </div>
  )
}

function CompareCol({ label, m }: { label: string; m: Macros }) {
  return (
    <div>
      <span className="caps">{label}</span>
      <span className="d">{m.kcal}</span>
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
  const plannedTotal = roundMacros(dayTotal(planned, planner.byId))
  const plannedSorted = [...planned].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))
  const eatenIds = new Set(entries.map((e) => e.fromPlannedMealId).filter(Boolean))
  const next = plannedSorted.find((m) => !eatenIds.has(m.id) && planner.byId.has(m.recipeId))
  const extra = entries
    .filter((e) => !e.fromPlannedMealId)
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot ?? 'snack') - SLOT_ORDER.indexOf(b.slot ?? 'snack') || a.createdAt - b.createdAt)

  const togglePlanned = async (mealId: string) => {
    const existing = entries.find((e) => e.fromPlannedMealId === mealId)
    if (existing) { await db.logEntries.delete(existing.id); return }
    const meal = planned.find((m) => m.id === mealId)
    const recipe = meal && planner.byId.get(meal.recipeId)
    if (meal && recipe) await db.logEntries.add(entryFromPlanned(meal, recipe))
  }

  // Phrase d'aide sous la jauge : ce qu'il manque et ce que le prochain repas prévu apporte.
  const leftP = Math.max(0, t.protein - consumed.protein)
  const leftK = t.kcal - consumed.kcal
  const nextP = next ? Math.round(scaleMacros(planner.byId.get(next.recipeId)!.perServing, next.portionFactor).protein) : 0
  let hint: ReactNode
  if (leftP === 0) hint = <>Objectif protéines atteint{leftK > 0 ? <>, encore <strong>{leftK} kcal</strong> dans ta cible.</> : '.'}</>
  else if (next) {
    hint = <>Encore <strong>{leftP} g</strong>. {SLOT_THE[next.slot]} prévu {Math.abs(nextP - leftP) <= 3 ? 'les apporte pile.' : `en apporte ${nextP} g.`}</>
  } else hint = <>Encore <strong>{leftP} g</strong> pour atteindre ta cible.</>

  const subtitle = offset === 0
    ? `${clean(SUB_FMT.format(day))} · ${training ? 'Entraînement' : 'Repos'}`
    : training ? 'Entraînement' : 'Repos'

  return (
    <>
      <ScreenHeader
        title={offset === 0 ? 'Aujourd\'hui' : TITLE_FMT.format(day)}
        subtitle={<>{subtitle}{offset !== 0 && <button className="text-link" onClick={() => setOffset(0)}>· Aujourd'hui</button>}</>}
        dot={training}
        action={<>
          <SquareButton label="Jour précédent" onClick={() => setOffset((o) => o - 1)}><BackIcon /></SquareButton>
          <SquareButton label="Jour suivant" onClick={() => setOffset((o) => o + 1)}><ChevronIcon size={20} /></SquareButton>
        </>}
      >
        <div className="protein-hero">
          <span className="caps caps--lime" style={{ fontSize: 12, letterSpacing: '0.14em' }}>Protéines</span>
          <div className="num">
            <span className="big">{consumed.protein}</span>
            <span className="of">/ {t.protein} g</span>
          </div>
          <Segments value={consumed.protein} target={t.protein} />
          <p>{hint}</p>
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="stat-grid" style={{ marginTop: 26 }}>
          <Stat label="Kcal" value={consumed.kcal} target={t.kcal} color="var(--text)" />
          <Stat label="Glucides" value={consumed.carbs} target={t.carbs} color="var(--cyan)" />
          <Stat label="Lipides" value={consumed.fat} target={t.fat} color="var(--amber)" />
        </div>

        <div className="section-label">
          <span>Repas du jour</span>
          {planned.length > 0 && <span className="count">{eatenIds.size}/{planned.length}</span>}
        </div>

        {plannedSorted.length === 0 ? (
          <div className="card empty">
            <p>Aucun repas planifié ce jour-là. Génère la semaine dans Planning, ou ajoute ce que tu manges.</p>
          </div>
        ) : (
          <div className="timeline">
            {plannedSorted.map((m) => {
              const r = planner.byId.get(m.recipeId)
              const eaten = eatenIds.has(m.id)
              const isNext = next?.id === m.id
              const mm = r ? roundMacros(scaleMacros(r.perServing, m.portionFactor)) : null
              const after = m.slot === 'breakfast' && training && settings.trainingTime === 'morning' ? ' · après séance' : ''
              return (
                <div key={m.id} className={`tl-row ${eaten ? 'tl-row--done' : ''} ${isNext ? 'tl-row--next' : ''}`}>
                  <button
                    className={`tl-node ${eaten ? 'tl-node--on' : ''} ${isNext ? 'tl-node--next' : ''}`}
                    aria-pressed={eaten}
                    aria-label={eaten ? `Annuler : ${r?.name ?? 'repas'} mangé` : `Marquer ${r?.name ?? 'le repas'} comme mangé`}
                    disabled={!r}
                    onClick={() => togglePlanned(m.id)}
                  >
                    <span>{eaten && <CheckIcon />}</span>
                  </button>
                  <div className="tl-body">
                    <span className="caps">{SLOT_SHORT[m.slot]}{isNext ? ' · suivant' : after}</span>
                    <strong>{r?.name ?? 'Recette supprimée'}</strong>
                    {isNext && mm && <span className="tl-meta">{fmtFactor(m.portionFactor)} · {mm.kcal} kcal · {mm.protein} g P</span>}
                  </div>
                  {isNext ? (
                    <button className="btn btn--lime btn--sm" onClick={() => togglePlanned(m.id)}>Mangé</button>
                  ) : mm && (
                    <span className="tl-num">{mm.kcal}<br /><span className="lime">{mm.protein} g P</span></span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {extra.length > 0 && (
          <>
            <div className="section-label"><span>Hors plan</span><span className="count">{extra.length}</span></div>
            <div className="card" style={{ padding: '4px 16px' }}>
              {extra.map((e) => {
                const mm = roundMacros(e.macros)
                return (
                  <div key={e.id} className="extra-row">
                    <div className="tl-body">
                      <span className="caps">{e.slot ? SLOT_LABEL[e.slot] : 'Repas'}</span>
                      <strong>{e.name}</strong>
                      <span className="tl-meta">{e.grams ? `${e.grams} g` : fmtFactor(e.portionFactor ?? 1)} · {mm.kcal} kcal · {mm.protein} g P</span>
                    </div>
                    <button className="x-btn" aria-label={`Retirer ${e.name}`} onClick={() => db.logEntries.delete(e.id)}>×</button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <button className="btn btn--outline btn--block" style={{ marginTop: 18 }} onClick={() => setAdding(true)}>
          <PlusIcon /> Ajouter un repas
        </button>

        {planned.length > 0 && (
          <>
            <div className="section-label"><span>Prévu / réel</span></div>
            <div className="card compare">
              <CompareCol label="Prévu · kcal" m={plannedTotal} />
              <ChevronIcon size={18} />
              <CompareCol label="Réel · kcal" m={consumed} />
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
