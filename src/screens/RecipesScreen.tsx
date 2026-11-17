import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import type { MealSlot } from '../types'
import { normalize, recipeTotals, roundMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl, bowlFor } from '../components/Bowl'
import { ChevronIcon, PlusIcon, SearchIcon } from '../components/icons'

type Filter = 'all' | MealSlot
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  ...SLOT_ORDER.map((s) => ({ id: s, label: SLOT_LABEL[s] })),
]

export function RecipesScreen() {
  const nav = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const foods = useFoodsMap()

  const rows = useMemo(() => {
    if (!recipes || !foods) return undefined
    const q = normalize(query)
    return recipes
      .filter((r) => filter === 'all' || r.slots.includes(filter))
      .filter((r) => !q || normalize(r.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((r) => ({ r, m: roundMacros(recipeTotals(r, foods).perServing) }))
  }, [recipes, foods, filter, query])

  return (
    <>
      <ScreenHeader
        title="Recettes"
        subtitle="Des repas équilibrés et délicieux"
        action={
          <RoundButton label="Rechercher" onClick={() => { setSearchOpen((o) => !o); setQuery('') }}>
            <SearchIcon />
          </RoundButton>
        }
      >
        {searchOpen ? (
          <input
            className="hero-search"
            type="search"
            placeholder="Rechercher une recette"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : (
          <div className="hero-card hero-card--promo">
            <div className="promo-text">
              <h2>Votre livre de recettes</h2>
              <p>Macros calculées automatiquement, ingrédient par ingrédient.</p>
              <button className="pill-btn" onClick={() => nav.push({ type: 'recipe-edit', id: null })}>
                Nouvelle recette <PlusIcon size={16} />
              </button>
            </div>
            <div className="promo-art"><Bowl variant="chicken" size={128} /></div>
          </div>
        )}
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

        {rows && rows.length === 0 && (
          <div className="card empty">
            <Bowl variant="salad" size={84} />
            <h2>{query ? 'Aucun résultat' : 'Aucune recette ici'}</h2>
            <p className="muted">
              {query ? `Rien ne correspond à « ${query} ».` : 'Crée ta première recette pour ce créneau.'}
            </p>
            <button className="secondary" onClick={() => nav.push({ type: 'recipe-edit', id: null })}>Nouvelle recette</button>
          </div>
        )}

        <ul className="recipe-list">
          {rows?.map(({ r, m }) => (
            <li key={r.id}>
              <button className="card recipe-card" onClick={() => nav.push({ type: 'recipe', id: r.id })}>
                <span className="recipe-art"><Bowl variant={bowlFor(r.name, r.slots)} size={92} /></span>
                <span className="recipe-body">
                  <span className="kcal-badge">≈ {m.kcal} kcal</span>
                  <strong>{r.name}</strong>
                  <span className="recipe-macros">P {m.protein} g • G {m.carbs} g • L {m.fat} g</span>
                </span>
                <ChevronIcon />
              </button>
            </li>
          ))}
        </ul>
        {rows && rows.length > 0 && (
          <p className="footnote">{rows.length} recette{rows.length > 1 ? 's' : ''} · valeurs pour 1 portion</p>
        )}
      </section>
    </>
  )
}
