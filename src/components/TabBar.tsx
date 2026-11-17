import { CalendarIcon, ChartIcon, ChefIcon, UserIcon } from './icons'

export type Tab = 'planning' | 'recipes' | 'tracker' | 'profile'

const TABS: { id: Tab; label: string; Icon: typeof CalendarIcon }[] = [
  { id: 'planning', label: 'Planning', Icon: CalendarIcon },
  { id: 'recipes', label: 'Recettes', Icon: ChefIcon },
  { id: 'tracker', label: 'Tracker', Icon: ChartIcon },
  { id: 'profile', label: 'Profil', Icon: UserIcon },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? 'tab--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={22} active={active === id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
