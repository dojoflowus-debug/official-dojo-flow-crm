import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useFocusMode } from '@/contexts/FocusModeContext'

interface DojoFlowLayoutProps {
  children: React.ReactNode
}

export function DojoFlowLayout({ children }: DojoFlowLayoutProps) {
  const location = useLocation()
  const { isFocusMode } = useFocusMode()

  // Add focus-mode class to body when in focus mode
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode')
    } else {
      document.body.classList.remove('focus-mode')
    }
  }, [isFocusMode])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area - fills viewport in focus mode, accounts for top bar in normal mode */}
      <main className={`flex-1 overflow-auto ${!isFocusMode ? 'pt-0' : ''}`}>
        {children}
      </main>
    </div>
  )
}
