import type { ReactNode } from 'react'
import type { MealSlot, Settings } from '../types'
import { targetsForDate } from '../lib/targets'
import { macroShares } from '../lib/labels'
import { RoundButton, ScreenHeader } from '../components/ScreenHeader'
import { Bowl } from '../components/Bowl'
import { ChartIcon, DropIcon, FlameIcon, LeafIcon, PlusIcon } from '../components/icons'

const SLOTS: { id: MealSlot; label: string; bowl: 'oats' | 'chicken' | 'salmon' | 'salad' }[] = [
  { id: 'breakfast', label: 'Petit-déjeuner', bowl: 'oats' },
  { id: 'lunch', label: 'Déjeuner', bowl: 'chicken' },
  { id: 'dinner', label: 'Dîner', bowl: 'salmon' },
  { id: 'snack', label: 'Collation', bowl: 'salad' },
]

function Ring({ value, target }: { value: number; target: number }) {
  const r = 92
  const c = 2 * Math.PI * r
  const pct = target > 0 ? Math.min(1, value / target) : 0
  return (
    <svg className="ring" viewBox="0 0 220 220" aria-hidden>
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b9f27c" />
          <stop offset="100%" stopColor="#34c46a" />
        </linearGradient>
        <radialGradient id="ring-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1f6a43" />
          <stop offset="100%" stopColor="#0b3523" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="110" r="78" fill="url(#ring-core)" />
      <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="13" />
      <circle
        cx="110" cy="110" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="13" strokeLinecap="round"
        strokeDasharray={`${Math.max(pct * c, 0.01)} ${c}`} transform="rotate(-90 110 110)"
      />
    </svg>
  )
}

function MacroTile({ icon, tone, label, value, share }: {
  icon: ReactNode; tone: string; label: string; value: number; share: number
}) {
  return (
    <div className="tile">
      <span className={`tile-icon tile-icon--${tone}`}>{icon}</span>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value} g</span>
      <span className="tile-share">({share}%)</span>
    </div>
  )
}

export function TrackerScreen({ settings }: { settings: Settings }) {
  const today = new Date()
  const t = targetsForDate(today, settings)
  const consumed = 0 // saisie au jalon M3
  const pct = Math.round((consumed / t.kcal) * 100)
  const shares = macroShares(t)

  return (
    <>
      <ScreenHeader
        title="Tracker"
        subtitle="Suivez votre progression en temps réel"
        action={<RoundButton label="Statistiques"><ChartIcon size={22} /></RoundButton>}
      >
        <div className="ring-wrap">
          <Ring value={consumed} target={t.kcal} />
          <div className="ring-center">
            <span className="flame flame--lg"><FlameIcon size={26} /></span>
            <span className="ring-value">{consumed}</span>
            <span className="ring-target">/ {t.kcal} kcal</span>
            <span className="ring-pill">{pct}%</span>
          </div>
        </div>
      </ScreenHeader>

      <section className="screen screen--overlap">
        <div className="tiles">
          <MacroTile icon={<FlameIcon />} tone="protein" label="Protéines" value={t.protein} share={shares.protein} />
          <MacroTile icon={<LeafIcon />} tone="carbs" label="Glucides" value={t.carbs} share={shares.carbs} />
          <MacroTile icon={<DropIcon />} tone="fat" label="Lipides" value={t.fat} share={shares.fat} />
        </div>
        <p className="tiles-caption">Cibles du jour</p>

        <div className="section-head">
          <h2>Repas d'aujourd'hui</h2>
        </div>
        <ul className="card meal-list">
          {SLOTS.map((s) => (
            <li key={s.id} className="meal-row">
              <span className="meal-thumb"><Bowl variant={s.bowl} size={58} /></span>
              <span className="meal-info">
                <strong>{s.label}</strong>
                <span className="muted small">Rien de planifié</span>
              </span>
              <span className="check-circle" aria-label="Non mangé" />
            </li>
          ))}
        </ul>
        <button className="cta" disabled>Ajouter un repas <PlusIcon /></button>
        <p className="footnote">La saisie des repas arrive au jalon M3.</p>
      </section>
    </>
  )
}
