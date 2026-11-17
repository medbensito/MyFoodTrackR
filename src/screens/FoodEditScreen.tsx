import { useEffect, useState } from 'react'
import { db, recipesUsingFood } from '../db/db'
import { useNav } from '../nav'
import type { Food, FoodState, Recipe } from '../types'
import { CATEGORY_LABEL, kcalFromMacros, newId } from '../lib/nutrition'
import { ScreenHeader } from '../components/ScreenHeader'

const STATES: FoodState[] = ['cru', 'cuit', 'conserve', 'liquide', 'solide', 'nature', 'sec']

const EMPTY: Food = {
  id: '', name: '', category: 'autre', state: 'cru',
  kcal: NaN, protein: NaN, carbs: NaN, fat: NaN, defaultPortionG: 100,
  source: 'saisie manuelle', verified: false, custom: true,
}

function Num({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input className="input input--num" type="number" inputMode="decimal" step="0.1" aria-label={label} value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )
}

export function FoodEditScreen({ id }: { id: string | null }) {
  const nav = useNav()
  const [draft, setDraft] = useState<Food | null>(id ? null : { ...EMPTY })
  const [usedBy, setUsedBy] = useState<Recipe[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    db.foods.get(id).then((f) => setDraft(f ? { ...f } : { ...EMPTY }))
    recipesUsingFood(id).then(setUsedBy)
  }, [id])

  if (!draft) return <div className="loading">Chargement…</div>

  const update = (patch: Partial<Food>) => setDraft({ ...draft, ...patch })
  const nums = [draft.kcal, draft.protein, draft.carbs, draft.fat]
  const numsOk = nums.every((n) => Number.isFinite(n) && n >= 0)
  const macroSumOk = !numsOk || draft.protein + draft.carbs + draft.fat <= 100
  const valid = draft.name.trim().length > 0 && numsOk && macroSumOk && draft.defaultPortionG > 0

  const computed = numsOk ? Math.round(kcalFromMacros(draft.protein, draft.carbs, draft.fat)) : null
  const gap = computed !== null && draft.kcal > 0 ? Math.abs(computed - draft.kcal) / draft.kcal : 0

  const save = async () => {
    if (!valid) return
    await db.foods.put({ ...draft, id: draft.id || newId('perso'), name: draft.name.trim(), source: draft.source.trim() || 'saisie manuelle' })
    nav.pop()
  }

  const remove = async () => {
    if (!id || usedBy.length > 0) return
    await db.foods.delete(id)
    nav.pop()
  }

  return (
    <>
      <ScreenHeader title={id ? draft.name || 'Aliment' : 'Nouvel aliment'} subtitle="Valeurs pour 100 g" back={nav.pop} />

      <section className="screen">
        <div className="card">
          <label className="stack-field">
            <span>Nom</span>
            <input className="input input--full" placeholder="Ex. Harira maison" value={draft.name}
              onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label className="field">
            <span>Catégorie</span>
            <select className="select" value={draft.category} onChange={(e) => update({ category: e.target.value })}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field">
            <span>État</span>
            <select className="select" value={draft.state} onChange={(e) => update({ state: e.target.value as FoodState })}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <p className="muted small" style={{ marginTop: 8 }}>Cru et cuit n'ont pas les mêmes valeurs : pèse dans l'état choisi.</p>
        </div>

        <div className="card">
          <h2>Pour 100 g</h2>
          <Num label="Calories" unit="kcal" value={draft.kcal} onChange={(v) => update({ kcal: v })} />
          <Num label="Protéines" unit="g" value={draft.protein} onChange={(v) => update({ protein: v })} />
          <Num label="Glucides" unit="g" value={draft.carbs} onChange={(v) => update({ carbs: v })} />
          <Num label="Lipides" unit="g" value={draft.fat} onChange={(v) => update({ fat: v })} />
          {computed !== null && (
            <p className={`small ${gap > 0.12 ? 'warn' : 'muted'}`} style={{ marginTop: 8 }}>
              Calcul depuis les macros : {computed} kcal
              {gap > 0.12 && ' — écart important avec les calories saisies, vérifie les valeurs.'}
            </p>
          )}
          {!macroSumOk && <p className="small error">Protéines + glucides + lipides dépassent 100 g.</p>}
        </div>

        <div className="card">
          <Num label="Portion par défaut" unit="g" value={draft.defaultPortionG} onChange={(v) => update({ defaultPortionG: v })} />
          <label className="field">
            <span>Source</span>
            <input className="input input--text" value={draft.source} onChange={(e) => update({ source: e.target.value })} />
          </label>
          <label className="field">
            <span>
              Valeurs vérifiées
              <span className="small muted block">Ciqual, étiquette ou autre source fiable</span>
            </span>
            <input type="checkbox" className="switch" checked={draft.verified}
              onChange={(e) => update({ verified: e.target.checked, source: e.target.checked && draft.source === 'approximation' ? 'Ciqual' : draft.source })} />
          </label>
          <a className="ext-link" href="https://ciqual.anses.fr/" target="_blank" rel="noreferrer">
            Ouvrir la table Ciqual (ANSES) ↗
          </a>
        </div>

        {!valid && <p className="footnote">Renseigne un nom, des valeurs positives et une portion pour enregistrer.</p>}
        <button className="btn btn--lime btn--block" style={{ marginTop: 6 }} disabled={!valid} onClick={save}>Enregistrer</button>

        {id && (
          <div className="danger-zone">
            {usedBy.length > 0 ? (
              <p className="small muted">
                Utilisé dans {usedBy.length} recette{usedBy.length > 1 ? 's' : ''} ({usedBy.map((r) => r.name).join(', ')}) :
                retire-le de ces recettes pour pouvoir le supprimer.
              </p>
            ) : confirmDelete ? (
              <>
                <p className="small">Supprimer définitivement « {draft.name} » ?</p>
                <div className="danger-actions">
                  <button className="btn btn--sm" onClick={() => setConfirmDelete(false)}>Annuler</button>
                  <button className="btn btn--danger btn--sm" onClick={remove}>Supprimer</button>
                </div>
              </>
            ) : (
              <button className="link-danger" onClick={() => setConfirmDelete(true)}>Supprimer l'aliment</button>
            )}
          </div>
        )}
      </section>
    </>
  )
}
