import { RiSunLine, RiMoonLine } from 'react-icons/ri'
import { useTheme } from '../../pages/context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-lg
        border border-border hover:border-border2
        bg-surface2 text-t3 hover:text-t1
        transition-all duration-150 active:scale-95
        ${className}
      `}
    >
      {theme === 'dark'
        ? <RiSunLine  size={16} />
        : <RiMoonLine size={16} />
      }
    </button>
  )
}
