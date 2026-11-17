import type { ReactNode } from 'react'
import { BookIcon, CalendarIcon, RingIcon } from './icons'

export type Tab = 'planning' | 'recipes' | 'tracker'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'planning', label: 'Planning', icon: <CalendarIcon /> },
  { id: 'recipes', label: 'Recettes', icon: <BookIcon /> },
  { id: 'tracker', label: 'Tracker', icon: <RingIcon /> },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'tab--active' : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
