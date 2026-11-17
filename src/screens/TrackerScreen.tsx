import type { Settings } from '../types'
import { isTrainingDay, targetsForDate } from '../lib/targets'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function Bar({ label, value, target, unit, highlight }: {
  label: string; value: number; target: number; unit: string; highlight?: boolean
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className={`bar ${highlight ? 'bar--highlight' : ''}`}>
      <div className="bar-head">
        <span>{label}</span>
        <span className="bar-values">{value} / {target} {unit}</span>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export function TrackerScreen({ settings }: { settings: Settings }) {
  const today = new Date()
  const t = targetsForDate(today, settings)
  const training = isTrainingDay(today, settings.trainingDays)

  return (
    <section className="screen">
      <div className="card">
        <div className="day-head">
          <span className="day-name">{DATE_FMT.format(today)}</span>
          <span className={`badge ${training ? 'badge--training' : 'badge--rest'}`}>
            {training ? 'Entraînement' : 'Repos'}
          </span>
        </div>
        <Bar label="Protéines" value={0} target={t.protein} unit="g" highlight />
        <Bar label="Calories" value={0} target={t.kcal} unit="kcal" />
        <Bar label="Glucides" value={0} target={t.carbs} unit="g" />
        <Bar label="Lipides" value={0} target={t.fat} unit="g" />
      </div>
      <p className="screen-intro">La saisie des repas arrive au jalon M3.</p>
    </section>
  )
}
