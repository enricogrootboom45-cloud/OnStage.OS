import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutContextValue {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const LayoutContext = createContext<LayoutContextValue>({
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
})

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((o) => !o),
        closeSidebar: () => setSidebarOpen(false),
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
