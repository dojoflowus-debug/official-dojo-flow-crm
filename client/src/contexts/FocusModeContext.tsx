import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface FocusModeContextType {
  isFocusMode: boolean
  isFullscreen: boolean
  isAnimating: boolean
  showOverlay: boolean
  toggleFocusMode: () => void
  setFocusMode: (value: boolean) => void
  enterFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  toggleFullscreen: () => Promise<void>
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined)

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    const saved = localStorage.getItem('dojoFlowFocusMode')
    return saved === 'on'
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)

  // Listen for fullscreen changes (user can exit with Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      // If exiting fullscreen, also exit focus mode
      if (!document.fullscreenElement && isFocusMode) {
        // Keep focus mode but update fullscreen state
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isFocusMode])

  // Keyboard shortcut: Esc to exit focus mode, F to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to exit focus mode (only if not in fullscreen - browser handles that)
      if (e.key === 'Escape' && isFocusMode && !document.fullscreenElement) {
        toggleFocusMode()
      }
      // F to toggle fullscreen (only when focus mode is active)
      if (e.key === 'f' && isFocusMode && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          toggleFullscreen()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.error('Failed to enter fullscreen:', err)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
    } catch (err) {
      console.error('Failed to exit fullscreen:', err)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [enterFullscreen, exitFullscreen])

  const toggleFocusMode = () => {
    const newValue = !isFocusMode
    
    // Start animation sequence
    setIsAnimating(true)
    
    if (newValue) {
      // Entering Focus Mode - show overlay
      setShowOverlay(true)
      
      // After slide animation (400ms), start fade
      setTimeout(() => {
        setIsFocusMode(true)
        localStorage.setItem('dojoFlowFocusMode', 'on')
      }, 100)
      
      // Hide overlay after 2.5 seconds total (fade in + hold + fade out)
      setTimeout(() => {
        setShowOverlay(false)
      }, 2500)
      
      // End animation state
      setTimeout(() => {
        setIsAnimating(false)
      }, 600)
    } else {
      // Exiting Focus Mode
      setIsFocusMode(false)
      localStorage.setItem('dojoFlowFocusMode', 'off')
      
      // End animation after menus slide back
      setTimeout(() => {
        setIsAnimating(false)
      }, 500)
    }
  }

  const setFocusMode = (value: boolean) => {
    setIsFocusMode(value)
    localStorage.setItem('dojoFlowFocusMode', value ? 'on' : 'off')
  }

  return (
    <FocusModeContext.Provider value={{ 
      isFocusMode, 
      isFullscreen,
      isAnimating, 
      showOverlay,
      toggleFocusMode, 
      setFocusMode,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen
    }}>
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  const context = useContext(FocusModeContext)
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider')
  }
  return context
}
