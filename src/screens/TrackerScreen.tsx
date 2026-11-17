import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Macros, MealSlot, Settings } from '../types'
import { db } from '../db/db'
import { useFoods } from '../db/hooks'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { toISODate, trainingOn } from '../lib/targets'
import { useWeekTargets } from '../db/useWeek'
import { deltaLabel } from '../lib/week'
import { useOverrides } from '../db/useOverrides'
import { DayTypeSheet } from '../components/DayTypeSheet'
import { fmtFactor, roundMacros, scaleMacros } from '../lib/nutrition'
import { postTrainingSlot, ramadanDay, slotAt, slotNames } from '../lib/ramadan'
import { dayTotal, slotTargets } from '../lib/planner'
import { entryFromPlanned, totalOf } from '../lib/journal'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { AddEntrySheet } from '../components/AddEntrySheet'
import { NowSheet } from '../components/NowSheet'
import { BackIcon, CheckIcon, ChevronIcon, PlusIcon, TrophyIcon } from '../components/icons'
import { useNav } from '../nav'

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
  const nav = useNav()
  const [offset, setOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const [dayType, setDayType] = useState(false)
  const [nowOpen, setNowOpen] = useState(false)
  const day = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d }, [offset])
  const iso = toISODate(day)

  const planner = usePlannerRecipes()
  const foods = useFoods()
  const planned = useLiveQuery(() => db.plannedMeals.where('date').equals(iso).toArray(), [iso])
  const entries = useLiveQuery(() => db.logEntries.where('date').equals(iso).toArray(), [iso])
  const overrides = useOverrides([iso])
  const week = useWeekTargets(day, settings)

  if (!planner || !foods || !planned || !entries || !overrides || !week) return <div className="loading">Chargement…</div>

  const names = slotNames(iso, settings)
  const postSlot = postTrainingSlot(iso, settings)
  const rDay = ramadanDay(iso, settings)
  const t = week.targetFor(iso)
  const delta = week.budget.delta.get(iso) ?? 0
  const dayExtra = week.extras.get(iso)
  const training = trainingOn(day, settings, overrides)
  const consumed = roundMacros(totalOf(entries))
  const plannedTotal = roundMacros(dayTotal(planned, planner.byId))
  const plannedSorted = [...planned].sort((a, b) => names.order.indexOf(a.slot) - names.order.indexOf(b.slot))
  const eatenIds = new Set(entries.map((e) => e.fromPlannedMealId).filter(Boolean))
  const next = plannedSorted.find((m) => !eatenIds.has(m.id) && planner.byId.has(m.recipeId))
  const extra = entries
    .filter((e) => !e.fromPlannedMealId)
    .sort((a, b) => names.order.indexOf(a.slot ?? 'snack') - names.order.indexOf(b.slot ?? 'snack') || a.createdAt - b.createdAt)

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
    hint = <>Encore <strong>{leftP} g</strong>. {names.the[next.slot]} prévu {Math.abs(nextP - leftP) <= 3 ? 'les apporte pile.' : `en apporte ${nextP} g.`}</>
  } else hint = <>Encore <strong>{leftP} g</strong> pour atteindre ta cible.</>

  // Calories gérées sur la semaine : pourquoi la cible bouge, et ce qu'un dépassement change.
  const over = consumed.kcal - t.kcal
  const isPastOrToday = iso <= toISODate(new Date())
  let weekNote: ReactNode = null
  if (isPastOrToday && over > t.kcal * 0.05) {
    const cut = week.cutIfDayEndsAt(iso, consumed.kcal)
    weekNote = iso === week.dates[6]
      ? <>Tu dépasses de <strong>{over} kcal</strong>. C'est le dernier jour de la semaine : la suivante repart de zéro.</>
      : settings.weekBalance === false
        ? <>Tu dépasses de <strong>{over} kcal</strong>. La compensation sur la semaine est désactivée dans les réglages.</>
        : <>Tu dépasses de <strong>{over} kcal</strong> : si la journée s'arrête là, les jours suivants de la semaine passent à <strong>−{cut} kcal</strong>, protéines inchangées.</>
  } else if (dayExtra) {
    weekNote = <>{dayExtra.label} prévu : <strong>{deltaLabel(dayExtra.kcal)}</strong> déjà compris dans ta cible. Les autres jours de la semaine compensent.</>
  } else if (delta < 0) {
    weekNote = <>Cible allégée de <strong>{-delta} kcal</strong> pour équilibrer la semaine. Protéines inchangées.</>
  }

  // « Que manger maintenant ? » : créneau en cours, repas suivants, part habituelle des créneaux.
  const taken = new Set(entries.map((e) => e.slot).filter((x): x is MealSlot => !!x))
  const startIdx = names.chrono.indexOf(slotAt(new Date(), iso, settings))
  const nowSlot = names.chrono.slice(startIdx).find((s) => !taken.has(s)) ?? names.chrono[startIdx]
  const plannedLater = new Map(planned.filter((m) => !eatenIds.has(m.id) && planner.byId.has(m.recipeId))
    .map((m) => [m.slot, scaleMacros(planner.byId.get(m.recipeId)!.perServing, m.portionFactor)] as const))
  const baseKcal = week.baseFor(iso).kcal
  const shares = slotTargets(training, settings, postSlot)
  const k = baseKcal > 0 ? t.kcal / baseKcal : 1
  const slotShare = Object.fromEntries(Object.entries(shares).map(([s, m]) => [s, { ...m, kcal: m.kcal * k, carbs: m.carbs * k, fat: m.fat * k }])) as Record<MealSlot, Macros>

  const kind = `${rDay ? `Ramadan j${rDay} · ` : ''}${training ? 'Entraînement' : 'Repos'}`
  const subtitle = offset === 0 ? `${clean(SUB_FMT.format(day))} · ${kind}` : kind

  return (
    <>
      <ScreenHeader
        title={offset === 0 ? 'Aujourd\'hui' : TITLE_FMT.format(day)}
        subtitle={<>
          {subtitle}
          <button className="text-link" onClick={() => setDayType(true)}>· Changer</button>
          {offset !== 0 && <button className="text-link" onClick={() => setOffset(0)}>· Aujourd'hui</button>}
        </>}
        dot={training}
        action={<>
          <SquareButton label="Bilan de la semaine" onClick={() => nav.push({ type: 'review' })}><TrophyIcon /></SquareButton>
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
          {offset === 0 && (
            <button className="now-btn" onClick={() => setNowOpen(true)}>Que manger maintenant ?<ChevronIcon size={16} /></button>
          )}
        </div>
      </ScreenHeader>

      <section className="screen">
        {offset === 0 && (day.getDay() === 0 || day.getDay() === 1) && (
          <button className="review-banner" onClick={() => nav.push({ type: 'review' })}>
            <span className="lime"><TrophyIcon size={24} /></span>
            <span><strong>Ton bilan de la semaine</strong><span className="small muted">Jours réussis, série, protéines moyennes</span></span>
            <span className="lime"><ChevronIcon /></span>
          </button>
        )}
        <div className="stat-grid" style={{ marginTop: 26 }}>
          <Stat label="Kcal" value={consumed.kcal} target={t.kcal} color="var(--text)" />
          <Stat label="Glucides" value={consumed.carbs} target={t.carbs} color="var(--cyan)" />
          <Stat label="Lipides" value={consumed.fat} target={t.fat} color="var(--amber)" />
        </div>
        {weekNote && (
          <button className="week-note" onClick={() => setDayType(true)}>
            <span>{weekNote}</span>
            <ChevronIcon size={16} />
          </button>
        )}

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
              const after = training && m.slot === postSlot ? ' · après séance' : ''
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
                    <span className="caps">{names.short[m.slot]}{isNext ? ' · suivant' : after}</span>
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
                      <span className="caps">{e.slot ? names.label[e.slot] : 'Repas'}</span>
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

      {dayType && <DayTypeSheet date={iso} training={training} settings={settings} onClose={() => setDayType(false)} />}

      {nowOpen && (
        <NowSheet
          date={iso}
          names={names}
          defaultSlot={nowSlot}
          day={t}
          consumed={consumed}
          taken={taken}
          plannedLater={plannedLater}
          slotShare={slotShare}
          recipes={planner.list}
          foods={foods}
          eatenRecipeIds={new Set(entries.map((e) => e.recipeId).filter((x): x is string => !!x))}
          onAdd={async (e) => { await db.logEntries.add(e); setNowOpen(false) }}
          onOpenRecipe={(id) => { setNowOpen(false); nav.push({ type: 'recipe', id }) }}
          onClose={() => setNowOpen(false)}
        />
      )}
      {adding && (
        <AddEntrySheet
          date={iso}
          recipes={planner.list}
          foods={foods}
          names={names}
          defaultSlot={slotAt(new Date(), iso, settings)}
          onClose={() => setAdding(false)}
          onAdd={async (e) => { await db.logEntries.add(e); setAdding(false) }}
        />
      )}
    </>
  )
}
