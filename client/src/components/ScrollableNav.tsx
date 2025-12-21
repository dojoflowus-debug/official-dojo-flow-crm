import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScrollableNavProps {
  children: React.ReactNode
  className?: string
  activeItemHref?: string
  isDark?: boolean
  isCinematic?: boolean
}

export function ScrollableNav({ 
  children, 
  className = '', 
  activeItemHref,
  isDark = false,
  isCinematic = false
}: ScrollableNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  // Check if content overflows and update arrow visibility
  const updateArrowVisibility = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const hasOverflow = scrollWidth > clientWidth

    setIsOverflowing(hasOverflow)
    setShowLeftArrow(hasOverflow && scrollLeft > 5) // 5px threshold
    setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  // Scroll to a specific position
  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.7 // Scroll 70% of visible width
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }, [])

  // Auto-scroll active item into view
  useEffect(() => {
    if (!activeItemHref || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const activeLink = container.querySelector(`a[href="${activeItemHref}"]`) as HTMLElement
    
    if (activeLink) {
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeLink.getBoundingClientRect()
      
      // Check if active item is partially or fully out of view
      const isOutOfView = 
        activeRect.left < containerRect.left || 
        activeRect.right > containerRect.right

      if (isOutOfView) {
        // Calculate scroll position to center the active item
        const scrollLeft = activeLink.offsetLeft - (container.clientWidth / 2) + (activeLink.clientWidth / 2)
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [activeItemHref])

  // Update arrow visibility on scroll, resize, mount, and DOM changes
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateArrowVisibility()

    const handleScroll = () => updateArrowVisibility()
    const handleResize = () => {
      updateArrowVisibility()
      // Re-check active item visibility after resize
      if (activeItemHref) {
        setTimeout(() => {
          const activeLink = container.querySelector(`a[href="${activeItemHref}"]`) as HTMLElement
          if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
          }
        }, 100)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    // Initial check after a short delay to ensure DOM is ready
    const timer = setTimeout(updateArrowVisibility, 100)
    
    // Observe DOM changes to detect when children are added/removed
    const observer = new MutationObserver(() => {
      updateArrowVisibility()
    })
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [updateArrowVisibility, activeItemHref])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && showLeftArrow) {
        e.preventDefault()
        scrollTo('left')
      } else if (e.key === 'ArrowRight' && showRightArrow) {
        e.preventDefault()
        scrollTo('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLeftArrow, showRightArrow, scrollTo])

  return (
    <div className="relative h-full w-full pointer-events-none">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scrollTo('left')}
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            pointer-events-auto
            h-10 w-8 flex items-center justify-center
            transition-all duration-200
            ${isDark || isCinematic 
              ? 'bg-gradient-to-r from-[#111217] via-[#111217]/95 to-transparent hover:from-[#1A1B1F]' 
              : 'bg-gradient-to-r from-[#050608] via-[#050608]/95 to-transparent hover:from-[#0A0B0F]'
            }
          `}
          aria-label="Scroll left"
        >
          <ChevronLeft 
            className="h-5 w-5 text-white/80 hover:text-white transition-colors" 
            strokeWidth={2.5}
          />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`
          h-full w-full
          flex items-center
          overflow-x-auto overflow-y-hidden
          scrollbar-hide
          pointer-events-auto
          ${isOverflowing ? 'justify-start gap-2 px-10' : 'justify-around'}
          ${className}
        `}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scrollTo('right')}
          className={`
            absolute right-0 top-1/2 -translate-y-1/2 z-10
            pointer-events-auto
            h-10 w-8 flex items-center justify-center
            transition-all duration-200
            ${isDark || isCinematic 
              ? 'bg-gradient-to-l from-[#111217] via-[#111217]/95 to-transparent hover:from-[#1A1B1F]' 
              : 'bg-gradient-to-l from-[#050608] via-[#050608]/95 to-transparent hover:from-[#0A0B0F]'
            }
          `}
          aria-label="Scroll right"
        >
          <ChevronRight 
            className="h-5 w-5 text-white/80 hover:text-white transition-colors" 
            strokeWidth={2.5}
          />
        </button>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
