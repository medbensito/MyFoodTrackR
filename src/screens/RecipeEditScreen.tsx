import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { useFoods, useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import type { MealSlot, Recipe } from '../types'
import { macrosForGrams, newId, recipeTotals, roundMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { ScreenHeader } from '../components/ScreenHeader'
import { FoodPicker } from '../components/FoodPicker'
import { PlusIcon } from '../components/icons'

const EMPTY: Recipe = { id: '', name: '', servings: 1, slots: [], ingredients: [], notes: '' }

export function RecipeEditScreen({ id }: { id: string | null }) {
  const nav = useNav()
  const foodsList = useFoods()
  const foods = useFoodsMap()
  const [draft, setDraft] = useState<Recipe | null>(id ? null : { ...EMPTY })
  const [picking, setPicking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    db.recipes.get(id).then((r) => setDraft(r ? structuredClone(r) : { ...EMPTY }))
  }, [id])

  if (!draft || !foods || !foodsList) return <div className="loading">Chargement…</div>

  const update = (patch: Partial<Recipe>) => setDraft({ ...draft, ...patch })
  const setGrams = (i: number, grams: number) =>
    update({ ingredients: draft.ingredients.map((ing, k) => (k === i ? { ...ing, grams } : ing)) })
  const removeIng = (i: number) => update({ ingredients: draft.ingredients.filter((_, k) => k !== i) })
  const toggleSlot = (s: MealSlot) =>
    update({ slots: draft.slots.includes(s) ? draft.slots.filter((x) => x !== s) : [...draft.slots, s] })

  const totals = recipeTotals(draft, foods)
  const per = roundMacros(totals.perServing)
  const total = roundMacros(totals.total)

  const problems: string[] = []
  if (!draft.name.trim()) problems.push('un nom')
  if (draft.slots.length === 0) problems.push('au moins un créneau')
  if (draft.ingredients.length === 0) problems.push('au moins un ingrédient')
  if (draft.ingredients.some((i) => !Number.isFinite(i.grams) || i.grams <= 0)) problems.push('des quantités valides')
  if (!(draft.servings >= 1)) problems.push('au moins 1 portion')
  const valid = problems.length === 0

  const save = async () => {
    if (!valid) return
    const recipe: Recipe = {
      ...draft,
      id: draft.id || newId('rec'),
      name: draft.name.trim(),
      servings: Math.round(draft.servings),
      notes: draft.notes?.trim() || undefined,
    }
    await db.recipes.put(recipe)
    if (id) nav.pop()
    else nav.replace({ type: 'recipe', id: recipe.id })
  }

  const remove = async () => {
    if (!id) return
    await db.recipes.delete(id)
    nav.pop() // éditeur
    nav.pop() // fiche
  }

  return (
    <>
      <ScreenHeader title={id ? 'Modifier' : 'Nouvelle recette'} subtitle={id ? draft.name : 'Les macros se calculent en direct'} back={nav.pop}>
        <div className="hero-card live-macros">
          <div className="live-main">
            <span className="hero-card-label">Par portion</span>
            <span className="hero-card-value">{per.kcal}<small> kcal</small></span>
          </div>
          <div className="live-grid">
            <span><b className="c-protein">{per.protein}</b> g P</span>
            <span><b>{per.carbs}</b> g G</span>
            <span><b>{per.fat}</b> g L</span>
          </div>
          {draft.servings > 1 && <p className="live-total">Recette entière : {total.kcal} kcal · P {total.protein} g</p>}
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="card">
          <label className="stack-field">
            <span>Nom</span>
            <input className="text-input text-input--full" placeholder="Ex. Poulet curry et riz" value={draft.name}
              onChange={(e) => update({ name: e.target.value })} />
          </label>
          <div className="field">
            <span>Portions</span>
            <span className="stepper">
              <button aria-label="Moins" onClick={() => update({ servings: Math.max(1, draft.servings - 1) })}>−</button>
              <strong>{draft.servings}</strong>
              <button aria-label="Plus" onClick={() => update({ servings: Math.min(20, draft.servings + 1) })}>+</button>
            </span>
          </div>
          <div className="stack-field">
            <span>Créneaux</span>
            <div className="toggle-chips">
              {SLOT_ORDER.map((s) => (
                <button key={s} aria-pressed={draft.slots.includes(s)}
                  className={`chip chip--sm ${draft.slots.includes(s) ? 'chip--on' : ''}`} onClick={() => toggleSlot(s)}>
                  {SLOT_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="section-head">
          <h2>Ingrédients</h2>
          <span className="muted small">{Math.round(totals.totalGrams)} g au total</span>
        </div>
        {draft.ingredients.length > 0 && (
          <ul className="card ing-list">
            {draft.ingredients.map((ing, i) => {
              const food = foods.get(ing.foodId)
              const im = food ? roundMacros(macrosForGrams(food, ing.grams || 0)) : null
              return (
                <li key={`${ing.foodId}-${i}`} className="ing-row">
                  <span className="ing-name">
                    <strong className={food ? undefined : 'error'}>{food?.name ?? 'Aliment supprimé'}</strong>
                    <span className="small muted">
                      {im ? `${im.kcal} kcal · P ${im.protein} g` : 'non compté'}
                      {food && !food.verified && <span className="tag tag--warn">à vérifier</span>}
                    </span>
                  </span>
                  <span className="grams-input">
                    <input type="number" inputMode="decimal" aria-label={`Grammes de ${food?.name ?? 'aliment'}`}
                      value={Number.isFinite(ing.grams) ? ing.grams : ''}
                      onChange={(e) => setGrams(i, e.target.value === '' ? NaN : Number(e.target.value))} />
                    <span className="unit">g</span>
                  </span>
                  <button className="remove-btn" aria-label={`Retirer ${food?.name ?? 'l\'ingrédient'}`} onClick={() => removeIng(i)}>×</button>
                </li>
              )
            })}
          </ul>
        )}
        <button className="add-row" onClick={() => setPicking(true)}><PlusIcon /> Ajouter un ingrédient</button>

        <div className="section-head"><h2>Préparation</h2><span className="muted small">facultatif</span></div>
        <div className="card">
          <textarea className="textarea" rows={3} placeholder="Étapes, astuces…" value={draft.notes ?? ''}
            onChange={(e) => update({ notes: e.target.value })} />
        </div>

        {!valid && <p className="footnote">Pour enregistrer, il manque {problems.join(', ')}.</p>}
        <button className="cta" disabled={!valid} onClick={save}>Enregistrer</button>

        {id && (
          <div className="danger-zone">
            {confirmDelete ? (
              <>
                <p className="small">Supprimer définitivement « {draft.name} » ?</p>
                <div className="danger-actions">
                  <button className="secondary" onClick={() => setConfirmDelete(false)}>Annuler</button>
                  <button className="danger" onClick={remove}>Supprimer</button>
                </div>
              </>
            ) : (
              <button className="link-danger" onClick={() => setConfirmDelete(true)}>Supprimer la recette</button>
            )}
          </div>
        )}
      </section>

      {picking && (
        <FoodPicker
          foods={foodsList}
          onClose={() => setPicking(false)}
          onPick={(f) => {
            update({ ingredients: [...draft.ingredients, { foodId: f.id, grams: f.defaultPortionG }] })
            setPicking(false)
          }}
        />
      )}
    </>
  )
}
