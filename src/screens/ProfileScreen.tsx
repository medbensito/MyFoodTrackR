import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useNav } from '../nav'
import type { Settings } from '../types'
import { lastExportLabel } from '../components/BackupCard'
import { daysSince } from '../lib/backup'
import { GOAL_LABEL, TIME_LABEL, trainingDaysLabel } from '../lib/labels'
import { ScreenHeader, SquareButton } from '../components/ScreenHeader'
import { WeightCard } from '../components/WeightCard'
import { MoonIcon } from '../components/icons'
import {
  CalendarIcon, ChevronIcon, ClockIcon, DatabaseIcon, GearIcon, PencilIcon, SaveIcon, TargetIcon, TargetsIcon,
} from '../components/icons'

const SHORT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
const fmtShort = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return SHORT.format(new Date(y, m - 1, d)) }

function PrefRow({ icon, label, value, onClick, warn }: { icon: ReactNode; label: string; value: string; onClick: () => void; warn?: boolean }) {
  return (
    <li>
      <button className="pref-row" onClick={onClick}>
        <span className="pref-icon">{icon}</span>
        <span className="pref-text"><span>{label}</span><strong className={warn ? 'warn' : undefined}>{value}</strong></span>
        {warn && <span className="tag tag--amber">À faire</span>}
        <span className="chev"><ChevronIcon /></span>
      </button>
    </li>
  )
}

export function ProfileScreen({ settings }: { settings: Settings }) {
  const nav = useNav()
  const onOpenSettings = () => nav.push({ type: 'settings' })
  const foodStats = useLiveQuery(async () => {
    const all = await db.foods.toArray()
    return { total: all.length, verified: all.filter((f) => f.verified).length }
  }, [])
  const goal = GOAL_LABEL[settings.goal ?? 'recomposition']
  const name = settings.name || 'Moi'
  const pPerKg = settings.weightKg > 0 ? (settings.targets.training.protein / settings.weightKg).toFixed(1).replace('.', ',') : '—'

  return (
    <>
      <ScreenHeader
        title="Profil"
        subtitle={`Objectif · ${goal.short}`}
        dot
        action={<SquareButton label="Réglages" onClick={onOpenSettings}><GearIcon size={20} /></SquareButton>}
      >
        <div className="id-card">
          <span className="avatar" aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
          <span className="id-text">
            <strong>{name}</strong>
            <span className="small muted">{pPerKg} g de protéines par kg</span>
          </span>
          <SquareButton label="Modifier le profil" onClick={onOpenSettings}><PencilIcon /></SquareButton>
        </div>
      </ScreenHeader>

      <section className="screen">
        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="stat"><span className="caps">Poids</span><span className="stat-val">{settings.weightKg}<small> kg</small></span></div>
          <div className="stat"><span className="caps">Taille</span><span className="stat-val">{settings.heightCm}<small> cm</small></span></div>
          <div className="stat"><span className="caps">Âge</span><span className="stat-val">{settings.age}<small> ans</small></span></div>
        </div>

        <button className="goal-card" onClick={onOpenSettings}>
          <span className="lime"><TargetIcon /></span>
          <span className="goal-text">
            <span className="caps caps--lime">Mon objectif</span>
            <span>{goal.long}</span>
          </span>
          <span className="lime"><ChevronIcon /></span>
        </button>

        <WeightCard settings={settings} />

        <div className="section-label"><span>Préférences</span></div>
        <div className="prefs">
          <ul>
            <PrefRow icon={<CalendarIcon />} label="Jours d'entraînement" value={trainingDaysLabel(settings.trainingDays)} onClick={onOpenSettings} />
            <PrefRow icon={<ClockIcon />} label="Moment de la séance" value={TIME_LABEL[settings.trainingTime]} onClick={onOpenSettings} />
            <PrefRow
              icon={<MoonIcon />} label="Ramadan"
              value={settings.ramadan?.enabled ? `Du ${fmtShort(settings.ramadan.start)} au ${fmtShort(settings.ramadan.end)}` : 'Désactivé'}
              onClick={onOpenSettings}
            />
            <PrefRow
              icon={<TargetsIcon />} label="Cibles repos / entraînement"
              value={`${settings.targets.rest.kcal} / ${settings.targets.training.kcal} kcal · ${settings.targets.training.protein} g P`}
              onClick={onOpenSettings}
            />
            <PrefRow
              icon={<DatabaseIcon />} label="Base d'aliments"
              value={foodStats ? `${foodStats.total} aliments · ${foodStats.verified} vérifiés` : '…'}
              onClick={() => nav.push({ type: 'foods' })}
            />
            <PrefRow
              icon={<SaveIcon />} label="Sauvegarde"
              value={lastExportLabel(settings.lastExportAt)}
              warn={(daysSince(settings.lastExportAt) ?? Infinity) > 7}
              onClick={onOpenSettings}
            />
          </ul>
        </div>
        <p className="footnote">MyFoodTrackR {__APP_VERSION__}</p>
      </section>
    </>
  )
}
