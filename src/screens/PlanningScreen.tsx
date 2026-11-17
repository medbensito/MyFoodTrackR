import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { MealSlot, PlannedMeal, Settings } from '../types'
import { db } from '../db/db'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { useNav } from '../nav'
import { isTrainingDay, targetsForDate, toISODate, weekDays } from '../lib/targets'
import { shortDay } from '../lib/labels'
import { entryFromPlanned } from '../lib/journal'
import { newId, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import {
  dayTotal, gapLabel, generateWeek, slotTargets, suggestAdjustment, type Suggestion,
} from '../lib/planner'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl, bowlFor } from '../components/Bowl'
import { MealSheet } from '../components/MealSheet'
import { BackIcon, CalendarIcon, CheckCircleIcon, ChevronIcon, FlameIcon, PinIcon, PlusIcon, RefreshIcon, SparkIcon } from '../components/icons'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
const WEEK_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
const fmtFactor = (f: number) => `×${String(f).replace('.', ',')}`

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function PlanningScreen({ settings }: { settings: Settings }) {
  const nav = useNav()
  const today = new Date()
  const todayISO = toISODate(today)
  const [weekOffset, setWeekOffset] = useState(0)
  const days = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + weekOffset * 7)
    return weekDays(d)
  }, [weekOffset])
  const dates = useMemo(() => days.map(toISODate), [days])
  const trainingDates = useMemo(
    () => new Set(days.filter((d) => isTrainingDay(d, settings.trainingDays)).map(toISODate)),
    [days, settings.trainingDays],
  )

  const [selected, setSelected] = useState(todayISO)
  const [sheet, setSheet] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [suggestion, setSuggestion] = useState<{ date: string; s: Suggestion } | null>(null)
  const [busy, setBusy] = useState(false)
  const refs = useRef<Record<string, HTMLLIElement | null>>({})

  const planner = usePlannerRecipes()
  const meals = useLiveQuery(() => db.plannedMeals.where('date').anyOf(dates).toArray(), [dates.join()])
  const logs = useLiveQuery(() => db.logEntries.where('date').anyOf(dates).toArray(), [dates.join()])

  if (!planner || !meals || !logs) return <div className="loading">Chargement…</div>
  const { list: recipes, byId } = planner

  const mealsOf = (date: string) => meals.filter((m) => m.date === date)
  const eatenIds = new Set(logs.map((l) => l.fromPlannedMealId).filter(Boolean))

  const toggleEaten = async (meal: PlannedMeal) => {
    const existing = logs.find((l) => l.fromPlannedMealId === meal.id)
    if (existing) { await db.logEntries.delete(existing.id); return }
    const recipe = byId.get(meal.recipeId)
    if (recipe) await db.logEntries.add(entryFromPlanned(meal, recipe))
  }
  const pinnedCount = meals.filter((m) => m.pinned).length
  const hasPlan = meals.length > 0

  // ——— Actions ———
  const generate = async () => {
    setBusy(true)
    const pinned = meals.filter((m) => m.pinned)
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
    const result = generateWeek({ dates, trainingDates, settings, recipes, pinned }, seed)
    await db.transaction('rw', db.plannedMeals, async () => {
      await db.plannedMeals.bulkDelete(meals.filter((m) => !m.pinned).map((m) => m.id))
      await db.plannedMeals.bulkPut(result.meals.filter((m) => !m.pinned).map((m) => ({ ...m, id: newId('pm') })))
    })
    setSuggestion(null)
    setBusy(false)
  }

  /** Enregistre un repas modifié à la main, puis calcule une éventuelle proposition d'ajustement. */
  const saveMeal = async (meal: PlannedMeal) => {
    await db.plannedMeals.put(meal)
    const day = [...mealsOf(meal.date).filter((m) => m.id !== meal.id), meal]
    const s = suggestAdjustment(day, meal.id, targetsForDate(parseISO(meal.date), settings), byId)
    setSuggestion(s ? { date: meal.date, s } : null)
  }

  const applySuggestion = async () => {
    if (!suggestion) return
    const m = meals.find((x) => x.id === suggestion.s.mealId)
    if (m) await db.plannedMeals.put({ ...m, portionFactor: suggestion.s.to, pinned: true })
    setSuggestion(null)
  }

  const select = (iso: string) => {
    setSelected(iso)
    refs.current[iso]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ——— En-tête : aujourd'hui ———
  const todayTarget = targetsForDate(today, settings)
  const todayPlanned = roundMacros(dayTotal(meals.filter((m) => m.date === todayISO), byId))
  const pct = Math.round((todayPlanned.kcal / todayTarget.kcal) * 100)

  const sheetMeal = sheet ? mealsOf(sheet.date).find((m) => m.slot === sheet.slot) ?? null : null

  return (
    <>
      <ScreenHeader
        title="Planning"
        subtitle="Votre plan nutritionnel de la semaine"
        action={<RoundButton label="Revenir à aujourd'hui" onClick={() => { setWeekOffset(0); setSelected(todayISO) }}><CalendarIcon size={22} /></RoundButton>}
      >
        <div className="hero-card">
          <div className="hero-card-label"><span className="flame"><FlameIcon size={20} /></span> Objectif du jour</div>
          <div className="hero-card-value">{todayTarget.kcal}<small> kcal</small></div>
          <div className="hero-progress">
            <div className="hero-progress-track"><div className="hero-progress-fill" style={{ width: `${Math.min(100, Math.max(pct, 2))}%` }} /></div>
            <span>{pct}%</span>
          </div>
          <p className="hero-hint">
            {todayPlanned.kcal > 0
              ? `Prévu aujourd'hui : ${todayPlanned.kcal} kcal · ${todayPlanned.protein} g de protéines`
              : 'Rien de prévu aujourd\'hui pour l\'instant.'}
          </p>
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="week-nav">
          <button className="icon-plain" aria-label="Semaine précédente" onClick={() => setWeekOffset((w) => w - 1)}><BackIcon size={20} /></button>
          <span>Semaine du {WEEK_FMT.format(days[0])}</span>
          <button className="icon-plain" aria-label="Semaine suivante" onClick={() => setWeekOffset((w) => w + 1)}><ChevronIcon size={20} /></button>
        </div>

        <div className="day-chips" role="tablist" aria-label="Jours de la semaine">
          {days.map((d) => {
            const iso = toISODate(d)
            return (
              <button key={iso} role="tab" aria-selected={selected === iso}
                className={`day-chip ${selected === iso ? 'day-chip--on' : ''}`} onClick={() => select(iso)}>
                <span className="day-chip-name">{shortDay(d)}</span>
                <span className="day-chip-num">{d.getDate()}</span>
                <span className={`day-chip-dot ${trainingDates.has(iso) ? 'day-chip-dot--training' : ''}`} />
              </button>
            )
          })}
        </div>
        <p className="legend"><span className="day-chip-dot day-chip-dot--training" /> jour d'entraînement</p>

        {hasPlan ? (
          <div className="plan-actions">
            <button className="secondary secondary--icon" onClick={generate} disabled={busy}>
              <RefreshIcon /> Régénérer
            </button>
            <span className="muted small">
              {pinnedCount > 0
                ? `${pinnedCount} repas épinglé${pinnedCount > 1 ? 's' : ''} conservé${pinnedCount > 1 ? 's' : ''}`
                : 'Touche un repas pour le modifier'}
            </span>
          </div>
        ) : (
          <div className="card empty generate-card">
            <span className="spark"><SparkIcon size={28} /></span>
            <h2>Aucun repas planifié cette semaine</h2>
            <p className="muted">L'app compose 4 repas par jour à partir de tes recettes, en visant tes cibles. Tu pourras tout ajuster ensuite.</p>
            <button className="cta" onClick={generate} disabled={busy || recipes.length === 0}>
              Générer la semaine <SparkIcon />
            </button>
          </div>
        )}

        <ul className="day-list">
          {days.map((d) => {
            const iso = toISODate(d)
            const training = trainingDates.has(iso)
            const isToday = iso === todayISO
            const target = targetsForDate(d, settings)
            const dayMeals = mealsOf(iso)
            const total = roundMacros(dayTotal(dayMeals, byId))
            const gap = dayMeals.length > 0 ? gapLabel(total, target) : null
            const sug = suggestion?.date === iso ? suggestion.s : null
            const sugMeal = sug ? dayMeals.find((m) => m.id === sug.mealId) : undefined

            return (
              <li key={iso} ref={(el) => { refs.current[iso] = el }}
                className={`card day-card day-card--plan ${isToday ? 'day-card--today' : ''} ${selected === iso ? 'day-card--selected' : ''}`}>
                <div className="day-card-title">
                  <span className="day-name">{DAY_FMT.format(d)}</span>
                  {isToday && <span className="pill pill--green">En cours</span>}
                  <span className={`tag ${training ? 'tag--training' : 'tag--rest'}`}>{training ? 'Entraînement' : 'Repos'}</span>
                </div>

                {dayMeals.length === 0 ? (
                  <p className="day-card-status">Cible {target.kcal} kcal · P {target.protein} g · G {target.carbs} g · L {target.fat} g</p>
                ) : (
                  <>
                    <div className="day-total">
                      <span className="day-total-kcal"><b>{total.kcal}</b> / {target.kcal} kcal</span>
                      <span>P <b className="c-protein-text">{total.protein}</b>/{target.protein}</span>
                      <span>G <b>{total.carbs}</b>/{target.carbs}</span>
                      <span>L <b>{total.fat}</b>/{target.fat}</span>
                    </div>
                    <p className={`day-status ${gap ? 'day-status--gap' : 'day-status--ok'}`}>
                      {gap ? `Écart : ${gap}` : <><CheckCircleIcon size={16} filled /> Dans la cible</>}
                    </p>
                  </>
                )}

                {sug && sugMeal && (
                  <div className="suggestion">
                    <p>
                      <SparkIcon size={16} /> Proposition : passer « {byId.get(sugMeal.recipeId)?.name} » de {fmtFactor(sug.from)} à {fmtFactor(sug.to)}.
                      {' '}La journée passerait à {Math.round(sug.after.kcal)} kcal et {Math.round(sug.after.protein)} g de protéines.
                    </p>
                    <div className="suggestion-actions">
                      <button className="secondary" onClick={() => setSuggestion(null)}>Ignorer</button>
                      <button className="primary primary--sm" onClick={applySuggestion}>Appliquer</button>
                    </div>
                  </div>
                )}

                {hasPlan && (
                  <ul className="meal-rows">
                    {SLOT_ORDER.map((slot) => {
                      const meal = dayMeals.find((m) => m.slot === slot)
                      const r = meal ? byId.get(meal.recipeId) : undefined
                      const mm = r && meal ? roundMacros(scaleMacros(r.perServing, meal.portionFactor)) : null
                      return (
                        <li key={slot}>
                          <button className="plan-meal" onClick={() => setSheet({ date: iso, slot })}>
                            <span className="plan-meal-art">
                              {r ? <Bowl variant={bowlFor(r.name, r.slots)} size={48} /> : <span className="plan-meal-empty"><PlusIcon size={18} /></span>}
                            </span>
                            <span className="plan-meal-body">
                              <span className="plan-meal-slot">
                                {SLOT_LABEL[slot]}
                                {meal?.pinned && <span className="pin" aria-label="Épinglé"><PinIcon size={12} filled /></span>}
                                {meal && eatenIds.has(meal.id) && <span className="eaten-tag">Mangé</span>}
                              </span>
                              <strong className={meal && !r ? 'error' : undefined}>{r?.name ?? (meal ? 'Recette supprimée' : 'Ajouter un repas')}</strong>
                              {mm && meal && <span className="plan-meal-macros">{fmtFactor(meal.portionFactor)} · {mm.kcal} kcal · P {mm.protein} g</span>}
                            </span>
                            <ChevronIcon size={16} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {sheet && (
        <MealSheet
          key={`${sheet.date}-${sheet.slot}`}
          date={sheet.date}
          slot={sheet.slot}
          meal={sheetMeal}
          recipes={recipes}
          byId={byId}
          slotTarget={slotTargets(trainingDates.has(sheet.date), settings)[sheet.slot]}
          onClose={() => setSheet(null)}
          onSetRecipe={(recipeId, factor) => saveMeal(
            sheetMeal
              ? { ...sheetMeal, recipeId, portionFactor: factor, pinned: true }
              : { id: newId('pm'), date: sheet.date, slot: sheet.slot, recipeId, portionFactor: factor, pinned: true },
          )}
          onSetFactor={(f) => { if (sheetMeal) saveMeal({ ...sheetMeal, portionFactor: f, pinned: true }) }}
          onTogglePin={() => { if (sheetMeal) db.plannedMeals.put({ ...sheetMeal, pinned: !sheetMeal.pinned }) }}
          onRemove={async () => {
            if (!sheetMeal) return
            await db.plannedMeals.delete(sheetMeal.id)
            setSheet(null)
            const rest = mealsOf(sheetMeal.date).filter((m) => m.id !== sheetMeal.id)
            const s = rest.length ? suggestAdjustment(rest, sheetMeal.id, targetsForDate(parseISO(sheetMeal.date), settings), byId) : null
            setSuggestion(s ? { date: sheetMeal.date, s } : null)
          }}
          onOpenRecipe={(id) => { setSheet(null); nav.push({ type: 'recipe', id }) }}
          eaten={!!sheetMeal && eatenIds.has(sheetMeal.id)}
          onToggleEaten={() => { if (sheetMeal) toggleEaten(sheetMeal) }}
        />
      )}
    </>
  )
}
