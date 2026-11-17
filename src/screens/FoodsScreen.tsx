import { useMemo, useState } from 'react'
import { useFoods } from '../db/hooks'
import { useNav } from '../nav'
import type { Food } from '../types'
import { CATEGORY_LABEL, normalize } from '../lib/nutrition'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { CheckCircleIcon, ChevronIcon, PlusIcon, ScanIcon } from '../components/icons'
import { ScanSheet } from '../components/ScanSheet'

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
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState<string | null>(null)

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

  const total = foods?.length ?? 0
  const create = () => nav.push({ type: 'food', id: null })

  return (
    <>
      <ScreenHeader
        title="Aliments"
        subtitle="Valeurs pour 100 g"
        back={nav.pop}
        backAction={
          <span className="head-nav-actions">
            <SquareButton label="Scanner un code-barres" onClick={() => setScanning(true)}><ScanIcon size={20} /></SquareButton>
            <SquareButton label="Ajouter un aliment" onClick={create}><PlusIcon size={20} /></SquareButton>
          </span>
        }
      >
        <div className="stat" style={{ gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span className="caps">Valeurs vérifiées</span>
            <span className="stat-val">{verified}<small> /{total}</small></span>
          </div>
          <div className="segments" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => {
              const filled = total ? (verified / total) * 14 : 0
              const part = Math.max(0, Math.min(1, filled - i))
              return <span key={i} style={part > 0 ? { background: `linear-gradient(90deg, var(--lime) ${part * 100}%, var(--line) ${part * 100}%)` } : undefined} />
            })}
          </div>
          <span className="small muted">Compare avec Ciqual ou l'étiquette, puis marque l'aliment comme vérifié.</span>
        </div>
        <input className="search" style={{ marginTop: 14 }} type="search" placeholder="Rechercher un aliment" aria-label="Rechercher un aliment"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips" role="tablist" aria-label="Filtrer les aliments">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'chip--on' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </ScreenHeader>

      <section className="screen">
        {found && <p className="ok small" role="status" style={{ marginTop: 14 }}>{found}</p>}
        {groups?.length === 0 && (
          <div className="card empty" style={{ marginTop: 16 }}>
            <h2>Aucun aliment</h2>
            <p>{filter === 'custom' ? "Tu n'as pas encore ajouté d'aliment." : 'Rien ne correspond à ta recherche.'}</p>
            <button className="btn btn--outline btn--sm" onClick={create}><PlusIcon /> Ajouter un aliment</button>
          </div>
        )}

        {groups?.map(([cat, list]) => (
          <div key={cat} className="picker-group">
            <h3>{CATEGORY_LABEL[cat] ?? cat} · {list.length}</h3>
            <div className="list">
              {list.map((f) => (
                <button key={f.id} className="list-row" onClick={() => nav.push({ type: 'food', id: f.id })}>
                  <span className="list-main">
                    <strong>{f.name}</strong>
                    <span className="caps" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {f.state} · G {f.carbs} · L {f.fat}
                      {f.verified
                        ? <span className="verified" aria-label="Vérifié"><CheckCircleIcon size={15} filled /></span>
                        : <span className="tag tag--amber">à vérifier</span>}
                    </span>
                  </span>
                  <span className="list-num"><span className="k">{f.kcal}</span><br /><span className="p">{f.protein} g P</span></span>
                  <span className="chev"><ChevronIcon /></span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {scanning && (
        <ScanSheet
          onClose={() => setScanning(false)}
          onFood={(f) => {
            setScanning(false)
            setFilter('all')
            setQuery(f.name)
            setFound(`« ${f.name} » est dans tes aliments.`)
          }}
        />
      )}
    </>
  )
}
