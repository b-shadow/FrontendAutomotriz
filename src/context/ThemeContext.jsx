import { useState, useEffect } from 'react'
import { ThemeContext } from './ThemeContextValue'

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Obtener preferencia guardada en localStorage
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme) {
      return savedTheme
    }
    // Si no hay preferencia guardada, usar preferencia del sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Guardar preferencia en localStorage
    localStorage.setItem('app-theme', theme)
  }, [theme])

  /**
   * Función para alternar entre temas
   */
  const toggleTheme = (newTheme) => {
    if (newTheme && ['light', 'dark'].includes(newTheme)) {
      setTheme(newTheme)
    } else {
      setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
    }
  }

  const value = {
    theme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
