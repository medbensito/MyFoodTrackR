import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MealSlot } from '../types'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl } from '../components/Bowl'
import { ArrowIcon, SearchIcon } from '../components/icons'

const FILTERS: { id: 'all' | MealSlot; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'breakfast', label: 'Petit-déjeuner' },
  { id: 'lunch', label: 'Déjeuner' },
  { id: 'dinner', label: 'Dîner' },
  { id: 'snack', label: 'Collation' },
]

export function RecipesScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const foodCount = useLiveQuery(() => db.foods.count(), [])
  const recipeCount = useLiveQuery(() => db.recipes.count(), [])

  return (
    <>
      <ScreenHeader
        title="Recettes"
        subtitle="Des repas équilibrés et délicieux"
        action={<RoundButton label="Rechercher"><SearchIcon /></RoundButton>}
      >
        <div className="hero-card hero-card--promo">
          <div className="promo-text">
            <h2>Votre livre de recettes</h2>
            <p>Macros calculées automatiquement, ingrédient par ingrédient.</p>
            <button className="pill-btn" disabled>Explorer <ArrowIcon /></button>
          </div>
          <div className="promo-art"><Bowl variant="chicken" size={128} /></div>
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="chips" role="tablist" aria-label="Filtrer par repas">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'chip--on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="card empty">
          <Bowl variant="salad" size={84} />
          <h2>Aucune recette pour l'instant</h2>
          <p className="muted">L'éditeur et les recettes d'exemple arrivent au jalon M1.</p>
          <p className="small muted">{foodCount ?? '…'} aliments disponibles · {recipeCount ?? '…'} recettes</p>
        </div>
      </section>
    </>
  )
}
