import { useTheme } from '../hooks/useTheme'
/**
 * ThemeToggle - Componente para cambiar entre modo claro y oscuro
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        font-semibold text-sm transition-all duration-200
        ${theme === 'light'
          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          : 'bg-slate-700 text-white hover:bg-slate-600'
        }
      `}
      aria-label="Cambiar tema"
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <>
          <span className="text-lg">⚪</span>
          <span>White</span>
        </>
      ) : (
        <>
          <span className="text-lg">⚫</span>
          <span>Black</span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle
