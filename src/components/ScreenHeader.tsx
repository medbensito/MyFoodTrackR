import type { ReactNode } from 'react'

export function ScreenHeader({ title, subtitle, action, children }: {
  title: string
  subtitle?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="hero">
      <div className="hero-top">
        <div>
          <h1>{title}</h1>
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
