import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useFoodsMap } from '../db/hooks'
import { useNav } from '../nav'
import { toISODate, weekDays } from '../lib/targets'
import { buildShoppingList, formatGrams, shoppingText } from '../lib/shopping'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { CheckIcon, ShareIcon } from '../components/icons'

type Period = 'rest' | 'week' | 'next'
const PERIODS: { id: Period; label: string }[] = [
  { id: 'rest', label: 'Reste de la semaine' },
  { id: 'week', label: 'Semaine entière' },
  { id: 'next', label: 'Semaine prochaine' },
]
const SHORT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function periodDates(p: Period): string[] {
  const today = new Date()
  if (p === 'next') { const d = new Date(); d.setDate(d.getDate() + 7); return weekDays(d).map(toISODate) }
  const week = weekDays(today).map(toISODate)
  return p === 'week' ? week : week.filter((d) => d >= toISODate(today))
}

export function ShoppingScreen() {
  const nav = useNav()
  const [period, setPeriod] = useState<Period>('rest')
  const [copied, setCopied] = useState<string | null>(null)
  const dates = useMemo(() => periodDates(period), [period])
  const rangeKey = `${dates[0]}_${dates[dates.length - 1]}`

  const foods = useFoodsMap()
  const recipes = useLiveQuery(() => db.recipes.toArray().then((rs) => new Map(rs.map((r) => [r.id, r]))), [])
  const meals = useLiveQuery(() => db.plannedMeals.where('date').anyOf(dates).toArray(), [rangeKey])
  const checks = useLiveQuery(
    () => db.shoppingChecks.where('id').startsWith(`${rangeKey}|`).toArray()
      .then((cs) => new Set(cs.filter((c) => c.checked).map((c) => c.id.split('|')[1]))),
    [rangeKey],
  )

  if (!foods || !recipes || !meals || !checks) return <div className="loading">Chargement…</div>

  const list = buildShoppingList(meals, recipes, foods)
  const done = list.groups.flatMap((g) => g.items).filter((it) => checks.has(it.food.id)).length
  const toDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
  const rangeLabel = `${SHORT.format(toDate(dates[0])).replace('.', '')} — ${SHORT.format(toDate(dates[dates.length - 1])).replace('.', '')}`

  const toggle = (foodId: string) =>
    db.shoppingChecks.put({ id: `${rangeKey}|${foodId}`, checked: !checks.has(foodId) })
  const uncheckAll = () =>
    db.shoppingChecks.where('id').startsWith(`${rangeKey}|`).delete()

  const share = async () => {
    const text = shoppingText(`Courses ${rangeLabel}`, list.groups, checks)
    try {
      if (navigator.share) { await navigator.share({ text }); return }
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
    try { await navigator.clipboard.writeText(text); setCopied('Liste copiée.') } catch { setCopied('Copie impossible sur cet appareil.') }
  }

  return (
    <>
      <ScreenHeader
        title="Courses"
        subtitle={<>{rangeLabel} · <span className="lime">{list.itemCount} articles</span></>}
        back={nav.pop}
        backAction={<SquareButton label="Partager la liste" onClick={share} disabled={list.itemCount === 0}><ShareIcon /></SquareButton>}
      >
        <div className="chips" role="tablist" aria-label="Période" style={{ marginTop: 0 }}>
          {PERIODS.map((p) => (
            <button key={p.id} role="tab" aria-selected={period === p.id}
              className={`chip ${period === p.id ? 'chip--on' : ''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>
        {list.itemCount > 0 && (
          <div className="stat" style={{ marginTop: 14, gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span className="caps">Dans le panier</span>
              <span className="stat-val">{done}<small> /{list.itemCount}</small></span>
            </div>
            <span className="bar"><span style={{ width: `${(done / list.itemCount) * 100}%`, background: 'var(--lime)' }} /></span>
            {done > 0 && <button className="text-link" style={{ alignSelf: 'flex-start' }} onClick={uncheckAll}>Tout décocher</button>}
          </div>
        )}
        {copied && <p className="small ok" role="status" style={{ marginTop: 10 }}>{copied}</p>}
      </ScreenHeader>

      <section className="screen">
        {list.itemCount === 0 ? (
          <div className="card empty" style={{ marginTop: 18 }}>
            <h2>Rien à acheter</h2>
            <p>Aucun repas planifié sur cette période. Génère la semaine dans Planning.</p>
          </div>
        ) : list.groups.map((g) => (
          <div key={g.key}>
            <div className="section-label"><span>{g.label}</span><span className="count">{g.items.length}</span></div>
            <div>
              {g.items.map((it) => {
                const on = checks.has(it.food.id)
                return (
                  <button key={it.food.id} className={`shop-row ${on ? 'shop-row--on' : ''}`} aria-pressed={on} onClick={() => toggle(it.food.id)}>
                    <span className={`tl-node ${on ? 'tl-node--on' : ''}`} aria-hidden><span>{on && <CheckIcon />}</span></span>
                    <span className="list-main">
                      <strong>{it.food.name}</strong>
                      <span className="caps">
                        {it.food.state === 'cuit' ? 'poids cuit · ' : it.food.state === 'cru' ? 'cru · ' : ''}
                        {it.uses} repas
                      </span>
                    </span>
                    <span className="shop-qty">
                      {it.count ? <>{it.count.n}<small> {it.count.label}</small></> : formatGrams(it.grams)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {list.missingRecipes > 0 && <p className="footnote">{list.missingRecipes} repas utilisent une recette supprimée et ne sont pas comptés.</p>}
        {list.itemCount > 0 && <p className="footnote">Quantités arrondies au-dessus. « Poids cuit » : prévois plus en cru pour la viande et le poisson.</p>}
      </section>
    </>
  )
}
