/**
 * Dojo Theme Configuration
 * Extends Tailwind CSS with dojo-specific colors, animations, and utilities
 */

export const dojoThemeConfig = {
  extend: {
    colors: {
      // Dojo atmosphere colors
      dojo: {
        50: '#f9f7f4',
        100: '#f3ede8',
        200: '#e7dbd1',
        300: '#dbc9ba',
        400: '#cfb7a3',
        500: '#c3a58c',
        600: '#b79375',
        700: '#8b6f5e',
        800: '#5f4b47',
        900: '#332730',
      },
      // Belt colors - enhanced
      belt: {
        white: '#e8e8e8',
        yellow: '#fbbf24',
        orange: '#f97316',
        green: '#22c55e',
        blue: '#3b82f6',
        brown: '#92400e',
        black: '#1f2937',
        red: '#ef4444',
      },
    },
    animation: {
      breathing: 'breathing 6s ease-in-out infinite',
      'soft-glow': 'soft-glow 3s ease-in-out infinite',
      'gentle-float': 'gentle-float 3s ease-in-out infinite',
      'card-lift': 'card-lift 0.3s ease-out forwards',
      'pulse-glow': 'pulse-glow 2s infinite',
      shimmer: 'shimmer 2s infinite',
      'fade-in-up': 'fade-in-up 0.5s ease-out',
      'fade-in-down': 'fade-in-down 0.5s ease-out',
    },
    keyframes: {
      breathing: {
        '0%, 100%': { opacity: '0' },
        '50%': { opacity: '0.02' },
      },
      'soft-glow': {
        '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' },
        '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)' },
      },
      'gentle-float': {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-2px)' },
      },
      'card-lift': {
        '0%': {
          transform: 'translateY(0)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        '100%': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
        },
      },
      'pulse-glow': {
        '0%, 100%': {
          opacity: '1',
          boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
        },
        '50%': {
          opacity: '0.8',
          boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)',
        },
      },
      shimmer: {
        '0%': { backgroundPosition: '-1000px 0' },
        '100%': { backgroundPosition: '1000px 0' },
      },
      'fade-in-up': {
        from: {
          opacity: '0',
          transform: 'translateY(10px)',
        },
        to: {
          opacity: '1',
          transform: 'translateY(0)',
        },
      },
      'fade-in-down': {
        from: {
          opacity: '0',
          transform: 'translateY(-10px)',
        },
        to: {
          opacity: '1',
          transform: 'translateY(0)',
        },
      },
    },
    backdropBlur: {
      xs: '2px',
      sm: '4px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
    },
    boxShadow: {
      'premium': '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1) inset',
      'premium-lg': '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset',
      'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
      'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
      'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
    },
  },
}

/**
 * Dojo Utility Classes
 * Can be added to globals.css or used directly in components
 */
export const dojoUtilities = `
  /* Glass morphism */
  .glass-panel {
    @apply bg-white/[0.05] backdrop-blur-lg border border-white/10;
  }

  .glass-panel-lg {
    @apply bg-white/[0.08] backdrop-blur-2xl border border-white/15;
  }

  /* Smooth transitions */
  .transition-premium {
    @apply transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1);
  }

  .transition-smooth {
    @apply transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Vignette effect */
  .vignette {
    @apply relative after:absolute after:inset-0 after:bg-gradient-to-edges after:pointer-events-none;
  }

  /* Premium text */
  .text-premium {
    @apply font-semibold tracking-tight;
  }

  /* Dojo gradient backgrounds */
  .bg-dojo-gradient {
    @apply bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950;
  }

  .bg-dojo-light {
    @apply bg-gradient-to-br from-slate-900 to-slate-800;
  }

  /* Belt color utilities */
  .belt-white { @apply ring-slate-300 bg-slate-100 text-slate-900; }
  .belt-yellow { @apply ring-yellow-400 bg-yellow-100 text-yellow-900; }
  .belt-orange { @apply ring-orange-400 bg-orange-100 text-orange-900; }
  .belt-green { @apply ring-green-400 bg-green-100 text-green-900; }
  .belt-blue { @apply ring-blue-400 bg-blue-100 text-blue-900; }
  .belt-brown { @apply ring-amber-700 bg-amber-100 text-amber-900; }
  .belt-black { @apply ring-slate-900 bg-slate-900 text-white; }
  .belt-red { @apply ring-red-500 bg-red-100 text-red-900; }
`
