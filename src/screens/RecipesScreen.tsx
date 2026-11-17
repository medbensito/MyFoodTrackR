import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import type { MealSlot } from '../types'
import { normalize, recipeTotals, roundMacros, SLOT_LABEL, SLOT_ORDER } from '../lib/nutrition'
import { fmtMinutes, totalMinutes } from '../lib/steps'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { ChevronIcon, PlusIcon } from '../components/icons'

type Filter = 'all' | MealSlot
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  ...SLOT_ORDER.map((s) => ({ id: s, label: SLOT_LABEL[s] })),
]

export function RecipesScreen() {
  const nav = useNav()
  const [filter, setFilter] = useState<Filter>('all')
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
      .map((r) => {
        const t = recipeTotals(r, foods)
        return { r, m: roundMacros(t.perServing), todo: t.unverifiedFoodIds.length }
      })
  }, [recipes, foods, filter, query])

  const create = () => nav.push({ type: 'recipe-edit', id: null })

  return (
    <>
      <ScreenHeader
        title="Recettes"
        subtitle={`${recipes?.length ?? '…'} recettes · valeurs par portion`}
        action={<SquareButton label="Nouvelle recette" onClick={create}><PlusIcon size={20} /></SquareButton>}
      >
        <input className="search" type="search" placeholder="Rechercher une recette" aria-label="Rechercher une recette"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips" role="tablist" aria-label="Filtrer par repas">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'chip--on' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </ScreenHeader>

      <section className="screen" style={{ marginTop: 8 }}>
        {rows && rows.length === 0 && (
          <div className="card empty" style={{ marginTop: 12 }}>
            <h2>{query ? 'Aucun résultat' : 'Aucune recette'}</h2>
            <p>{query ? `Rien ne correspond à « ${query} ».` : 'Crée ta première recette pour ce créneau.'}</p>
            <button className="btn btn--outline btn--sm" onClick={create}><PlusIcon /> Nouvelle recette</button>
          </div>
        )}

        <div className="list">
          {rows?.map(({ r, m }) => (
            <button key={r.id} className="list-row" onClick={() => nav.push({ type: 'recipe', id: r.id })}>
              <span className="list-main">
                <strong>{r.name}</strong>
                <span className="caps">{r.favorite && <span className="lime">★ </span>}{SLOT_ORDER.filter((s) => r.slots.includes(s)).map((s) => SLOT_LABEL[s]).join(' / ')}{totalMinutes(r) > 0 && ` · ${fmtMinutes(totalMinutes(r))}`}</span>
              </span>
              <span className="list-num"><span className="k">{m.kcal}</span><br /><span className="p">{m.protein} g P</span></span>
              <span className="chev"><ChevronIcon /></span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
