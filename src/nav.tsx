import { createContext, useContext } from 'react'

/** Écrans empilés au-dessus des onglets. */
export type View =
  | { type: 'settings' }
  | { type: 'foods' }
  | { type: 'food'; id: string | null }
  | { type: 'recipe'; id: string }
  | { type: 'recipe-edit'; id: string | null }
  | { type: 'shopping' }
  | { type: 'review' }

export type Nav = { push: (v: View) => void; pop: () => void; replace: (v: View) => void }

export const NavContext = createContext<Nav>({ push: () => {}, pop: () => {}, replace: () => {} })
export const useNav = () => useContext(NavContext)
