import { useMemo, useState } from 'react'
import type { Food, LogEntry, MealSlot } from '../types'
import type { PlannerRecipe } from '../lib/planner'
import { fmtFactor, macrosForGrams, normalize, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { entryFromFood, entryFromRecipe, slotForHour } from '../lib/journal'
import { BackIcon, ChevronIcon } from './icons'

type Picked = { kind: 'recipe'; r: PlannerRecipe } | { kind: 'food'; f: Food }

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
  const recipeList = useMemo(() => recipes.filter((r) => !q || normalize(r.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'fr')), [recipes, q])
  const foodList = useMemo(() => foods.filter((f) => !q || normalize(f.name).includes(q)), [foods, q])

  const preview = picked
    ? roundMacros(picked.kind === 'recipe' ? scaleMacros(picked.r.perServing, factor) : macrosForGrams(picked.f, grams || 0))
    : null
  const valid = !!picked && (picked.kind === 'recipe' ? factor > 0 : grams > 0)

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
          {picked && <button className="sq-btn" aria-label="Retour" onClick={() => setPicked(null)}><BackIcon /></button>}
          <div className="bs-titles">
            <span className="caps caps--lime">Hors plan</span>
            <strong>{picked ? (picked.kind === 'recipe' ? picked.r.name : picked.f.name) : 'Ajouter un repas'}</strong>
          </div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        {!picked ? (
          <>
            <div className="segmented" role="tablist" style={{ marginTop: 0, marginBottom: 12 }}>
              <button role="tab" aria-selected={mode === 'recipe'} className={mode === 'recipe' ? 'seg--on' : ''} onClick={() => setMode('recipe')}>Recette</button>
              <button role="tab" aria-selected={mode === 'food'} className={mode === 'food' ? 'seg--on' : ''} onClick={() => setMode('food')}>Aliment</button>
            </div>
            <input className="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              aria-label={mode === 'recipe' ? 'Rechercher une recette' : 'Rechercher un aliment'}
              placeholder={mode === 'recipe' ? 'Rechercher une recette' : 'Rechercher un aliment'} />
            <div className="list" style={{ marginTop: 6 }}>
              {mode === 'recipe'
                ? recipeList.map((r) => {
                  const m = roundMacros(r.perServing)
                  return (
                    <button key={r.id} className="list-row" onClick={() => pick({ kind: 'recipe', r })}>
                      <span className="list-main"><strong>{r.name}</strong><span className="caps">1 portion</span></span>
                      <span className="list-num"><span className="k">{m.kcal}</span><br /><span className="p">{m.protein} g P</span></span>
                      <span className="chev"><ChevronIcon /></span>
                    </button>
                  )
                })
                : foodList.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => pick({ kind: 'food', f })}>
                    <span className="list-main"><strong>{f.name}</strong><span className="caps">{f.state} · pour 100 g</span></span>
                    <span className="list-num"><span className="k">{f.kcal}</span><br /><span className="p">{f.protein} g P</span></span>
                    <span className="chev"><ChevronIcon /></span>
                  </button>
                ))}
            </div>
            {(mode === 'recipe' ? recipeList : foodList).length === 0 && <p className="footnote">Aucun résultat.</p>}
          </>
        ) : (
          <>
            {preview && (
              <div className="preview">
                <div><span className="d">{preview.kcal}</span><span className="caps">kcal</span></div>
                <div><span className="d lime">{preview.protein}</span><span className="caps">g prot.</span></div>
                <div><span className="d cyan">{preview.carbs}</span><span className="caps">g gluc.</span></div>
                <div><span className="d amber">{preview.fat}</span><span className="caps">g lip.</span></div>
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
                    <input className="input input--num" type="number" inputMode="decimal" value={Number.isFinite(grams) ? grams : ''}
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
            <button className="btn btn--lime btn--block" disabled={!valid} onClick={add}>Ajouter au journal</button>
          </>
        )}
      </div>
    </div>
  )
}
