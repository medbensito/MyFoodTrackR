import type { ReactNode } from 'react'
import { BackIcon } from './icons'

export function ScreenHeader({ title, subtitle, action, back, compact, children }: {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Affiche un bouton retour à gauche (écrans empilés). */
  back?: () => void
  /** Titre plus petit, pour les titres longs (nom de recette). */
  compact?: boolean
  children?: ReactNode
}) {
  return (
    <header className="hero">
      {back && (
        <div className="hero-nav">
          <button className="round-btn round-btn--sm" aria-label="Retour" onClick={back}><BackIcon size={20} /></button>
        </div>
      )}
      <div className="hero-top">
        <div className="hero-titles">
          <h1 className={compact ? 'h1--compact' : undefined}>{title}</h1>
          {subtitle && <p className="hero-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </header>
  )
}

export function RoundButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button className="round-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}
