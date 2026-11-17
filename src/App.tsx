import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { TabBar, type Tab } from './components/TabBar'
import { BackIcon, GearIcon } from './components/icons'
import { PlanningScreen } from './screens/PlanningScreen'
import { RecipesScreen } from './screens/RecipesScreen'
import { TrackerScreen } from './screens/TrackerScreen'
import { SettingsScreen } from './screens/SettingsScreen'

const TITLES: Record<Tab, string> = { planning: 'Planning', recipes: 'Recettes', tracker: 'Tracker' }

export default function App() {
  const [tab, setTab] = useState<Tab>('planning')
  const [showSettings, setShowSettings] = useState(false)
  const settings = useLiveQuery(() => db.settings.get('main'), [])

  if (!settings) {
    return <div className="loading">Chargement…</div>
  }

  return (
    <div className="app">
      <header className="topbar">
        {showSettings ? (
          <button className="icon-btn" aria-label="Retour" onClick={() => setShowSettings(false)}><BackIcon /></button>
        ) : <span className="icon-btn-spacer" />}
        <h1>{showSettings ? 'Réglages' : TITLES[tab]}</h1>
        {!showSettings ? (
          <button className="icon-btn" aria-label="Réglages" onClick={() => setShowSettings(true)}><GearIcon /></button>
        ) : <span className="icon-btn-spacer" />}
      </header>

      <main className="content">
        {showSettings ? (
          <SettingsScreen settings={settings} />
        ) : tab === 'planning' ? (
          <PlanningScreen settings={settings} />
        ) : tab === 'recipes' ? (
          <RecipesScreen />
        ) : (
          <TrackerScreen settings={settings} />
        )}
      </main>

      {!showSettings && <TabBar active={tab} onChange={setTab} />}
    </div>
  )
}
