import { useEffect, useRef, ReactNode } from 'react'

interface ModalOverlayProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the overlay is clicked (to close modal) */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Custom className for the modal container */
  className?: string
  /** Whether clicking outside should close the modal (default: true) */
  closeOnClickOutside?: boolean
  /** Whether ESC key should close the modal (default: true) */
  closeOnEscape?: boolean
  /** Custom z-index for the overlay (default: 9998) */
  zIndex?: number
}

/**
 * ModalOverlay - Provides a consistent fog/blur overlay for all modals
 * 
 * Features:
 * - Full-screen overlay with 55-70% opacity dimming
 * - Backdrop blur (8-14px) for fogged, cinematic look
 * - Disables background interaction when modal is open
 * - ESC key closes modal
 * - Clicking outside modal closes it
 * - Smooth fade animations
 */
export function ModalOverlay({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnClickOutside = true,
  closeOnEscape = true,
  zIndex = 9998,
}: ModalOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key to close modal
  useEffect(() => {
    if (!closeOnEscape) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, closeOnEscape])

  // Handle click outside to close modal
  useEffect(() => {
    if (!closeOnClickOutside) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, closeOnClickOutside])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Fog/Blur Overlay Background */}
      <div
        ref={overlayRef}
        className="fixed inset-0 transition-all duration-300"
        style={{
          zIndex,
          background: 'rgba(0, 0, 0, 0.65)', // 65% opacity for fog effect
          backdropFilter: 'blur(12px)', // 12px blur for cinematic look
          WebkitBackdropFilter: 'blur(12px)', // Safari support
        }}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`fixed inset-0 flex items-center justify-center ${className}`}
        style={{ zIndex: zIndex + 1 }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </>
  )
}

/**
 * ModalContent - Wrapper for modal content with consistent styling
 * 
 * Provides:
 * - Glassmorphism background
 * - Stronger shadow for focus effect
 * - Subtle border glow
 * - Smooth animations
 */
interface ModalContentProps {
  children: ReactNode
  className?: string
  /** Width preset */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Whether to show the modal with animation */
  animate?: boolean
}

export function ModalContent({
  children,
  className = '',
  width = 'md',
  animate = true,
}: ModalContentProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-48px)]',
  }

  return (
    <div
      className={`
        w-full ${widthClasses[width]} max-h-[calc(100vh-96px)]
        rounded-2xl overflow-hidden
        ${animate ? 'animate-in fade-in-0 zoom-in-95 duration-200' : ''}
        ${className}
      `}
      style={{
        background: 'rgba(26, 26, 29, 0.98)', // Near-solid dark background
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 0 40px rgba(0, 0, 0, 0.3)
        `, // Strong shadow + subtle glow
      }}
    >
      {children}
    </div>
  )
}

export default ModalOverlay
