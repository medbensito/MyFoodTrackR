import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useNav } from '../nav'
import type { Settings } from '../types'
import { isoWeek, targetsForDate, toISODate, trainingOn, weekDays } from '../lib/targets'
import { currentStreak, reviewDay, summarizeWeek, type WeekReview } from '../lib/review'
import { SLOT_LABEL } from '../lib/nutrition'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { ProteinWeekChart } from '../components/ProteinWeekChart'
import { BackIcon, CheckIcon, ChevronIcon } from '../components/icons'

const DN = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const SHORT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' })
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

export function ReviewScreen({ settings }: { settings: Settings }) {
  const nav = useNav()
  // Le lundi, on montre d'abord la semaine qui vient de finir.
  const [offset, setOffset] = useState(() => (new Date().getDay() === 1 ? -1 : 0))
  const [picked, setPicked] = useState<string | null>(null)

  // 4 semaines affichées + 10 semaines d'historique pour la série.
  const today = new Date()
  const weeks = useMemo(() => [3, 2, 1, 0].map((k) => {
    const d = new Date(); d.setDate(d.getDate() + (offset - k) * 7)
    return weekDays(d).map(toISODate)
  }), [offset])
  const from = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 70); return toISODate(d) }, [])
  const start = weeks[0][0] < from ? weeks[0][0] : from
  const end = weeks[3][6] > toISODate(today) ? weeks[3][6] : toISODate(today)

  const entries = useLiveQuery(() => db.logEntries.where('date').between(start, end, true, true).toArray(), [start, end])
  const planned = useLiveQuery(() => db.plannedMeals.where('date').between(start, end, true, true).toArray(), [start, end])
  const overrides = useLiveQuery(() => db.dayOverrides.where('date').between(start, end, true, true).toArray()
    .then((os) => new Map(os.map((o) => [o.date, o.training]))), [start, end])

  if (!entries || !planned || !overrides) return <div className="loading">Chargement…</div>

  const byDate = <T extends { date: string }>(xs: T[]) => {
    const m = new Map<string, T[]>()
    for (const x of xs) m.set(x.date, [...(m.get(x.date) ?? []), x])
    return m
  }
  const eByDate = byDate(entries), pByDate = byDate(planned)
  const dayOf = (iso: string) => {
    const d = parse(iso)
    return reviewDay(iso, trainingOn(d, settings, overrides), targetsForDate(d, settings, overrides), eByDate.get(iso) ?? [], pByDate.get(iso) ?? [])
  }
  const reviews: WeekReview[] = weeks.map((w) => summarizeWeek(w.map(dayOf)))
  const week = reviews[3]
  const streak = currentStreak(today, (iso) => dayOf(iso).success)
  const todayISO = toISODate(today)

  const withData = week.days.filter((d) => d.consumed)
  const selected = picked && week.days.some((d) => d.date === picked) ? picked
    : (withData.find((d) => d.date === todayISO) ?? withData[withData.length - 1])?.date ?? null
  const sel = week.days.find((d) => d.date === selected)
  const first = parse(weeks[3][0]), last = parse(weeks[3][6])
  const range = `${SHORT.format(first).replace('.', '')} — ${SHORT.format(last).replace('.', '')}`
  const adherence = week.plannedTotal ? Math.round((week.eatenPlannedTotal / week.plannedTotal) * 100) : null

  return (
    <>
      <ScreenHeader
        title="Bilan"
        subtitle={<>Semaine {isoWeek(first)} · {range}{offset === 0 && <span className="lime">· en cours</span>}</>}
        back={nav.pop}
        backAction={<div className="head-actions">
          <SquareButton label="Semaine précédente" onClick={() => { setOffset((o) => o - 1); setPicked(null) }}><BackIcon /></SquareButton>
          <SquareButton label="Semaine suivante" disabled={offset >= 0} onClick={() => { setOffset((o) => o + 1); setPicked(null) }}><ChevronIcon size={20} /></SquareButton>
        </div>}
      >
        <div className="review-hero">
          <div>
            <span className="caps caps--lime">Jours réussis</span>
            <span className="big" style={{ fontSize: 96 }}>{week.successes}<span className="of">/7</span></span>
          </div>
          <div className="review-side">
            <div><span className="caps">Série</span><span className="stat-val">{streak}<small> j</small></span></div>
            <div><span className="caps">Moy. protéines</span><span className="stat-val">{week.avgProtein ?? '—'}<small> g</small></span></div>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>Journée réussie : protéines atteintes et calories à ±10 % de ta cible.</p>
      </ScreenHeader>

      <section className="screen">
        {week.logged === 0 ? (
          <div className="card empty" style={{ marginTop: 18 }}>
            <h2>Rien de saisi</h2>
            <p>Coche tes repas dans le Tracker pour voir ton bilan ici.</p>
          </div>
        ) : (
          <>
            <div className="section-label"><span>Protéines par jour</span><span className="small muted">touche une colonne</span></div>
            <div className="card" style={{ padding: '14px 10px 8px' }}>
              <ProteinWeekChart days={week.days} selected={selected} onSelect={setPicked} />
              {sel && (
                <p className="chart-detail">
                  <strong>{LONG.format(parse(sel.date))}</strong>
                  {sel.consumed
                    ? <> · {sel.consumed.protein} g P · {sel.consumed.kcal} / {sel.target.kcal} kcal · {sel.success ? <span className="lime">réussi</span> : <span className="amber">écart</span>}</>
                    : <> · rien saisi</>}
                </p>
              )}
            </div>

            <div className="section-label"><span>Ce qu'il faut retenir</span></div>
            <div className="card insights">
              {adherence !== null && (
                <p><span className="d lime">{adherence} %</span> des repas prévus mangés ({week.eatenPlannedTotal}/{week.plannedTotal}) les jours suivis.</p>
              )}
              {week.mostSkipped && (
                <p><span className="d amber">{week.mostSkipped.count}×</span> {SLOT_LABEL[week.mostSkipped.slot].toLowerCase()} sauté{week.mostSkipped.slot === 'snack' ? 'e' : ''}. Une recette plus simple pour ce créneau aiderait.</p>
              )}
              {week.best && (
                <p><span className="d lime"><CheckIcon size={16} /></span> Meilleur jour : {LONG.format(parse(week.best.date))}, {week.best.consumed!.protein} g de protéines.</p>
              )}
              {week.avgKcal !== null && (
                <p><span className="d">{week.avgKcal}</span> kcal en moyenne sur {week.logged} jour{week.logged > 1 ? 's' : ''} suivi{week.logged > 1 ? 's' : ''}.</p>
              )}
            </div>

            <div className="section-label"><span>Jour par jour</span></div>
            <div>
              {week.days.map((d) => {
                const dt = parse(d.date)
                return (
                  <button key={d.date} className={`week-row ${d.date === selected ? 'week-row--today' : ''}`} onClick={() => setPicked(d.date)}>
                    <span className="wd">{DN[dt.getDay()]} {dt.getDate()}</span>
                    <span className="wt">{d.training ? 'Entraînement' : 'Repos'}</span>
                    <span className="wk">{d.consumed ? d.consumed.kcal : '—'}</span>
                    <span className="wp">{d.consumed ? `${d.consumed.protein} g` : ''}</span>
                    <span className="ws">
                      {d.success === true && <span className="lime" aria-label="Réussi"><CheckIcon /></span>}
                      {d.success === false && <span className="amber" aria-label="Écart">●</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="section-label"><span>4 dernières semaines</span></div>
        <div className="weeks4">
          {reviews.map((r, i) => (
            <div key={weeks[i][0]} className={`stat ${i === 3 ? 'stat--on' : ''}`}>
              <span className="caps">S{isoWeek(parse(weeks[i][0]))}</span>
              <span className="stat-val">{r.successes}<small>/7</small></span>
              <span className="dots" aria-label={`${r.successes} jours réussis sur 7`}>
                {r.days.map((d) => <i key={d.date} className={d.success ? 'on' : d.consumed ? 'miss' : ''} />)}
              </span>
              <span className="small muted">{r.avgProtein !== null ? `${r.avgProtein} g P/j` : '—'}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
