import type { Settings } from '../types'
import { isTrainingDay, targetsForDate, toISODate, weekDays } from '../lib/targets'
import { MacroLine } from '../components/MacroLine'

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })

export function PlanningScreen({ settings }: { settings: Settings }) {
  const today = new Date()
  const todayISO = toISODate(today)

  return (
    <section className="screen">
      <p className="screen-intro">Semaine en cours. La génération automatique des repas arrive au jalon M2.</p>
      <ul className="day-list">
        {weekDays(today).map((d) => {
          const training = isTrainingDay(d, settings.trainingDays)
          const iso = toISODate(d)
          return (
            <li key={iso} className={`card day ${iso === todayISO ? 'day--today' : ''}`}>
              <div className="day-head">
                <span className="day-name">{DAY_FMT.format(d)}</span>
                <span className={`badge ${training ? 'badge--training' : 'badge--rest'}`}>
                  {training ? 'Entraînement' : 'Repos'}
                </span>
              </div>
              <MacroLine m={targetsForDate(d, settings)} />
              <p className="muted small">Aucun repas planifié</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
