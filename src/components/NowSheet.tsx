import { useState } from 'react'
import type { Food, LogEntry, Macros, MealSlot } from '../types'
import type { PlannerRecipe } from '../lib/planner'
import type { SlotNames } from '../lib/ramadan'
import { fmtFactor, roundMacros } from '../lib/nutrition'
import { nothingNeeded, suggestNow, targetForNow, withLeanFloor, type NowMode } from '../lib/now'
import { entryFromFood, entryFromRecipe } from '../lib/journal'
import { ChevronIcon, PlusIcon } from './icons'

/**
 * « Que manger maintenant ? » : 3 propositions pour le repas en cours (ou pour finir la journée),
 * à partir de ce qui reste, en gardant de quoi couvrir les repas suivants.
 */
export function NowSheet(p: {
  date: string
  names: SlotNames
  defaultSlot: MealSlot
  day: Macros
  consumed: Macros
  /** Créneaux qui ont déjà quelque chose dans le journal. */
  taken: Set<MealSlot>
  plannedLater: Map<MealSlot, Macros>
  slotShare: Record<MealSlot, Macros>
  recipes: PlannerRecipe[]
  foods: Food[]
  eatenRecipeIds: Set<string>
  onAdd: (e: LogEntry) => void
  onOpenRecipe: (id: string) => void
  onClose: () => void
}) {
  const [slot, setSlot] = useState<MealSlot>(p.defaultSlot)
  const [mode, setMode] = useState<NowMode>('meal')
  const later = p.names.chrono.slice(p.names.chrono.indexOf(slot) + 1).filter((s) => !p.taken.has(s))
  const effMode: NowMode = later.length === 0 ? 'rest' : mode
  const { target, lean } = withLeanFloor(roundMacros(targetForNow({ day: p.day, consumed: p.consumed, mode: effMode, later, plannedLater: p.plannedLater, slotShare: p.slotShare })))
  const options = suggestNow({ target, slot, recipes: p.recipes, foods: p.foods, eatenRecipeIds: p.eatenRecipeIds })
  const left = roundMacros({ kcal: p.day.kcal - p.consumed.kcal, protein: p.day.protein - p.consumed.protein, carbs: 0, fat: 0 })
  const theSlot = p.names.the[slot].toLowerCase()

  const add = (o: (typeof options)[number]) => {
    if (o.kind === 'recipe') {
      const r = p.recipes.find((x) => x.id === o.id)
      if (r) p.onAdd(entryFromRecipe(p.date, slot, r, o.factor ?? 1))
    } else {
      const f = p.foods.find((x) => x.id === o.id)
      if (f) p.onAdd(entryFromFood(p.date, slot, f, o.grams ?? f.defaultPortionG))
    }
  }

  return (
    <div className="sheet-backdrop" onClick={p.onClose}>
      <div className="bottom-sheet bottom-sheet--tall" role="dialog" aria-modal="true" aria-label="Que manger maintenant ?" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          <div className="bs-titles">
            <span className="caps caps--lime">Il reste {Math.max(0, left.kcal)} kcal · {Math.max(0, left.protein)} g P aujourd'hui</span>
            <strong>Que manger maintenant ?</strong>
          </div>
          <button className="bs-close" onClick={p.onClose}>Fermer</button>
        </div>

        <div className="toggle-chips" role="radiogroup" aria-label="Repas">
          {p.names.chrono.map((s) => (
            <button key={s} role="radio" aria-checked={slot === s} className={`chip chip--sm ${slot === s ? 'chip--on' : ''}`} onClick={() => setSlot(s)}>
              {p.names.short[s]}{p.taken.has(s) ? ' ✓' : ''}
            </button>
          ))}
        </div>

        {later.length > 0 && (
          <div className="segmented" role="radiogroup" aria-label="Portée" style={{ marginTop: 12 }}>
            <button role="radio" aria-checked={mode === 'meal'} className={mode === 'meal' ? 'seg--on' : ''} onClick={() => setMode('meal')}>Pour {theSlot}</button>
            <button role="radio" aria-checked={mode === 'rest'} className={mode === 'rest' ? 'seg--on' : ''} onClick={() => setMode('rest')}>Finir la journée</button>
          </div>
        )}

        <div className="now-target">
          <span className="caps">À viser</span>
          <p>
            <strong>{target.kcal} kcal</strong> · <strong className="lime">{target.protein} g</strong> de protéines
            <span className="muted"> · G {target.carbs} · L {target.fat}</span>
          </p>
          {lean && <span className="small amber block">Il reste peu de calories pour beaucoup de protéines : mise sur une source maigre.</span>}
          {effMode === 'meal' && later.length > 0 && (
            <span className="small muted">On garde de quoi couvrir {later.map((s) => p.names.the[s].toLowerCase()).join(', ')}.</span>
          )}
        </div>

        {nothingNeeded(target) ? (
          <div className="card empty" style={{ marginTop: 14 }}>
            <p>{effMode === 'rest' || later.length === 0
              ? 'Ta journée est bouclée : rien à ajouter. Un thé ou de l’eau si tu as un creux.'
              : `Rien de plus pour ${theSlot} : garde ta marge pour la suite.`}</p>
          </div>
        ) : (
          <div className="now-list">
            {options.map((o) => {
              const m = roundMacros(o.macros)
              return (
                <div key={`${o.kind}-${o.id}`} className="now-opt">
                  <button className="now-main" onClick={() => (o.kind === 'recipe' ? p.onOpenRecipe(o.id) : undefined)} disabled={o.kind !== 'recipe'}>
                    <span className="caps">{o.kind === 'recipe' ? `Recette · ${fmtFactor(o.factor ?? 1)}` : `Aliment · ${o.grams} g`}{o.fits && <span className="lime"> · pile dans la cible</span>}</span>
                    <strong>{o.name}{o.kind === 'recipe' && <ChevronIcon size={14} />}</strong>
                    <span className="now-macros">{m.kcal} kcal · <span className="lime">{m.protein} g P</span> · G {m.carbs} · L {m.fat}</span>
                  </button>
                  <button className="sq-btn now-add" aria-label={`Ajouter ${o.name} au journal`} onClick={() => add(o)}><PlusIcon size={20} /></button>
                </div>
              )
            })}
          </div>
        )}
        <p className="footnote">Touche + pour l'ajouter au journal, ou le nom d'une recette pour voir comment la préparer.</p>
      </div>
    </div>
  )
}
