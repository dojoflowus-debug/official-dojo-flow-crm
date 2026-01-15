import { useEffect, useState } from 'react'

interface EscHintLabelProps {
  show: boolean
}

export function EscHintLabel({ show }: EscHintLabelProps) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (!show) {
      setOpacity(0)
      return
    }

    setOpacity(1)

    // Auto-hide after 5s
    const timer = setTimeout(() => {
      setOpacity(0)
    }, 5000)

    return () => clearTimeout(timer)
  }, [show])

  return (
    <div
      className="fixed bottom-20 right-6 z-[9999] pointer-events-none"
      style={{
        opacity,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div
        className="px-3 py-1.5 rounded-full text-xs font-mono text-white/70 backdrop-blur-sm"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        Press <span className="text-white/90">ESC</span> to exit
      </div>
    </div>
  )
}
