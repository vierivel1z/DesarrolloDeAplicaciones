import { createContext, useContext, useState, useCallback, useMemo } from 'react'

// Estado de UI compartido: ocultar importes y colapso de menú hamburguesa
const UIContext = createContext(null)

const HIDE_KEY = 'hb_hide_amounts'
const COLLAPSE_KEY = 'hb_sidebar_collapsed'

export function UIProvider({ children }) {
  const [hideAmounts, setHideAmounts] = useState(() => localStorage.getItem(HIDE_KEY) === '1')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  const toggleHideAmounts = useCallback(() => {
    setHideAmounts((prev) => {
      const next = !prev
      localStorage.setItem(HIDE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  const value = useMemo(() => ({ 
    hideAmounts, 
    toggleHideAmounts, 
    sidebarCollapsed, 
    toggleSidebar 
  }), [hideAmounts, toggleHideAmounts, sidebarCollapsed, toggleSidebar])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) return { hideAmounts: false, toggleHideAmounts: () => {}, sidebarCollapsed: false, toggleSidebar: () => {} }
  return ctx
}
