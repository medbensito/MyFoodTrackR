import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Settings, WeighIn } from '../types'
import { buildMacros, toISODate } from '../lib/targets'
import { analyze, fmtRate, slopeKgPerDay, WINDOW_DAYS } from '../lib/adaptive'
import { PlusIcon } from './icons'

const SHORT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const kg = (n: number) => n.toFixed(1).replace('.', ',')

/** Courbe des dernières pesées : une série, trait 2 px, point final cerclé. */
function Sparkline({ points }: { points: WeighIn[] }) {
  if (points.length < 2) return null
  const W = 120, H = 40, p = 5
  const ys = points.map((x) => x.kg)
  const min = Math.min(...ys), max = Math.max(...ys), span = Math.max(0.4, max - min)
  const xy = points.map((x, i) => [p + (i / (points.length - 1)) * (W - 2 * p), p + (1 - (x.kg - min) / span) * (H - 2 * p)])
  const last = xy[xy.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" stroke="#c8f560" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#c8f560" stroke="#131715" strokeWidth="2" />
    </svg>
  )
}

function WeighInSheet({ lastKg, onClose }: { lastKg: number; onClose: () => void }) {
  const [value, setValue] = useState(lastKg)
  const [date, setDate] = useState(toISODate(new Date()))
  const valid = Number.isFinite(value) && value > 30 && value < 300
  const save = async () => {
    if (!valid) return
    const rounded = Math.round(value * 10) / 10
    await db.weighIns.put({ date, kg: rounded })
    // Le poids du profil suit la pesée la plus récente (il sert au calcul des protéines par kg).
    const latest = await db.weighIns.orderBy('date').last()
    if (latest) await db.settings.update('main', { weightKg: latest.kg })
    onClose()
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Nouvelle pesée" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="bs-head">
          <div className="bs-titles"><span className="caps caps--lime">Le matin, à jeun</span><strong>Nouvelle pesée</strong></div>
          <button className="bs-close" onClick={onClose}>Fermer</button>
        </div>
        <div className="weigh-input">
          <button aria-label="Moins 100 g" onClick={() => setValue((v) => Math.round((v - 0.1) * 10) / 10)}>−</button>
          <label>
            <span className="sr-only">Poids en kg</span>
            <input type="number" inputMode="decimal" step="0.1" value={Number.isFinite(value) ? value : ''}
              onChange={(e) => setValue(e.target.value === '' ? NaN : Number(e.target.value))} />
            <span>kg</span>
          </label>
          <button aria-label="Plus 100 g" onClick={() => setValue((v) => Math.round((v + 0.1) * 10) / 10)}>+</button>
        </div>
        <label className="field" style={{ marginTop: 10 }}>
          <span>Date</span>
          <input className="input" type="date" value={date} max={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <p className="small muted" style={{ marginTop: 6 }}>Une pesée par semaine suffit, toujours dans les mêmes conditions.</p>
        <button className="btn btn--lime btn--block" style={{ marginTop: 14 }} disabled={!valid} onClick={save}>Enregistrer</button>
      </div>
    </div>
  )
}

export function WeightCard({ settings }: { settings: Settings }) {
  const [weighing, setWeighing] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const today = toISODate(new Date())
  const from = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - WINDOW_DAYS); return toISODate(d) }, [])
  const weighIns = useLiveQuery(() => db.weighIns.orderBy('date').toArray(), [])
  const intake = useLiveQuery(async () => {
    const es = await db.logEntries.where('date').between(from, today, true, false).toArray()
    const m = new Map<string, number>()
    for (const e of es) m.set(e.date, (m.get(e.date) ?? 0) + e.macros.kcal)
    return m
  }, [from, today])

  if (!weighIns || !intake) return null

  const last = weighIns[weighIns.length - 1]
  const recent = weighIns.slice(-8)
  const span = recent.length >= 2 ? (parse(recent[recent.length - 1].date).getTime() - parse(recent[0].date).getTime()) / 86_400_000 : 0
  const trend = recent.length >= 2 && span >= 7 ? slopeKgPerDay(recent) * 7 : null
  const a = analyze({ today, weighIns, intakeByDate: intake, settings })
  const sinceAdjust = settings.lastAdjustAt ? Math.floor((Date.now() - settings.lastAdjustAt) / 86_400_000) : null
  const cooling = sinceAdjust !== null && sinceAdjust < 14

  const apply = async () => {
    if (a.status !== 'adjust') return
    const { rest, training } = settings.targets
    await db.settings.update('main', {
      targets: {
        rest: buildMacros(a.suggested.rest, rest.protein, rest.fat),
        training: buildMacros(a.suggested.training, training.protein, training.fat),
      },
      lastAdjustAt: Date.now(),
    })
  }

  return (
    <>
      <div className="section-label"><span>Poids</span>{last && <span className="small muted">pesé le {SHORT.format(parse(last.date)).replace('.', '')}</span>}</div>
      <div className="card weight-card">
        <div className="weight-top">
          <div>
            <span className="stat-val" style={{ fontSize: 40 }}>{last ? kg(last.kg) : kg(settings.weightKg)}<small> kg</small></span>
            <span className="small muted">{trend !== null ? `Tendance ${fmtRate(trend)}` : last ? 'Tendance après 2 pesées sur 7 jours' : 'Aucune pesée enregistrée'}</span>
          </div>
          <Sparkline points={recent} />
        </div>
        <button className="btn btn--outline btn--sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setWeighing(true)}>
          <PlusIcon /> Nouvelle pesée
        </button>
      </div>

      <div className="section-label"><span>Ajustement des cibles</span></div>
      <div className={`card adapt ${a.status === 'adjust' && !cooling && !dismissed ? 'adapt--on' : ''}`}>
        {a.status === 'insufficient' ? (
          <>
            <p className="small">{a.reason}</p>
            <p className="small muted" style={{ marginTop: 6 }}>Ensuite, l'app compare ton poids à ce que tu manges pour estimer ta dépense réelle et proposer des cibles plus justes.</p>
          </>
        ) : cooling ? (
          <p className="small">Cibles ajustées {sinceAdjust === 0 ? "aujourd'hui" : `il y a ${sinceAdjust} jour${sinceAdjust! > 1 ? 's' : ''}`}. Prochaine analyse dans {14 - sinceAdjust!} jours, le temps que le poids réagisse.</p>
        ) : (
          <>
            <div className="adapt-rate">
              <span className="d">{fmtRate(a.rateKgWeek)}</span>
              <span className="small muted">
                attendu entre {fmtRate((a.expected.min / 100) * settings.weightKg).replace(' kg/sem', '')} et {fmtRate((a.expected.max / 100) * settings.weightKg)} pour ton objectif
              </span>
            </div>
            <p className="small" style={{ marginTop: 10 }}>{a.reason}</p>
            {a.status === 'on-track' ? (
              <p className="ok small" style={{ marginTop: 10 }}>Tes cibles actuelles sont bonnes, rien à changer.</p>
            ) : dismissed ? (
              <p className="small muted" style={{ marginTop: 10 }}>Proposition ignorée pour cette fois.</p>
            ) : (
              <>
                <div className="adapt-grid">
                  <span className="caps">Repos</span>
                  <span>{a.current.rest} → <strong className="lime">{a.suggested.rest}</strong> kcal</span>
                  <span className="caps">Entraînement</span>
                  <span>{a.current.training} → <strong className="lime">{a.suggested.training}</strong> kcal</span>
                </div>
                <p className="small muted">Protéines et lipides inchangés, les glucides suivent. Tu pourras régénérer la semaine ensuite.</p>
                <div className="suggestion-actions">
                  <button className="btn btn--sm" onClick={() => setDismissed(true)}>Plus tard</button>
                  <button className="btn btn--lime btn--sm" onClick={apply}>Appliquer</button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {weighing && <WeighInSheet lastKg={last?.kg ?? settings.weightKg} onClose={() => setWeighing(false)} />}
    </>
  )
}
