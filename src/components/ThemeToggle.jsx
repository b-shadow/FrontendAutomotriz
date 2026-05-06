import { useTheme } from '../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'
/**
 * ThemeToggle - Componente para cambiar entre modo claro y oscuro
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center p-2.5 rounded-lg
        font-semibold text-sm tracking-wide transition-all duration-200 border
        ${theme === 'light' ? 'bg-neutral-100 text-carbon-800 border-neutral-300 hover:bg-neutral-200 hover:border-primary-300' : 'bg-white/[0.05] text-neutral-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-primary-400 hover:border-primary-500/30'
        }
      `}
      aria-label="Cambiar tema"
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Sun size={18} strokeWidth={2.2} aria-hidden="true" /> ) : (
        <Moon size={18} strokeWidth={2.2} aria-hidden="true" />
      )}
    </button>
  )
}

export default ThemeToggle
