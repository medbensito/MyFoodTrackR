import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { MealSlot, PlannedMeal, Settings } from '../types'
import { db } from '../db/db'
import { usePlannerRecipes } from '../db/usePlannerRecipes'
import { useNav } from '../nav'
import { isoWeek, isTrainingDay, targetsForDate, toISODate, weekDays } from '../lib/targets'
import { entryFromPlanned } from '../lib/journal'
import { fmtFactor, newId, roundMacros, scaleMacros, SLOT_ORDER, SLOT_SHORT } from '../lib/nutrition'
import {
  dayTotal, gapLabel, generateWeek, POST_TRAINING_SLOT, slotTargets, suggestAdjustment, withinTolerance, type Suggestion,
} from '../lib/planner'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { MealSheet } from '../components/MealSheet'
import { BackIcon, CheckIcon, ChevronIcon, PinIcon, PlusIcon, RefreshIcon } from '../components/icons'

const DN = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
const LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' })
const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function PlanningScreen({ settings }: { settings: Settings }) {
  const nav = useNav()
  const todayISO = toISODate(new Date())
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

  const [picked, setPicked] = useState<string | null>(null)
  const selected = picked && dates.includes(picked) ? picked : dates.includes(todayISO) ? todayISO : dates[0]
  const [sheet, setSheet] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [suggestion, setSuggestion] = useState<{ date: string; s: Suggestion } | null>(null)
  const [busy, setBusy] = useState(false)

  const planner = usePlannerRecipes()
  const meals = useLiveQuery(() => db.plannedMeals.where('date').anyOf(dates).toArray(), [dates.join()])
  const logs = useLiveQuery(() => db.logEntries.where('date').anyOf(dates).toArray(), [dates.join()])

  if (!planner || !meals || !logs) return <div className="loading">Chargement…</div>
  const { list: recipes, byId } = planner

  const mealsOf = (date: string) => meals.filter((m) => m.date === date)
  const eatenIds = new Set(logs.map((l) => l.fromPlannedMealId).filter(Boolean))
  const hasPlan = meals.length > 0
  const pinnedCount = meals.filter((m) => m.pinned).length

  const dayStatus = (iso: string) => {
    const dm = mealsOf(iso)
    if (dm.length === 0) return null
    const total = roundMacros(dayTotal(dm, byId))
    const target = targetsForDate(parseISO(iso), settings)
    return { total, target, ok: withinTolerance(total, target), gap: gapLabel(total, target) }
  }
  const okDays = dates.filter((d) => dayStatus(d)?.ok).length
  const plannedDays = dates.filter((d) => mealsOf(d).length > 0).length

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

  const toggleEaten = async (meal: PlannedMeal) => {
    const existing = logs.find((l) => l.fromPlannedMealId === meal.id)
    if (existing) { await db.logEntries.delete(existing.id); return }
    const recipe = byId.get(meal.recipeId)
    if (recipe) await db.logEntries.add(entryFromPlanned(meal, recipe))
  }

  // ——— Rendu ———
  const first = days[0], last = days[6]
  const range = first.getMonth() === last.getMonth()
    ? `${first.getDate()} — ${last.getDate()} ${MONTH.format(last).replace('.', '')}`
    : `${first.getDate()} ${MONTH.format(first).replace('.', '')} — ${last.getDate()} ${MONTH.format(last).replace('.', '')}`
  const postSlot = POST_TRAINING_SLOT[settings.trainingTime]
  const postLabel = { breakfast: 'au petit-déj', lunch: 'au déjeuner', dinner: 'au dîner', snack: 'à la collation' }[postSlot]

  const selDate = parseISO(selected)
  const selTraining = trainingDates.has(selected)
  const selMeals = mealsOf(selected)
  const selStatus = dayStatus(selected)
  const selTarget = targetsForDate(selDate, settings)
  const sug = suggestion?.date === selected ? suggestion.s : null
  const sugMeal = sug ? selMeals.find((m) => m.id === sug.mealId) : undefined
  const sheetMeal = sheet ? mealsOf(sheet.date).find((m) => m.slot === sheet.slot) ?? null : null

  return (
    <>
      <ScreenHeader
        title={`Semaine ${isoWeek(first)}`}
        subtitle={<>
          {range}
          {hasPlan
            ? <span className="lime">· {okDays}/{plannedDays} dans la cible</span>
            : <span>· à planifier</span>}
          {weekOffset !== 0 && <button className="text-link" onClick={() => { setWeekOffset(0); setPicked(null) }}>· Cette semaine</button>}
        </>}
        action={<>
          <SquareButton label="Semaine précédente" onClick={() => { setWeekOffset((w) => w - 1); setPicked(null) }}><BackIcon /></SquareButton>
          <SquareButton label="Semaine suivante" onClick={() => { setWeekOffset((w) => w + 1); setPicked(null) }}><ChevronIcon size={20} /></SquareButton>
        </>}
      >
        <div className="day-picker" role="tablist" aria-label="Jours de la semaine">
          {days.map((d, i) => {
            const iso = dates[i]
            const st = dayStatus(iso)
            return (
              <button key={iso} role="tab" aria-selected={selected === iso}
                aria-label={`${LONG.format(d)}${trainingDates.has(iso) ? ', entraînement' : ', repos'}${st ? (st.ok ? ', dans la cible' : ', écart') : ''}`}
                className={`day-btn ${selected === iso ? 'day-btn--sel' : ''} ${iso === todayISO ? 'day-btn--today' : ''}`}
                onClick={() => setPicked(iso)}>
                <span className="dn">{DN[d.getDay()]}</span>
                <span className="dd">{d.getDate()}</span>
                <span className={`dt ${trainingDates.has(iso) ? 'on' : ''}`} />
              </button>
            )
          })}
        </div>
        <div className="picker-legend">
          <span><i />entraînement · glucides {postLabel}</span>
          {hasPlan && (
            <button className="btn btn--outline btn--sm" onClick={generate} disabled={busy}>
              <RefreshIcon /> Régénérer
            </button>
          )}
        </div>
      </ScreenHeader>

      <section className="screen">
        {!hasPlan ? (
          <div className="generate">
            <h2>Semaine vide</h2>
            <p>L'app compose 4 repas par jour avec tes recettes, en visant tes cibles. Tu ajustes ensuite ce que tu veux.</p>
            <button className="btn btn--lime btn--block" onClick={generate} disabled={busy || recipes.length === 0}>Générer la semaine</button>
          </div>
        ) : (
          <div className="day-card">
            <div className="day-card-head">
              <span className="caps" style={{ fontSize: 12, letterSpacing: '0.12em' }}>{LONG.format(selDate)} · {selTraining ? 'Entraînement' : 'Repos'}</span>
              {selStatus && (selStatus.ok
                ? <span className="tag tag--lime">Dans la cible</span>
                : <span className="tag tag--amber">Écart</span>)}
            </div>
            <div className="day-card-total">
              <span className="d">{selStatus?.total.kcal ?? 0}<small> / {selTarget.kcal} kcal</small></span>
              <span className="p">{selStatus?.total.protein ?? 0} g P</span>
            </div>
            {selStatus?.gap && <p className="small amber" style={{ marginTop: 8 }}>{selStatus.gap}</p>}

            {sug && sugMeal && (
              <div className="suggestion">
                Proposition : passer <strong>{byId.get(sugMeal.recipeId)?.name}</strong> de {fmtFactor(sug.from)} à {fmtFactor(sug.to)}.
                {' '}La journée passerait à <strong>{Math.round(sug.after.kcal)} kcal</strong> et <strong>{Math.round(sug.after.protein)} g</strong> de protéines.
                <div className="suggestion-actions">
                  <button className="btn btn--sm" onClick={() => setSuggestion(null)}>Ignorer</button>
                  <button className="btn btn--lime btn--sm" onClick={applySuggestion}>Appliquer</button>
                </div>
              </div>
            )}

            <div>
              {SLOT_ORDER.map((slot) => {
                const meal = selMeals.find((m) => m.slot === slot)
                const r = meal ? byId.get(meal.recipeId) : undefined
                const mm = r && meal ? roundMacros(scaleMacros(r.perServing, meal.portionFactor)) : null
                const eaten = meal ? eatenIds.has(meal.id) : false
                return (
                  <button key={slot} className="meal-btn" onClick={() => setSheet({ date: selected, slot })}>
                    <span className="meal-slot">
                      {SLOT_SHORT[slot]}
                      {(meal?.pinned || eaten) && (
                        <span className="marks">
                          {meal?.pinned && <span aria-label="Épinglé"><PinIcon /></span>}
                          {eaten && <span aria-label="Mangé"><CheckIcon size={12} /></span>}
                        </span>
                      )}
                    </span>
                    {meal ? (
                      <>
                        <span className={`meal-name ${r ? '' : 'error'}`}>{r?.name ?? 'Recette supprimée'}</span>
                        <span className={`factor ${slot === postSlot && selTraining ? 'factor--hot' : ''}`}>{fmtFactor(meal.portionFactor)}</span>
                        <span className="meal-kcal">{mm?.kcal ?? '—'}</span>
                      </>
                    ) : (
                      <span className="meal-name meal-name--empty"><PlusIcon size={14} /> Ajouter un repas</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {hasPlan && (
          <>
            <div className="section-label">
              <span>Reste de la semaine</span>
              {pinnedCount > 0 && <span className="small muted">{pinnedCount} épinglé{pinnedCount > 1 ? 's' : ''}</span>}
            </div>
            <div>
              {days.map((d, i) => {
                const iso = dates[i]
                if (iso === selected) return null
                const st = dayStatus(iso)
                return (
                  <button key={iso} className={`week-row ${iso === todayISO ? 'week-row--today' : ''}`} onClick={() => setPicked(iso)}>
                    <span className="wd">{DN[d.getDay()]} {d.getDate()}</span>
                    <span className="wt">{trainingDates.has(iso) ? 'Entraînement' : 'Repos'}</span>
                    <span className="wk">{st ? st.total.kcal : '—'}</span>
                    <span className="wp">{st ? `${st.total.protein} g` : ''}</span>
                    <span className="ws">
                      {st && (st.ok
                        ? <span className="lime" aria-label="Dans la cible"><CheckIcon /></span>
                        : <span className="amber" aria-label="Écart">●</span>)}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
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
