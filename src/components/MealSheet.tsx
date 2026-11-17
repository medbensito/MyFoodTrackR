import { useMemo, useState } from 'react'
import type { Macros, MealSlot, PlannedMeal } from '../types'
import { fmtFactor, roundMacros, scaleMacros, SLOT_LABEL } from '../lib/nutrition'
import { bestFactor, type PlannerRecipe } from '../lib/planner'
import { BackIcon, CheckIcon, ChevronIcon } from './icons'

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
  eaten: boolean
  onToggleEaten: () => void
  /** Nom du créneau ce jour-là (Ftour, S'hour… pendant le Ramadan). */
  slotLabel?: string
}

export function MealSheet(p: MealSheetProps) {
  const [choosing, setChoosing] = useState(p.meal === null)
  const recipe = p.meal ? p.byId.get(p.meal.recipeId) : undefined
  const m = recipe && p.meal ? roundMacros(scaleMacros(recipe.perServing, p.meal.portionFactor)) : null
  const [y, mo, d] = p.date.split('-').map(Number)
  const dayLabel = DAY_FMT.format(new Date(y, mo - 1, d))

  const options = useMemo(() => p.recipes
    .filter((r) => r.slots.includes(p.slot))
    .map((r) => {
      const best = bestFactor(r.perServing, p.slotTarget)
      return { r, factor: best.factor, score: best.score, m: roundMacros(scaleMacros(r.perServing, best.factor)) }
    })
    .sort((a, b) => a.score - b.score), [p.recipes, p.slot, p.slotTarget])

  return (
    <div className="sheet-backdrop" onClick={p.onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label={`${p.slotLabel ?? SLOT_LABEL[p.slot]}, ${dayLabel}`} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          {choosing && p.meal && (
            <button className="sq-btn" aria-label="Retour" onClick={() => setChoosing(false)}><BackIcon /></button>
          )}
          <div className="bs-titles">
            <span className="caps caps--lime">{dayLabel}</span>
            <strong>{choosing ? 'Choisir une recette' : p.slotLabel ?? SLOT_LABEL[p.slot]}</strong>
          </div>
          <button className="bs-close" onClick={p.onClose}>Fermer</button>
        </div>

        {choosing ? (
          <>
            <p className="bs-hint">Les plus adaptées à ce créneau d'abord, avec la portion conseillée.</p>
            {options.length === 0 && <p className="footnote">Aucune recette pour ce créneau. Crée-en une dans Recettes.</p>}
            <div className="list">
              {options.map(({ r, factor, m: om }) => (
                <button key={r.id} className="list-row" onClick={() => { p.onSetRecipe(r.id, factor); setChoosing(false) }}>
                  <span className="list-main">
                    <strong>{r.name}</strong>
                    <span className="caps">{fmtFactor(factor)}{p.meal?.recipeId === r.id ? ' · actuel' : ''}</span>
                  </span>
                  <span className="list-num"><span className="k">{om.kcal}</span><br /><span className="p">{om.protein} g P</span></span>
                  <span className="chev"><ChevronIcon /></span>
                </button>
              ))}
            </div>
          </>
        ) : p.meal && (
          <>
            {recipe && m ? (
              <button className="card" style={{ width: '100%', textAlign: 'left', color: 'inherit' }} onClick={() => p.onOpenRecipe(recipe.id)}>
                <span className="caps">Recette · voir le détail</span>
                <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, lineHeight: 0.95, textTransform: 'uppercase' }}>{recipe.name}</span>
                <span className="preview" style={{ margin: '12px 0 0', padding: 0, border: 0, background: 'none' }}>
                  <span><span className="d">{m.kcal}</span><span className="caps">kcal</span></span>
                  <span><span className="d lime">{m.protein}</span><span className="caps">g prot.</span></span>
                  <span><span className="d cyan">{m.carbs}</span><span className="caps">g gluc.</span></span>
                  <span><span className="d amber">{m.fat}</span><span className="caps">g lip.</span></span>
                </span>
              </button>
            ) : (
              <div className="card"><p className="error">Cette recette a été supprimée.</p></div>
            )}

            <button className={`btn btn--block eaten-btn ${p.eaten ? 'btn--lime' : 'btn--outline'}`} aria-pressed={p.eaten} disabled={!recipe} onClick={p.onToggleEaten}>
              {p.eaten ? <><CheckIcon /> Mangé</> : 'Marquer comme mangé'}
            </button>

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
              <label className="field">
                <span>
                  Épinglé
                  <span className="small muted block">« Régénérer » ne touche pas aux repas épinglés</span>
                </span>
                <input type="checkbox" className="switch" checked={p.meal.pinned} onChange={p.onTogglePin} />
              </label>
            </div>

            <button className="btn btn--block" onClick={() => setChoosing(true)}>Changer de recette</button>
            <div className="danger-zone">
              <button className="link-danger" onClick={p.onRemove}>Retirer ce repas</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
