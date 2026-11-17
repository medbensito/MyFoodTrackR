import { useMemo, useState } from 'react'
import type { Food, LogEntry, MealSlot } from '../types'
import type { PlannerRecipe } from '../lib/planner'
import { macrosForGrams, normalize, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { entryFromFood, entryFromRecipe, slotForHour } from '../lib/journal'
import { Bowl, bowlFor } from './Bowl'
import { BackIcon, ChevronIcon } from './icons'

type Picked = { kind: 'recipe'; r: PlannerRecipe } | { kind: 'food'; f: Food }

const fmtFactor = (f: number) => `×${String(f).replace('.', ',')}`

/** Ajout libre au journal : une recette (en portions) ou un aliment (en grammes). */
export function AddEntrySheet({ date, recipes, foods, onAdd, onClose }: {
  date: string
  recipes: PlannerRecipe[]
  foods: Food[]
  onAdd: (e: LogEntry) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'recipe' | 'food'>('recipe')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Picked | null>(null)
  const [slot, setSlot] = useState<MealSlot>(slotForHour(new Date().getHours()))
  const [factor, setFactor] = useState(1)
  const [grams, setGrams] = useState(100)

  const q = normalize(query)
  const list = useMemo(() => (mode === 'recipe'
    ? recipes.filter((r) => !q || normalize(r.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    : foods.filter((f) => !q || normalize(f.name).includes(q))), [mode, q, recipes, foods])

  const preview = picked
    ? roundMacros(picked.kind === 'recipe' ? scaleMacros(picked.r.perServing, factor) : macrosForGrams(picked.f, grams || 0))
    : null
  const valid = picked && (picked.kind === 'recipe' ? factor > 0 : grams > 0)

  const pick = (p: Picked) => {
    setPicked(p)
    if (p.kind === 'recipe') { setFactor(1); if (p.r.slots.length === 1) setSlot(p.r.slots[0]) }
    else setGrams(p.f.defaultPortionG)
  }

  const add = () => {
    if (!picked || !valid) return
    onAdd(picked.kind === 'recipe' ? entryFromRecipe(date, slot, picked.r, factor) : entryFromFood(date, slot, picked.f, grams))
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet bottom-sheet--tall" role="dialog" aria-modal="true" aria-label="Ajouter au journal" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          {picked && <button className="round-btn round-btn--sm round-btn--light" aria-label="Retour" onClick={() => setPicked(null)}><BackIcon size={18} /></button>}
          <div className="bs-titles"><strong>{picked ? (picked.kind === 'recipe' ? picked.r.name : picked.f.name) : 'Ajouter un repas'}</strong></div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        {!picked ? (
          <div className="bs-body">
            <div className="segmented segmented--top" role="tablist">
              <button role="tab" aria-selected={mode === 'recipe'} className={mode === 'recipe' ? 'seg--on' : ''} onClick={() => setMode('recipe')}>Recette</button>
              <button role="tab" aria-selected={mode === 'food'} className={mode === 'food' ? 'seg--on' : ''} onClick={() => setMode('food')}>Aliment</button>
            </div>
            <input className="search-input search-input--sheet" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'recipe' ? 'Rechercher une recette' : 'Rechercher un aliment'} />
            {list.length === 0 && <p className="footnote">Aucun résultat.</p>}
            <ul className="card picker-list">
              {mode === 'recipe'
                ? (list as PlannerRecipe[]).map((r) => {
                  const m = roundMacros(r.perServing)
                  return (
                    <li key={r.id}>
                      <button className="picker-row" onClick={() => pick({ kind: 'recipe', r })}>
                        <Bowl variant={bowlFor(r.name, r.slots)} size={40} />
                        <span className="ing-name"><strong>{r.name}</strong><span className="small muted">1 portion · {m.kcal} kcal · P {m.protein} g</span></span>
                        <ChevronIcon />
                      </button>
                    </li>
                  )
                })
                : (list as Food[]).map((f) => (
                  <li key={f.id}>
                    <button className="picker-row" onClick={() => pick({ kind: 'food', f })}>
                      <span className="ing-name"><strong>{f.name}</strong><span className="small muted">{f.state} · {f.kcal} kcal · P {f.protein} g / 100 g</span></span>
                      <ChevronIcon />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="bs-body">
            {preview && (
              <div className="preview-card">
                <span className="preview-kcal">{preview.kcal}<small> kcal</small></span>
                <span>P <b className="c-protein-text">{preview.protein}</b> g</span>
                <span>G <b>{preview.carbs}</b> g</span>
                <span>L <b>{preview.fat}</b> g</span>
              </div>
            )}
            <div className="card">
              {picked.kind === 'recipe' ? (
                <div className="field">
                  <span>Portion</span>
                  <span className="stepper">
                    <button aria-label="Diminuer la portion" disabled={factor <= 0.25} onClick={() => setFactor(Math.max(0.25, factor - 0.25))}>−</button>
                    <strong>{fmtFactor(factor)}</strong>
                    <button aria-label="Augmenter la portion" disabled={factor >= 3} onClick={() => setFactor(Math.min(3, factor + 0.25))}>+</button>
                  </span>
                </div>
              ) : (
                <label className="field">
                  <span>Quantité <span className="small muted">({picked.f.state})</span></span>
                  <span className="field-input">
                    <input type="number" inputMode="decimal" value={Number.isFinite(grams) ? grams : ''}
                      onChange={(e) => setGrams(e.target.value === '' ? NaN : Number(e.target.value))} />
                    <span className="unit">g</span>
                  </span>
                </label>
              )}
              <div className="stack-field">
                <span>Créneau</span>
                <div className="toggle-chips">
                  {SLOT_ORDER.map((s) => (
                    <button key={s} aria-pressed={slot === s} className={`chip chip--sm ${slot === s ? 'chip--on' : ''}`} onClick={() => setSlot(s)}>
                      {SLOT_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="cta" disabled={!valid} onClick={add}>Ajouter au journal</button>
          </div>
        )}
      </div>
    </div>
  )
}
