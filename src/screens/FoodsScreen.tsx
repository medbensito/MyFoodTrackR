import { useMemo, useState } from 'react'
import { useFoods } from '../db/hooks'
import { useNav } from '../nav'
import type { Food } from '../types'
import { CATEGORY_LABEL, normalize } from '../lib/nutrition'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { CheckCircleIcon, ChevronIcon, PlusIcon } from '../components/icons'

type Filter = 'all' | 'todo' | 'verified' | 'custom'
const FILTERS: { id: Filter; label: string; test: (f: Food) => boolean }[] = [
  { id: 'all', label: 'Tous', test: () => true },
  { id: 'todo', label: 'À vérifier', test: (f) => !f.verified },
  { id: 'verified', label: 'Vérifiés', test: (f) => f.verified },
  { id: 'custom', label: 'Mes aliments', test: (f) => f.custom },
]

export function FoodsScreen() {
  const nav = useNav()
  const foods = useFoods()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    if (!foods) return undefined
    const q = normalize(query)
    const test = FILTERS.find((f) => f.id === filter)!.test
    const map = new Map<string, Food[]>()
    for (const f of foods) {
      if (!test(f) || (q && !normalize(f.name).includes(q))) continue
      map.set(f.category, [...(map.get(f.category) ?? []), f])
    }
    return [...map.entries()].sort((a, b) => (CATEGORY_LABEL[a[0]] ?? a[0]).localeCompare(CATEGORY_LABEL[b[0]] ?? b[0], 'fr'))
  }, [foods, filter, query])

  const verified = foods?.filter((f) => f.verified).length ?? 0

  return (
    <>
      <ScreenHeader
        title="Aliments"
        subtitle="Valeurs nutritionnelles pour 100 g"
        back={nav.pop}
        action={<RoundButton label="Ajouter un aliment" onClick={() => nav.push({ type: 'food', id: null })}><PlusIcon size={22} /></RoundButton>}
      >
        <div className="hero-card">
          <div className="hero-card-label">Vérifiés</div>
          <div className="hero-card-value">{verified}<small> / {foods?.length ?? '…'}</small></div>
          <div className="hero-progress">
            <div className="hero-progress-track">
              <div className="hero-progress-fill" style={{ width: `${foods?.length ? Math.max(2, (verified / foods.length) * 100) : 0}%` }} />
            </div>
          </div>
          <p className="hero-hint">Compare chaque aliment avec Ciqual ou l'étiquette, puis marque-le comme vérifié.</p>
        </div>
      </ScreenHeader>

      <section className="screen">
        <input className="search-input search-input--page" type="search" placeholder="Rechercher un aliment"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips" role="tablist" aria-label="Filtrer les aliments">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'chip--on' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {groups?.length === 0 && (
          <div className="card empty">
            <h2>Aucun aliment</h2>
            <p className="muted">{filter === 'custom' ? 'Tu n\'as pas encore ajouté d\'aliment.' : 'Rien ne correspond à ta recherche.'}</p>
            <button className="secondary" onClick={() => nav.push({ type: 'food', id: null })}>Ajouter un aliment</button>
          </div>
        )}

        {groups?.map(([cat, list]) => (
          <div key={cat} className="picker-group">
            <h3>{CATEGORY_LABEL[cat] ?? cat} <span className="muted">· {list.length}</span></h3>
            <ul className="card picker-list">
              {list.map((f) => (
                <li key={f.id}>
                  <button className="picker-row" onClick={() => nav.push({ type: 'food', id: f.id })}>
                    <span className="ing-name">
                      <strong>{f.name}</strong>
                      <span className="small muted">
                        {f.state} · {f.kcal} kcal · P {f.protein} · G {f.carbs} · L {f.fat}
                      </span>
                    </span>
                    {f.verified
                      ? <span className="verified" aria-label="Vérifié"><CheckCircleIcon size={20} filled /></span>
                      : <span className="tag tag--warn">à vérifier</span>}
                    <ChevronIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  )
}
