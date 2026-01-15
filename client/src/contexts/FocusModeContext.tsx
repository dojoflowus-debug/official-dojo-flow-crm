import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface FocusModeContextType {
  isFocusMode: boolean
  isFullscreen: boolean
  isAnimating: boolean
  showOverlay: boolean
  isEntering: boolean
  showEscHint: boolean
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
  const [isEntering, setIsEntering] = useState(false)
  const [showEscHint, setShowEscHint] = useState(false)

  // Listen for fullscreen changes (user can exit with Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcut: Esc to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to exit focus mode (always works)
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault()
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
      setIsEntering(true)
      setShowOverlay(true)
      setShowEscHint(false)
      
      // Update state after initial animation
      setTimeout(() => {
        setIsFocusMode(true)
        localStorage.setItem('dojoFlowFocusMode', 'on')
      }, 100)
      
      // Show ESC hint after overlay fades
      setTimeout(() => {
        setShowEscHint(true)
      }, 1600)
      
      // Hide overlay after 1.5s
      setTimeout(() => {
        setShowOverlay(false)
        setIsEntering(false)
      }, 1500)
      
      // End animation state
      setTimeout(() => {
        setIsAnimating(false)
      }, 1800)
    } else {
      // Exiting Focus Mode
      setIsEntering(false)
      setShowEscHint(false)
      setShowOverlay(true)
      
      setTimeout(() => {
        setIsFocusMode(false)
        localStorage.setItem('dojoFlowFocusMode', 'off')
        setShowOverlay(false)
      }, 300)
      
      // End animation after menus slide back
      setTimeout(() => {
        setIsAnimating(false)
      }, 600)
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
      isEntering,
      showEscHint,
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
