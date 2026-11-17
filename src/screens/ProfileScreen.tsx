import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useNav } from '../nav'
import type { Settings } from '../types'
import { lastExportLabel } from '../components/BackupCard'
import { daysSince } from '../lib/backup'
import { GOAL_LABEL, TIME_LABEL, trainingDaysLabel } from '../lib/labels'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import {
  ArrowIcon, CakeIcon, CalendarIcon, ChevronIcon, ClockIcon, DatabaseIcon, GearIcon, PencilIcon,
  RulerIcon, ScaleIcon, TargetIcon, TargetsIcon,
} from '../components/icons'

function StatTile({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="tile tile--stat">
      <span className="tile-icon tile-icon--brand">{icon}</span>
      <span className="tile-value">{value}</span>
      <span className="tile-share">{label}</span>
    </div>
  )
}

function PrefRow({ icon, label, value, onClick, warn }: { icon: ReactNode; label: string; value: string; onClick: () => void; warn?: boolean }) {
  return (
    <li>
      <button className="pref-row" onClick={onClick}>
        <span className="pref-icon">{icon}</span>
        <span className="pref-text"><span>{label}</span><strong className={warn ? 'warn' : undefined}>{value}</strong></span>
        {warn && <span className="tag tag--warn">À faire</span>}
        <ChevronIcon />
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

  return (
    <>
      <ScreenHeader
        title="Profil"
        action={<RoundButton label="Réglages" onClick={onOpenSettings}><GearIcon size={22} /></RoundButton>}
      >
        <div className="profile-card">
          <span className="avatar">{name.trim().charAt(0).toUpperCase()}</span>
          <span className="profile-text">
            <strong>{name}</strong>
            <span>Objectif : {goal.short}</span>
          </span>
          <button className="icon-ghost" aria-label="Modifier le profil" onClick={onOpenSettings}><PencilIcon /></button>
        </div>
      </ScreenHeader>

      <section className="screen screen--overlap">
        <div className="tiles">
          <StatTile icon={<ScaleIcon />} value={`${settings.weightKg} kg`} label="Poids actuel" />
          <StatTile icon={<RulerIcon />} value={`${settings.heightCm} cm`} label="Taille" />
          <StatTile icon={<CakeIcon />} value={`${settings.age} ans`} label="Âge" />
        </div>

        <button className="goal-card" onClick={onOpenSettings}>
          <span className="goal-icon"><TargetIcon /></span>
          <span className="goal-text">
            <strong>Mon objectif</strong>
            <span>{goal.long}</span>
          </span>
          <ChevronIcon />
        </button>

        <div className="card prefs">
          <h2><GearIcon size={18} /> Mes préférences</h2>
          <ul>
            <PrefRow icon={<CalendarIcon size={22} />} label="Jours d'entraînement" value={trainingDaysLabel(settings.trainingDays)} onClick={onOpenSettings} />
            <PrefRow icon={<ClockIcon />} label="Moment de la séance" value={TIME_LABEL[settings.trainingTime]} onClick={onOpenSettings} />
            <PrefRow
              icon={<TargetsIcon />} label="Cibles"
              value={`${settings.targets.rest.kcal} / ${settings.targets.training.kcal} kcal · P ${settings.targets.training.protein} g`}
              onClick={onOpenSettings}
            />
            <PrefRow
              icon={<DatabaseIcon />} label="Base d'aliments"
              value={foodStats ? `${foodStats.total} aliments · ${foodStats.verified} vérifiés` : '…'}
              onClick={() => nav.push({ type: 'foods' })}
            />
            <PrefRow
              icon={<ArrowIcon size={20} />} label="Sauvegarde"
              value={lastExportLabel(settings.lastExportAt)}
              warn={(daysSince(settings.lastExportAt) ?? Infinity) > 7}
              onClick={onOpenSettings}
            />
          </ul>
        </div>
        <p className="footnote">Le suivi du poids reste dans ton app de transformation physique.</p>
        <p className="footnote">MyFoodTrackR {__APP_VERSION__}</p>
      </section>
    </>
  )
}
