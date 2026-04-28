import { useEffect, useState } from 'react'

interface EscHintLabelProps {
  show: boolean
  onExit?: () => void
}

export function EscHintLabel({ show, onExit }: EscHintLabelProps) {
  const [opacity, setOpacity] = useState(0)
  // Detect touch device (Android/iOS)
  const [isTouchDevice] = useState(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  )

  useEffect(() => {
    if (!show) {
      setOpacity(0)
      return
    }
    setOpacity(1)
    // On desktop auto-hide after 5s; on mobile keep visible so user can tap it
    if (!isTouchDevice) {
      const timer = setTimeout(() => setOpacity(0), 5000)
      return () => clearTimeout(timer)
    }
  }, [show, isTouchDevice])

  return (
    <div
      className="fixed bottom-20 right-6 z-[9999]"
      style={{
        opacity,
        transition: 'opacity 300ms ease-out',
        pointerEvents: isTouchDevice && onExit ? 'auto' : 'none',
      }}
      onClick={isTouchDevice && onExit ? onExit : undefined}
    >
      <div
        className="px-3 py-1.5 rounded-full text-xs font-mono text-white/70 backdrop-blur-sm"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          cursor: isTouchDevice && onExit ? 'pointer' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {isTouchDevice
          ? <><span className="text-white/90">Tap</span> to exit focus</>
          : <>Press <span className="text-white/90">ESC</span> to exit</>
        }
      </div>
    </div>
  )
}
