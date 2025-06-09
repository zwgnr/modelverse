import React, { createContext, useContext, useEffect } from 'react'
import { useDarkMode } from 'usehooks-ts'

type DarkModeContextType = {
  isDarkMode: boolean
  toggle: () => void
  enable: () => void
  disable: () => void
  set: (value: boolean) => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function useDarkModeContext() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkModeContext must be used within a DarkModeProvider')
  }
  return context
}

interface DarkModeProviderProps {
  children: React.ReactNode
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const darkMode = useDarkMode({
    localStorageKey: 'acme-chat-dark-mode',
    initializeWithValue: true,
  })

  // Apply/remove dark class to document element
  useEffect(() => {
    if (darkMode.isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode.isDarkMode])

  return (
    <DarkModeContext.Provider value={darkMode}>
      {children}
    </DarkModeContext.Provider>
  )
} 