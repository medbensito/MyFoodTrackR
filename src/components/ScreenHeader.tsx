import type { ReactNode } from 'react'
import { BackIcon } from './icons'

/** En-tête de la direction A : grand titre condensé, sous-titre en capitales, actions carrées. */
export function ScreenHeader({ title, subtitle, dot, action, back, backAction, children }: {
  title?: ReactNode
  subtitle?: ReactNode
  /** Pastille citron devant le sous-titre (jour d'entraînement, état actif). */
  dot?: boolean
  action?: ReactNode
  /** Bouton retour au-dessus du titre (écrans empilés). */
  back?: () => void
  /** Action à droite du bouton retour. */
  backAction?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="head">
      {back && (
        <div className="head-nav">
          <button className="sq-btn" aria-label="Retour" onClick={back}><BackIcon size={20} /></button>
          {backAction}
        </div>
      )}
      {title && (
        <div className="head-row">
          <div className="head-titles">
            <h1>{title}</h1>
            {subtitle && <span className="head-sub">{dot && <span className="dot" aria-hidden />}{subtitle}</span>}
          </div>
          {action && <div className="head-actions">{action}</div>}
        </div>
      )}
      {children && <div className="head-body">{children}</div>}
    </header>
  )
}

export function SquareButton({ label, onClick, disabled, children }: {
  label: string; onClick?: () => void; disabled?: boolean; children: ReactNode
}) {
  return <button className="sq-btn" aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>
}
