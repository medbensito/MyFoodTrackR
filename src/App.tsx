import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { NavContext, type Nav, type View } from './nav'
import { TabBar, type Tab } from './components/TabBar'
import { PlanningScreen } from './screens/PlanningScreen'
import { RecipesScreen } from './screens/RecipesScreen'
import { TrackerScreen } from './screens/TrackerScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { FoodsScreen } from './screens/FoodsScreen'
import { FoodEditScreen } from './screens/FoodEditScreen'
import { RecipeDetailScreen } from './screens/RecipeDetailScreen'
import { RecipeEditScreen } from './screens/RecipeEditScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('planning')
  const [stack, setStack] = useState<View[]>([])
  const settings = useLiveQuery(() => db.settings.get('main'), [])
  const contentRef = useRef<HTMLElement>(null)
  const top = stack[stack.length - 1]

  const nav: Nav = useMemo(() => ({
    push: (v) => setStack((s) => [...s, v]),
    pop: () => setStack((s) => s.slice(0, -1)),
    replace: (v) => setStack((s) => [...s.slice(0, -1), v]),
  }), [])

  // Chaque changement d'écran repart du haut.
  useEffect(() => { contentRef.current?.scrollTo({ top: 0 }) }, [tab, stack.length, top])

  if (!settings) return <div className="loading">Chargement…</div>

  const changeTab = (t: Tab) => { setStack([]); setTab(t) }

  let screen
  if (top?.type === 'settings') screen = <SettingsScreen settings={settings} onBack={nav.pop} />
  else if (top?.type === 'foods') screen = <FoodsScreen />
  else if (top?.type === 'food') screen = <FoodEditScreen key={top.id ?? 'new'} id={top.id} />
  else if (top?.type === 'recipe') screen = <RecipeDetailScreen key={top.id} id={top.id} />
  else if (top?.type === 'recipe-edit') screen = <RecipeEditScreen key={top.id ?? 'new'} id={top.id} />
  else if (tab === 'planning') screen = <PlanningScreen settings={settings} />
  else if (tab === 'recipes') screen = <RecipesScreen />
  else if (tab === 'tracker') screen = <TrackerScreen settings={settings} />
  else screen = <ProfileScreen settings={settings} />

  // L'éditeur et la fiche gardent la barre d'onglets cachée pour laisser la place aux actions.
  const hideTabs = top && top.type !== 'foods'

  return (
    <NavContext.Provider value={nav}>
      <div className="app">
        <main className="content" ref={contentRef}>{screen}</main>
        {!hideTabs && <TabBar active={tab} onChange={changeTab} />}
      </div>
    </NavContext.Provider>
  )
}
