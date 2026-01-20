import { useEffect, useState } from 'react'

interface CinematicFocusOverlayProps {
  isVisible: boolean
  isEntering: boolean
  onAnimationComplete?: () => void
}

export function CinematicFocusOverlay({
  isVisible,
  isEntering,
  onAnimationComplete,
}: CinematicFocusOverlayProps) {
  const [opacity, setOpacity] = useState(0)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setOpacity(0)
      setShowMessage(false)
      return
    }

    if (isEntering) {
      // Entry animation
      setOpacity(1)
      setShowMessage(true)

      // Auto-hide overlay after 1.5s
      const timer = setTimeout(() => {
        setOpacity(0)
        setTimeout(() => {
          onAnimationComplete?.()
        }, 300)
      }, 1500)

      return () => clearTimeout(timer)
    } else {
      // Exit animation (quick fade to black)
      setOpacity(1)
      setTimeout(() => {
        setOpacity(0)
        setTimeout(() => {
          onAnimationComplete?.()
        }, 300)
      }, 100)
    }
  }, [isVisible, isEntering, onAnimationComplete])

  if (!isVisible && opacity === 0) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
      style={{
        background: `rgba(0, 0, 0, ${opacity * 0.95})`,
        backdropFilter: `blur(${opacity * 20}px)`,
        WebkitBackdropFilter: `blur(${opacity * 20}px)`,
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Center glow pulse */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: opacity * (showMessage ? 1 : 0),
          transition: 'opacity 300ms ease-out',
        }}
      >
        {/* Soft glow pulse from center */}
        <div
          className="absolute w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(229,57,53,0.3) 0%, rgba(229,57,53,0.1) 40%, transparent 70%)',
            animation: isEntering ? 'focusPulse 1.5s ease-in-out' : 'none',
            filter: 'blur(40px)',
          }}
        />

        {/* Message container */}
        <div
          className="relative z-10 text-center space-y-3"
          style={{
            opacity: showMessage ? 1 : 0,
            transform: showMessage ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Main message */}
          <h2 className="text-4xl font-bold text-white tracking-wide">
            Focus Mode Activated
          </h2>

          {/* Subtext */}
          <p className="text-sm text-white/60 font-light tracking-wide">
            Immersive workspace engaged
          </p>

          {/* ESC hint */}
          <p className="text-xs text-white/40 pt-2 font-mono">
            Press ESC anytime to return
          </p>

          {/* Subtle loading spinner */}
          <div className="flex justify-center mt-6">
            <div
              className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes focusPulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
