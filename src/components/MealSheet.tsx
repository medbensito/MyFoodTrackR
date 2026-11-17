import { useMemo, useState } from 'react'
import type { Macros, MealSlot, PlannedMeal } from '../types'
import { roundMacros, scaleMacros, SLOT_LABEL } from '../lib/nutrition'
import { bestFactor, type PlannerRecipe } from '../lib/planner'
import { Bowl, bowlFor } from './Bowl'
import { BackIcon, ChevronIcon, PinIcon } from './icons'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export type MealSheetProps = {
  date: string
  slot: MealSlot
  meal: PlannedMeal | null
  recipes: PlannerRecipe[]
  byId: Map<string, PlannerRecipe>
  /** Cible du créneau, pour classer les recettes de remplacement. */
  slotTarget: Macros
  onClose: () => void
  onSetRecipe: (recipeId: string, factor: number) => void
  onSetFactor: (factor: number) => void
  onTogglePin: () => void
  onRemove: () => void
  onOpenRecipe: (recipeId: string) => void
}

const fmtFactor = (f: number) => `×${String(f).replace('.', ',')}`

export function MealSheet(p: MealSheetProps) {
  const [choosing, setChoosing] = useState(p.meal === null)
  const recipe = p.meal ? p.byId.get(p.meal.recipeId) : undefined
  const m = recipe && p.meal ? roundMacros(scaleMacros(recipe.perServing, p.meal.portionFactor)) : null
  const [y, mo, d] = p.date.split('-').map(Number)
  const dayLabel = DAY_FMT.format(new Date(y, mo - 1, d))

  const options = useMemo(() => {
    return p.recipes
      .filter((r) => r.slots.includes(p.slot))
      .map((r) => {
        const best = bestFactor(r.perServing, p.slotTarget)
        return { r, factor: best.factor, score: best.score, m: roundMacros(scaleMacros(r.perServing, best.factor)) }
      })
      .sort((a, b) => a.score - b.score)
  }, [p.recipes, p.slot, p.slotTarget])

  return (
    <div className="sheet-backdrop" onClick={p.onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label={`${SLOT_LABEL[p.slot]} du ${dayLabel}`} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          {choosing && p.meal ? (
            <button className="round-btn round-btn--sm round-btn--light" aria-label="Retour" onClick={() => setChoosing(false)}><BackIcon size={18} /></button>
          ) : null}
          <div className="bs-titles">
            <strong>{SLOT_LABEL[p.slot]}</strong>
            <span className="muted small">{dayLabel}</span>
          </div>
          <button className="bs-close" onClick={p.onClose}>Fermer</button>
        </div>

        {choosing ? (
          <div className="bs-body">
            <p className="muted small">Classées de la plus adaptée à la moins adaptée pour ce créneau, avec la portion conseillée.</p>
            {options.length === 0 && <p className="footnote">Aucune recette pour ce créneau. Crée-en une dans l'onglet Recettes.</p>}
            <ul className="card picker-list">
              {options.map(({ r, factor, m: om }) => (
                <li key={r.id}>
                  <button className="picker-row" onClick={() => { p.onSetRecipe(r.id, factor); setChoosing(false) }}>
                    <Bowl variant={bowlFor(r.name, r.slots)} size={44} />
                    <span className="ing-name">
                      <strong>{r.name}</strong>
                      <span className="small muted">{fmtFactor(factor)} · {om.kcal} kcal · P {om.protein} g</span>
                    </span>
                    {p.meal?.recipeId === r.id && <span className="pill pill--green">Actuel</span>}
                    <ChevronIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : p.meal && (
          <div className="bs-body">
            {recipe && m ? (
              <button className="card meal-current" onClick={() => p.onOpenRecipe(recipe.id)}>
                <Bowl variant={bowlFor(recipe.name, recipe.slots)} size={64} />
                <span className="ing-name">
                  <strong>{recipe.name}</strong>
                  <span className="small muted">{m.kcal} kcal · P {m.protein} g · G {m.carbs} g · L {m.fat} g</span>
                  <span className="small link">Voir la recette</span>
                </span>
              </button>
            ) : (
              <div className="card"><p className="error">Cette recette a été supprimée.</p></div>
            )}

            <div className="card">
              <div className="field">
                <span>Portion</span>
                <span className="stepper">
                  <button aria-label="Diminuer la portion" disabled={p.meal.portionFactor <= 0.25}
                    onClick={() => p.onSetFactor(Math.max(0.25, p.meal!.portionFactor - 0.25))}>−</button>
                  <strong>{fmtFactor(p.meal.portionFactor)}</strong>
                  <button aria-label="Augmenter la portion" disabled={p.meal.portionFactor >= 3}
                    onClick={() => p.onSetFactor(Math.min(3, p.meal!.portionFactor + 0.25))}>+</button>
                </span>
              </div>
              <label className="field switch-field">
                <span>
                  Épinglé
                  <span className="small muted block">« Régénérer » ne touche pas aux repas épinglés</span>
                </span>
                <input type="checkbox" className="switch" checked={p.meal.pinned} onChange={p.onTogglePin} />
              </label>
            </div>

            <button className="cta cta--light" onClick={() => setChoosing(true)}>Changer de recette</button>
            <div className="danger-zone">
              <button className="link-danger" onClick={p.onRemove}>Retirer ce repas</button>
            </div>
          </div>
        )}
        {!choosing && p.meal?.pinned && <p className="bs-pin"><PinIcon size={14} filled /> Modifié à la main</p>}
      </div>
    </div>
  )
}
