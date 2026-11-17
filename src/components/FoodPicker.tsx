import { useMemo, useState } from 'react'
import type { Food } from '../types'
import { CATEGORY_LABEL, normalize } from '../lib/nutrition'
import { BackIcon, PlusIcon } from './icons'

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
        <button className="sq-btn" aria-label="Fermer" onClick={onClose}><BackIcon /></button>
        <input className="search" type="search" placeholder="Rechercher un aliment" aria-label="Rechercher un aliment"
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="sheet-body">
        {groups.length === 0 && <p className="footnote">Aucun aliment trouvé. Ajoute-le depuis Profil → Base d'aliments.</p>}
        {groups.map(([cat, list]) => (
          <div key={cat} className="picker-group">
            <h3>{CATEGORY_LABEL[cat] ?? cat}</h3>
            <div className="list">
              {list.map((f) => (
                <button key={f.id} className="list-row" onClick={() => onPick(f)}>
                  <span className="list-main">
                    <strong>{f.name}</strong>
                    <span className="caps">{f.state} · portion {f.defaultPortionG} g</span>
                  </span>
                  <span className="list-num"><span className="k">{f.kcal}</span><br /><span className="p">{f.protein} g P</span></span>
                  <span className="lime" style={{ flexShrink: 0 }}><PlusIcon size={20} /></span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="footnote">Valeurs pour 100 g.</p>
      </div>
    </div>
  )
}
