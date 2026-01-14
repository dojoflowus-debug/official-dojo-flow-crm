/**
 * Motion and Interaction Utilities for Dojo Interface
 * Provides premium OS-level motion language and micro-interactions
 */

/**
 * Easing functions for smooth animations
 */
export const easing = {
  // Apple-style easing
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
  
  // Smooth easing
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',
  smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',
  
  // Spring-like easing
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}

/**
 * Timing constants (in milliseconds)
 */
export const timing = {
  instant: 0,
  fast: 150,
  base: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
}

/**
 * Motion presets for common interactions
 */
export const motionPresets = {
  // Card hover lift
  cardLift: {
    duration: timing.base,
    easing: easing.smooth,
    transform: 'translateY(-8px)',
  },
  
  // Gentle glow pulse
  glowPulse: {
    duration: timing.slower,
    easing: easing.smooth,
    animation: 'pulse-glow',
  },
  
  // Soft fade in
  fadeIn: {
    duration: timing.base,
    easing: easing.smooth,
    opacity: 1,
  },
  
  // Smooth slide up
  slideUp: {
    duration: timing.base,
    easing: easing.smooth,
    transform: 'translateY(-4px)',
  },
  
  // Breathing background
  breathing: {
    duration: timing.slowest * 2,
    easing: easing.smooth,
    animation: 'breathing',
  },
}

/**
 * Generate CSS transition string
 */
export function generateTransition(
  properties: string | string[] = 'all',
  duration: number = timing.base,
  easing_fn: string = easing.smooth
): string {
  const props = Array.isArray(properties) ? properties : [properties]
  return props
    .map(prop => `${prop} ${duration}ms ${easing_fn}`)
    .join(', ')
}

/**
 * Generate CSS animation string
 */
export function generateAnimation(
  name: string,
  duration: number = timing.base,
  easing_fn: string = easing.smooth,
  iterationCount: string | number = 1
): string {
  return `${name} ${duration}ms ${easing_fn} ${iterationCount}`
}

/**
 * Delay utilities for staggered animations
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay
}

/**
 * Hover state utilities
 */
export const hoverStates = {
  lift: 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15',
  glow: 'hover:shadow-lg hover:shadow-blue-500/30',
  brighten: 'hover:brightness-110',
  scale: 'hover:scale-105',
  all: 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15 hover:brightness-105',
}

/**
 * Focus state utilities for accessibility
 */
export const focusStates = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
  glow: 'focus:outline-none focus:shadow-lg focus:shadow-blue-500/30',
}

/**
 * Active state utilities
 */
export const activeStates = {
  scale: 'active:scale-95',
  brightness: 'active:brightness-90',
  shadow: 'active:shadow-md',
}

/**
 * Disabled state utilities
 */
export const disabledStates = {
  opacity: 'disabled:opacity-50',
  cursor: 'disabled:cursor-not-allowed',
  all: 'disabled:opacity-50 disabled:cursor-not-allowed',
}

/**
 * Responsive motion utilities
 */
export const responsiveMotion = {
  // Reduce motion for accessibility
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
  
  // Enhanced motion for high-refresh displays
  highRefresh: '@media (prefers-reduced-motion: no-preference) and (update: fast)',
}

/**
 * Combine multiple state utilities
 */
export function combineStates(...states: string[]): string {
  return states.filter(Boolean).join(' ')
}

/**
 * Generate smooth transition classes
 */
export function smoothTransition(
  properties: string | string[] = 'all',
  duration: 'fast' | 'base' | 'slow' = 'base'
): string {
  const durationMs = timing[duration]
  const props = Array.isArray(properties) ? properties.join(' ') : properties
  return `transition-${props} duration-${durationMs}`
}

/**
 * Motion-aware component props generator
 */
export function getMotionProps(
  type: 'card' | 'button' | 'input' | 'overlay' = 'card'
) {
  const baseTransition = generateTransition('all', timing.base, easing.smooth)
  
  const configs = {
    card: {
      style: { transition: baseTransition },
      className: 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15',
    },
    button: {
      style: { transition: baseTransition },
      className: 'active:scale-95 hover:brightness-105',
    },
    input: {
      style: { transition: baseTransition },
      className: 'focus:ring-2 focus:ring-blue-500/50',
    },
    overlay: {
      style: { transition: generateTransition('opacity', timing.slow, easing.smooth) },
      className: 'backdrop-blur-xl',
    },
  }
  
  return configs[type]
}
