import { useEffect } from 'react';

/**
 * Hook for simulating touch behavior in device emulator
 * Disables hover states and forces pointer: coarse behavior
 */
export function useTouchSimulation(enabled: boolean, targetSelector: string = '#device-preview') {
  useEffect(() => {
    if (!enabled) return;

    const target = document.querySelector(targetSelector) as HTMLElement;
    if (!target) return;

    // Inject touch simulation styles
    const styleId = 'touch-simulation-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Apply touch simulation CSS
    styleElement.textContent = `
      ${targetSelector} {
        --pointer-coarse: true;
        -webkit-user-select: none;
        user-select: none;
      }

      ${targetSelector} * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      /* Disable hover states on touch devices */
      ${targetSelector} button:hover,
      ${targetSelector} a:hover,
      ${targetSelector} [role="button"]:hover {
        background-color: inherit;
        opacity: inherit;
      }

      /* Ensure active states work */
      ${targetSelector} button:active,
      ${targetSelector} a:active,
      ${targetSelector} [role="button"]:active {
        opacity: 0.8;
      }

      /* Disable text selection on long press */
      ${targetSelector} {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        user-select: none;
      }

      /* Ensure buttons remain clickable */
      ${targetSelector} button,
      ${targetSelector} a,
      ${targetSelector} [role="button"] {
        pointer-events: auto;
        cursor: pointer;
      }

      /* Safe area padding for iOS */
      ${targetSelector} {
        padding-top: max(0px, env(safe-area-inset-top));
        padding-bottom: max(0px, env(safe-area-inset-bottom));
        padding-left: max(0px, env(safe-area-inset-left));
        padding-right: max(0px, env(safe-area-inset-right));
      }
    `;

    return () => {
      // Clean up is handled by React, but we can optionally remove the style
      // styleElement.remove();
    };
  }, [enabled, targetSelector]);
}

/**
 * Hook for testing responsive font scaling
 * Ensures text wrapping and scaling is visible during preview
 */
export function useResponsiveFontTesting(enabled: boolean, targetSelector: string = '#device-preview') {
  useEffect(() => {
    if (!enabled) return;

    const target = document.querySelector(targetSelector) as HTMLElement;
    if (!target) return;

    // Add data attribute for testing
    target.setAttribute('data-responsive-test', 'true');

    // Inject responsive testing styles
    const styleId = 'responsive-font-test-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Apply responsive testing CSS
    styleElement.textContent = `
      ${targetSelector}[data-responsive-test="true"] {
        --responsive-test: true;
      }

      /* Highlight text wrapping issues */
      ${targetSelector}[data-responsive-test="true"] p,
      ${targetSelector}[data-responsive-test="true"] h1,
      ${targetSelector}[data-responsive-test="true"] h2,
      ${targetSelector}[data-responsive-test="true"] h3,
      ${targetSelector}[data-responsive-test="true"] span {
        word-break: break-word;
        overflow-wrap: break-word;
      }

      /* Ensure buttons are clickable */
      ${targetSelector}[data-responsive-test="true"] button {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 16px;
      }

      /* Ensure touch targets are adequate */
      ${targetSelector}[data-responsive-test="true"] a,
      ${targetSelector}[data-responsive-test="true"] [role="button"] {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    `;

    return () => {
      target.removeAttribute('data-responsive-test');
    };
  }, [enabled, targetSelector]);
}

/**
 * Hook for testing scrolling behavior in constrained viewports
 */
export function useScrollTesting(enabled: boolean, targetSelector: string = '#device-preview') {
  useEffect(() => {
    if (!enabled) return;

    const target = document.querySelector(targetSelector) as HTMLElement;
    if (!target) return;

    // Inject scroll testing styles
    const styleId = 'scroll-test-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Apply scroll testing CSS
    styleElement.textContent = `
      ${targetSelector} {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      /* Show scrollbar for testing */
      ${targetSelector}::-webkit-scrollbar {
        width: 8px;
      }

      ${targetSelector}::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }

      ${targetSelector}::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }

      ${targetSelector}::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;

    return () => {
      // Cleanup handled by React
    };
  }, [enabled, targetSelector]);
}
