import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { TabBar, type Tab } from './components/TabBar'
import { PlanningScreen } from './screens/PlanningScreen'
import { RecipesScreen } from './screens/RecipesScreen'
import { TrackerScreen } from './screens/TrackerScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('planning')
  const [showSettings, setShowSettings] = useState(false)
  const settings = useLiveQuery(() => db.settings.get('main'), [])
  const contentRef = useRef<HTMLElement>(null)

  // Chaque changement d'écran repart du haut.
  useEffect(() => { contentRef.current?.scrollTo({ top: 0 }) }, [tab, showSettings])

  if (!settings) return <div className="loading">Chargement…</div>

  return (
    <div className="app">
      <main className="content" ref={contentRef}>
        {showSettings ? (
          <SettingsScreen settings={settings} onBack={() => setShowSettings(false)} />
        ) : tab === 'planning' ? (
          <PlanningScreen settings={settings} />
        ) : tab === 'recipes' ? (
          <RecipesScreen />
        ) : tab === 'tracker' ? (
          <TrackerScreen settings={settings} />
        ) : (
          <ProfileScreen settings={settings} onOpenSettings={() => setShowSettings(true)} />
        )}
      </main>
      {!showSettings && <TabBar active={tab} onChange={setTab} />}
    </div>
  )
}
