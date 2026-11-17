import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Food, LogEntry, MealSlot } from '../types'
import type { PlannerRecipe } from '../lib/planner'
import { fmtFactor, macrosForGrams, normalize, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { entryFromFood, entryFromRecipe, recentItems, slotForHour, type RecentItem } from '../lib/journal'
import { BackIcon, ChevronIcon, PlusIcon, StarIcon } from './icons'

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

  const recents = useLiveQuery(() => db.logEntries.toArray().then((es) => recentItems(es, 6)), [])
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])
  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])
  const favRecipes = recipes.filter((r) => r.favorite)
  const favFoods = foods.filter((f) => f.favorite)

  const recentTarget = (it: RecentItem): Picked | null => {
    if (it.recipeId) { const r = recipeById.get(it.recipeId); return r ? { kind: 'recipe', r } : null }
    const f = it.foodId ? foodById.get(it.foodId) : undefined
    return f ? { kind: 'food', f } : null
  }
  /** Ajout en un tap : même quantité que la dernière fois, créneau selon l'heure. */
  const quickAdd = (it: RecentItem) => {
    const t = recentTarget(it)
    if (!t) return
    const s = slotForHour(new Date().getHours())
    onAdd(t.kind === 'recipe' ? entryFromRecipe(date, s, t.r, it.portionFactor ?? 1) : entryFromFood(date, s, t.f, it.grams ?? t.f.defaultPortionG))
  }
  const openRecent = (it: RecentItem) => {
    const t = recentTarget(it)
    if (!t) return
    setPicked(t)
    if (t.kind === 'recipe') { setFactor(it.portionFactor ?? 1); if (t.r.slots.length === 1) setSlot(t.r.slots[0]) }
    else setGrams(it.grams ?? t.f.defaultPortionG)
  }
  const isFav = picked ? (picked.kind === 'recipe' ? !!picked.r.favorite : !!picked.f.favorite) : false
  const toggleFav = async () => {
    if (!picked) return
    if (picked.kind === 'recipe') {
      await db.recipes.update(picked.r.id, { favorite: !isFav })
      setPicked({ kind: 'recipe', r: { ...picked.r, favorite: !isFav } })
    } else {
      await db.foods.update(picked.f.id, { favorite: !isFav })
      setPicked({ kind: 'food', f: { ...picked.f, favorite: !isFav } })
    }
  }

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
          {picked && (
            <button className={`sq-btn ${isFav ? 'lime' : ''}`} aria-pressed={isFav} aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={toggleFav}>
              <StarIcon filled={isFav} />
            </button>
          )}
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>

        {!picked ? (
          <>
            {recents && recents.length > 0 && (
              <>
                <span className="caps">Récents · ajout en un tap</span>
                <div className="list" style={{ marginBottom: 14 }}>
                  {recents.map((it) => {
                    const m = roundMacros(it.macros)
                    const ok = !!recentTarget(it)
                    return (
                      <div key={it.key} className="list-row" style={{ padding: 0 }}>
                        <button className="list-main recent-open" disabled={!ok} onClick={() => openRecent(it)}>
                          <strong>{it.name}</strong>
                          <span className="caps">{it.grams ? `${it.grams} g` : fmtFactor(it.portionFactor ?? 1)} · {m.kcal} kcal · {m.protein} g P</span>
                        </button>
                        <button className="sq-btn recent-add" disabled={!ok} aria-label={`Ajouter ${it.name}`} onClick={() => quickAdd(it)}><PlusIcon size={20} /></button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            {(favRecipes.length > 0 || favFoods.length > 0) && (
              <>
                <span className="caps">Favoris</span>
                <div className="toggle-chips" style={{ margin: '8px 0 16px' }}>
                  {favRecipes.map((r) => (
                    <button key={r.id} className="chip chip--fav" onClick={() => pick({ kind: 'recipe', r })}><StarIcon size={14} filled /> {r.name}</button>
                  ))}
                  {favFoods.map((f) => (
                    <button key={f.id} className="chip chip--fav" onClick={() => pick({ kind: 'food', f })}><StarIcon size={14} filled /> {f.name}</button>
                  ))}
                </div>
              </>
            )}
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
                      <span className="list-main"><strong>{r.name}</strong><span className="caps">{r.favorite ? '★ ' : ''}1 portion</span></span>
                      <span className="list-num"><span className="k">{m.kcal}</span><br /><span className="p">{m.protein} g P</span></span>
                      <span className="chev"><ChevronIcon /></span>
                    </button>
                  )
                })
                : foodList.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => pick({ kind: 'food', f })}>
                    <span className="list-main"><strong>{f.name}</strong><span className="caps">{f.favorite ? '★ ' : ''}{f.state} · pour 100 g</span></span>
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
