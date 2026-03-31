import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContextValue'

/**
 * Hook useTheme - Proporciona acceso al contexto de tema. Usa:
 *   const { theme, toggleTheme, isDark, isLight } = useTheme()
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider')
  }

  return context
}
