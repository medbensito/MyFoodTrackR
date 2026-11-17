import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import { macroShares } from '../lib/labels'
import { macrosForGrams, recipeTotals, roundMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl, bowlFor } from '../components/Bowl'
import { DropIcon, FlameIcon, LeafIcon, PencilIcon } from '../components/icons'

export function RecipeDetailScreen({ id }: { id: string }) {
  const nav = useNav()
  const recipe = useLiveQuery(() => db.recipes.get(id).then((r) => r ?? null), [id])
  const foods = useFoodsMap()

  if (recipe === undefined || !foods) return <div className="loading">Chargement…</div>
  if (recipe === null) return null

  const totals = recipeTotals(recipe, foods)
  const m = roundMacros(totals.perServing)
  const shares = macroShares(m)
  const edit = () => nav.push({ type: 'recipe-edit', id })

  return (
    <>
      <ScreenHeader
        title={recipe.name}
        compact
        back={nav.pop}
        action={<RoundButton label="Modifier" onClick={edit}><PencilIcon size={20} /></RoundButton>}
      >
        <div className="hero-card recipe-hero">
          <div>
            <div className="hero-card-label"><span className="flame"><FlameIcon size={20} /></span> Par portion</div>
            <div className="hero-card-value">{m.kcal}<small> kcal</small></div>
            <div className="slot-tags">
              {SLOT_ORDER.filter((s) => recipe.slots.includes(s)).map((s) => <span key={s} className="slot-tag">{SLOT_LABEL[s]}</span>)}
            </div>
          </div>
          <div className="recipe-hero-art"><Bowl variant={bowlFor(recipe.name, recipe.slots)} size={118} /></div>
        </div>
      </ScreenHeader>

      <section className="screen screen--overlap">
        <div className="tiles">
          <div className="tile"><span className="tile-icon tile-icon--protein"><FlameIcon /></span><span className="tile-label">Protéines</span><span className="tile-value">{m.protein} g</span><span className="tile-share">({shares.protein}%)</span></div>
          <div className="tile"><span className="tile-icon tile-icon--carbs"><LeafIcon /></span><span className="tile-label">Glucides</span><span className="tile-value">{m.carbs} g</span><span className="tile-share">({shares.carbs}%)</span></div>
          <div className="tile"><span className="tile-icon tile-icon--fat"><DropIcon /></span><span className="tile-label">Lipides</span><span className="tile-value">{m.fat} g</span><span className="tile-share">({shares.fat}%)</span></div>
        </div>

        <div className="section-head">
          <h2>Ingrédients</h2>
          <span className="muted small">
            {recipe.servings} portion{recipe.servings > 1 ? 's' : ''} · {Math.round(totals.totalGrams)} g
          </span>
        </div>
        <ul className="card ing-list">
          {recipe.ingredients.map((ing, i) => {
            const food = foods.get(ing.foodId)
            if (!food) {
              return (
                <li key={i} className="ing-row">
                  <span className="ing-name"><strong className="error">Aliment supprimé</strong><span className="small muted">{ing.grams} g · non compté</span></span>
                </li>
              )
            }
            const im = roundMacros(macrosForGrams(food, ing.grams))
            return (
              <li key={i} className="ing-row">
                <span className="ing-name">
                  <strong>{food.name}</strong>
                  <span className="small muted">
                    {food.state} · {im.kcal} kcal · P {im.protein} g
                    {!food.verified && <span className="tag tag--warn">à vérifier</span>}
                  </span>
                </span>
                <span className="ing-grams">{ing.grams} g</span>
              </li>
            )
          })}
        </ul>

        {totals.unverifiedFoodIds.length > 0 && (
          <p className="footnote">
            {totals.unverifiedFoodIds.length} ingrédient{totals.unverifiedFoodIds.length > 1 ? 's' : ''} avec des valeurs approximatives.
            Vérifie-les dans Profil → Base d'aliments.
          </p>
        )}

        {recipe.notes && (
          <>
            <div className="section-head"><h2>Préparation</h2></div>
            <div className="card"><p className="notes">{recipe.notes}</p></div>
          </>
        )}

        <button className="cta" onClick={edit}>Modifier la recette <PencilIcon size={18} /></button>
      </section>
    </>
  )
}
