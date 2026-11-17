import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function RecipesScreen() {
  const foodCount = useLiveQuery(() => db.foods.count(), [])
  const recipeCount = useLiveQuery(() => db.recipes.count(), [])

  return (
    <section className="screen">
      <div className="card empty">
        <h2>Aucune recette pour l'instant</h2>
        <p className="muted">
          L'éditeur de recettes et les recettes d'exemple arrivent au jalon M1.
        </p>
        <p className="small">
          {foodCount ?? '…'} aliments disponibles · {recipeCount ?? '…'} recettes
        </p>
      </div>
    </section>
  )
}
