import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FocusModeContextType {
  isFocusMode: boolean
  isAnimating: boolean
  showOverlay: boolean
  toggleFocusMode: () => void
  setFocusMode: (value: boolean) => void
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined)

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    const saved = localStorage.getItem('dojoFlowFocusMode')
    return saved === 'on'
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)

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
      isAnimating, 
      showOverlay,
      toggleFocusMode, 
      setFocusMode 
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
