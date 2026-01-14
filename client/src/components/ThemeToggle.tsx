import { useTheme, Theme } from '@/contexts/ThemeContext'
import { Sun, Moon, Sparkles } from 'lucide-react'

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
]

interface ThemeToggleProps {
  showCinematic?: boolean
}

export default function ThemeToggle({ showCinematic = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  
  // Filter themes based on showCinematic prop
  const availableThemes = showCinematic 
    ? themes 
    : themes.filter(t => t.id !== 'cinematic')
  
  // Get accent color based on current theme
  const getAccentColor = () => {
    switch (theme) {
      case 'light': return '#E53935'
      case 'dark': return '#FF4F4F'
      case 'cinematic': return '#FF5A3D'
      default: return '#E53935'
    }
  }
  
  // Get background colors based on current theme
  const getBgColor = () => {
    switch (theme) {
      case 'light': return 'bg-gray-100'
      case 'dark': return 'bg-[#2A2B2F]'
      case 'cinematic': return 'bg-white/10 backdrop-blur-md'
      default: return 'bg-gray-100'
    }
  }
  
  const getTextColor = (isActive: boolean) => {
    if (isActive) return 'text-white'
    switch (theme) {
      case 'light': return 'text-gray-600 hover:text-gray-900'
      case 'dark': return 'text-gray-400 hover:text-white'
      case 'cinematic': return 'text-gray-400 hover:text-white'
      default: return 'text-gray-600'
    }
  }

  return (
    <div 
      className={`
        flex items-center gap-0.5 p-1 rounded-full
        ${getBgColor()}
        transition-all duration-300 ease-in-out
      `}
    >
      {availableThemes.map((t) => {
        const isActive = theme === t.id
        const Icon = t.icon
        
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
              text-xs font-medium
              transition-all duration-200 ease-out
              ${getTextColor(isActive)}
              ${isActive ? 'shadow-lg' : ''}
            `}
            style={{
              backgroundColor: isActive ? getAccentColor() : 'transparent',
              boxShadow: isActive ? `0 4px 12px ${getAccentColor()}40` : 'none'
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
