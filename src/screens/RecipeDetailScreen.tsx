import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import { macroShares } from '../lib/labels'
import { fmtFactor, macrosForGrams, recipeTotals, roundMacros, scaleMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { ScreenHeader } from '../components/ScreenHeader'
import { AddToPlanSheet } from '../components/AddToPlanSheet'
import { CheckIcon, StarIcon } from '../components/icons'
import { fmtMinutes, piecesLabel, stepParts, totalMinutes } from '../lib/steps'

export function RecipeDetailScreen({ id }: { id: string }) {
  const nav = useNav()
  const recipe = useLiveQuery(() => db.recipes.get(id).then((r) => r ?? null), [id])
  const foods = useFoodsMap()
  /** Aperçu d'une autre portion : ne modifie pas la recette. */
  const [factor, setFactor] = useState(1)
  const [planning, setPlanning] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  /** Étapes cochées pendant la préparation (non enregistré). */
  const [checked, setChecked] = useState<Set<number>>(new Set())

  if (recipe === undefined || !foods) return <div className="loading">Chargement…</div>
  if (recipe === null) return null

  const totals = recipeTotals(recipe, foods)
  const m = roundMacros(scaleMacros(totals.perServing, factor))
  const shares = macroShares(roundMacros(totals.perServing))
  const portionGrams = Math.round((totals.totalGrams / Math.max(1, recipe.servings)) * factor)
  const slotsLabel = SLOT_ORDER.filter((s) => recipe.slots.includes(s)).map((s) => SLOT_LABEL[s]).join(' / ')
  const edit = () => nav.push({ type: 'recipe-edit', id })
  const ingFactor = factor / Math.max(1, recipe.servings)

  return (
    <>
      <ScreenHeader
        back={nav.pop}
        backAction={<div className="head-actions">
          <button className={`sq-btn ${recipe.favorite ? 'lime' : ''}`} aria-pressed={!!recipe.favorite}
            aria-label={recipe.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={() => db.recipes.update(id, { favorite: !recipe.favorite })}>
            <StarIcon filled={!!recipe.favorite} />
          </button>
          <button className="btn btn--sm" onClick={edit}>Modifier</button>
        </div>}
      />

      <section className="screen" style={{ paddingBottom: 'calc(var(--safe-bottom) + 120px)' }}>
        <span className="caps caps--lime" style={{ fontSize: 12, letterSpacing: '0.14em' }}>Recette · {slotsLabel}</span>
        <h1 className="recipe-title">{recipe.name}</h1>
        {totalMinutes(recipe) > 0 && (
          <div className="recipe-time">
            <div><span className="d">{fmtMinutes(totalMinutes(recipe))}</span><span className="caps">Total</span></div>
            {!!recipe.prepMin && <div><span className="d">{fmtMinutes(recipe.prepMin)}</span><span className="caps">Préparation</span></div>}
            {!!recipe.cookMin && <div><span className="d">{fmtMinutes(recipe.cookMin)}</span><span className="caps">Cuisson</span></div>}
          </div>
        )}

        <div className="macro4">
          <div><span className="d">{m.kcal}</span><span className="caps">kcal</span></div>
          <div><span className="d lime">{m.protein}<small>g</small></span><span className="caps">Protéines</span></div>
          <div><span className="d cyan">{m.carbs}<small>g</small></span><span className="caps">Glucides</span></div>
          <div><span className="d amber">{m.fat}<small>g</small></span><span className="caps">Lipides</span></div>
        </div>
        <div className="split" style={{ marginTop: 16 }} aria-hidden>
          <span style={{ width: `${shares.protein}%`, background: 'var(--lime)' }} />
          <span style={{ width: `${shares.carbs}%`, background: 'var(--cyan)' }} />
          <span style={{ width: `${shares.fat}%`, background: 'var(--amber)' }} />
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          Calories : {shares.protein} % protéines · {shares.carbs} % glucides · {shares.fat} % lipides
        </p>

        <div className="portion-row">
          <div>
            <span className="caps">Portion</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtFactor(factor)} · {portionGrams} g</span>
          </div>
          <span className="stepper">
            <button aria-label="Diminuer la portion" disabled={factor <= 0.25} onClick={() => setFactor(Math.max(0.25, factor - 0.25))}>−</button>
            <strong>{fmtFactor(factor)}</strong>
            <button aria-label="Augmenter la portion" disabled={factor >= 3} onClick={() => setFactor(Math.min(3, factor + 0.25))}>+</button>
          </span>
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>
          <span>Ingrédients</span>
          {totals.unverifiedFoodIds.length > 0 && (
            <span className="small amber">{totals.unverifiedFoodIds.length} valeur{totals.unverifiedFoodIds.length > 1 ? 's' : ''} à vérifier</span>
          )}
        </div>
        <div>
          {recipe.ingredients.map((ing, i) => {
            const food = foods.get(ing.foodId)
            const grams = Math.round(ing.grams * ingFactor)
            if (!food) {
              return (
                <div key={i} className="ing-row">
                  <span className="ing-g">{grams}<small> g</small></span>
                  <span className="ing-name"><strong className="error">Aliment supprimé</strong><span className="sub">non compté</span></span>
                </div>
              )
            }
            const im = roundMacros(macrosForGrams(food, grams))
            return (
              <div key={i} className="ing-row">
                <span className="ing-g">{grams}<small> g</small></span>
                <span className="ing-name">
                  <strong>{food.name}</strong>
                  <span className="sub">{piecesLabel(ing.foodId, grams) ?? food.state}{!food.verified && <span className="tag tag--amber">à vérifier</span>}</span>
                </span>
                <span className="ing-num">{im.kcal}<br /><span className="lime">{im.protein} g P</span></span>
              </div>
            )
          })}
        </div>

        {recipe.steps && recipe.steps.length > 0 && (
          <>
            <div className="section-label">
              <span>Préparation</span>
              <span className="small muted">{checked.size ? `${checked.size}/${recipe.steps.length} faites` : `${recipe.steps.length} étapes`}</span>
            </div>
            {recipe.tools && recipe.tools.length > 0 && (
              <p className="recipe-tools"><span className="caps">Matériel</span> {recipe.tools.join(' · ')}</p>
            )}
            <ol className="steps">
              {recipe.steps.map((st, i) => {
                const on = checked.has(i)
                return (
                  <li key={i}>
                    <button className={`step ${on ? 'step--done' : ''}`} aria-pressed={on}
                      onClick={() => setChecked((c) => { const n = new Set(c); if (n.has(i)) n.delete(i); else n.add(i); return n })}>
                      <span className="step-n" aria-hidden>{on ? <CheckIcon size={18} /> : i + 1}</span>
                      <span className="step-t">
                        {stepParts(st, recipe, factor).map((p, k) => ('qty' in p ? <strong key={k}>{p.qty}</strong> : <span key={k}>{p.text}</span>))}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="footnote">
              Touche une étape pour la cocher.
              {factor !== 1 && ` Quantités pour ${fmtFactor(factor)} ; épices et assaisonnement donnés pour une portion, ajuste au goût.`}
            </p>
          </>
        )}
        {((recipe.tips && recipe.tips.length > 0) || recipe.notes) && (
          <>
            <div className="section-label"><span>{recipe.steps?.length ? 'Astuces' : 'Préparation'}</span></div>
            {recipe.tips && recipe.tips.length > 0 && (
              <ul className="tips">
                {recipe.tips.map((t, i) => (
                  <li key={i}>{stepParts(t, recipe, factor).map((p, k) => ('qty' in p ? <strong key={k}>{p.qty}</strong> : <span key={k}>{p.text}</span>))}</li>
                ))}
              </ul>
            )}
            {recipe.notes && <p className="notes">{recipe.notes}</p>}
          </>
        )}
        {recipe.servings > 1 && <p className="footnote">La recette entière fait {recipe.servings} portions.</p>}
      </section>

      <div className="cta-bar">
        {done
          ? <button className="btn btn--outline btn--block" onClick={() => setDone(null)}>Ajouté : {done}</button>
          : <button className="btn btn--lime btn--block" onClick={() => setPlanning(true)}>Ajouter au planning</button>}
      </div>

      {planning && (
        <AddToPlanSheet recipe={recipe} factor={factor} onClose={() => setPlanning(false)}
          onDone={(label) => { setPlanning(false); setDone(label) }} />
      )}
    </>
  )
}
