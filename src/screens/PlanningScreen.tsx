import { useRef, useState } from 'react'
import type { Settings } from '../types'
import { isTrainingDay, targetsForDate, toISODate, weekDays } from '../lib/targets'
import { shortDay } from '../lib/labels'
import { MacroLine } from '../components/MacroLine'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { BOWL_VARIANTS, Bowl } from '../components/Bowl'
import { CalendarIcon, CheckCircleIcon, FlameIcon } from '../components/icons'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })

export function PlanningScreen({ settings }: { settings: Settings }) {
  const today = new Date()
  const todayISO = toISODate(today)
  const days = weekDays(today)
  const [selected, setSelected] = useState(todayISO)
  const refs = useRef<Record<string, HTMLLIElement | null>>({})

  const todayTarget = targetsForDate(today, settings)
  const consumed = 0 // le tracker arrive au jalon M3
  const pct = Math.round((consumed / todayTarget.kcal) * 100)

  const select = (iso: string) => {
    setSelected(iso)
    refs.current[iso]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <ScreenHeader
        title="Planning"
        subtitle="Votre plan nutritionnel de la semaine"
        action={<RoundButton label="Revenir à aujourd'hui" onClick={() => select(todayISO)}><CalendarIcon size={22} /></RoundButton>}
      >
        <div className="hero-card">
          <div className="hero-card-label"><span className="flame"><FlameIcon size={20} /></span> Objectif du jour</div>
          <div className="hero-card-value">{todayTarget.kcal}<small> kcal</small></div>
          <div className="hero-progress">
            <div className="hero-progress-track"><div className="hero-progress-fill" style={{ width: `${Math.max(pct, 2)}%` }} /></div>
            <span>{pct}%</span>
          </div>
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="day-chips" role="tablist" aria-label="Jours de la semaine">
          {days.map((d) => {
            const iso = toISODate(d)
            const training = isTrainingDay(d, settings.trainingDays)
            return (
              <button
                key={iso}
                role="tab"
                aria-selected={selected === iso}
                className={`day-chip ${selected === iso ? 'day-chip--on' : ''}`}
                onClick={() => select(iso)}
              >
                <span className="day-chip-name">{shortDay(d)}</span>
                <span className="day-chip-num">{d.getDate()}</span>
                <span className={`day-chip-dot ${training ? 'day-chip-dot--training' : ''}`} title={training ? 'Entraînement' : 'Repos'} />
              </button>
            )
          })}
        </div>
        <p className="legend"><span className="day-chip-dot day-chip-dot--training" /> jour d'entraînement</p>

        <ul className="day-list">
          {days.map((d, i) => {
            const iso = toISODate(d)
            const training = isTrainingDay(d, settings.trainingDays)
            const isToday = iso === todayISO
            return (
              <li
                key={iso}
                ref={(el) => { refs.current[iso] = el }}
                className={`card day-card ${isToday ? 'day-card--today' : ''} ${selected === iso ? 'day-card--selected' : ''}`}
              >
                <div className="day-card-body">
                  <div className="day-card-title">
                    <span className="day-name">{DAY_FMT.format(d)}</span>
                    {isToday && <span className="pill pill--green">En cours</span>}
                  </div>
                  <MacroLine m={targetsForDate(d, settings)} />
                  <p className={`day-card-status ${isToday ? 'day-card-status--today' : ''}`}>
                    <CheckCircleIcon size={17} /> Aucun repas planifié
                    <span className={`tag ${training ? 'tag--training' : 'tag--rest'}`}>{training ? 'Entraînement' : 'Repos'}</span>
                  </p>
                </div>
                <div className="day-card-art"><Bowl variant={BOWL_VARIANTS[i % BOWL_VARIANTS.length]} size={80} /></div>
              </li>
            )
          })}
        </ul>
        <p className="footnote">La génération automatique des repas arrive au jalon M2.</p>
      </section>
    </>
  )
}
