import { useMemo, useState } from 'react'
import type { Food } from '../types'
import { CATEGORY_LABEL, normalize } from '../lib/nutrition'
import { BackIcon } from './icons'

/** Feuille plein écran pour choisir un aliment à ajouter. */
export function FoodPicker({ foods, onPick, onClose }: {
  foods: Food[]
  onPick: (food: Food) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const q = normalize(query)
    const list = foods.filter((f) => !q || normalize(f.name).includes(q))
    const map = new Map<string, Food[]>()
    for (const f of list) map.set(f.category, [...(map.get(f.category) ?? []), f])
    return [...map.entries()].sort((a, b) => (CATEGORY_LABEL[a[0]] ?? a[0]).localeCompare(CATEGORY_LABEL[b[0]] ?? b[0], 'fr'))
  }, [foods, query])

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Choisir un aliment">
      <div className="sheet-head">
        <button className="round-btn round-btn--sm round-btn--light" aria-label="Fermer" onClick={onClose}><BackIcon size={20} /></button>
        <input
          className="search-input"
          type="search"
          placeholder="Rechercher un aliment"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="sheet-body">
        {groups.length === 0 && (
          <p className="footnote">Aucun aliment trouvé. Ajoute-le depuis Profil → Base d'aliments.</p>
        )}
        {groups.map(([cat, list]) => (
          <div key={cat} className="picker-group">
            <h3>{CATEGORY_LABEL[cat] ?? cat}</h3>
            <ul className="card picker-list">
              {list.map((f) => (
                <li key={f.id}>
                  <button className="picker-row" onClick={() => onPick(f)}>
                    <span className="ing-name">
                      <strong>{f.name}</strong>
                      <span className="small muted">{f.state} · {f.kcal} kcal · P {f.protein} g / 100 g</span>
                    </span>
                    <span className="picker-add">+</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
