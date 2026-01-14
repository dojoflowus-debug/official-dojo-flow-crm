/**
 * Button Style Configuration
 * Defines button styling options for kiosk UI
 */

export type ButtonStyle = 'solid' | 'glass' | 'outline' | 'neon';
export type ButtonAnimation = 'none' | 'pulse' | 'breathing-glow' | 'subtle-lift';

export interface ButtonStyleConfig {
  style: ButtonStyle;
  radius: number; // 0-50px
  glowIntensity: number; // 0-100%
  animation: ButtonAnimation;
  
  // Per-button overrides
  checkInStyle?: ButtonStyle;
  checkInRadius?: number;
  checkInGlow?: number;
  checkInAnimation?: ButtonAnimation;
  
  startTrainingStyle?: ButtonStyle;
  startTrainingRadius?: number;
  startTrainingGlow?: number;
  startTrainingAnimation?: ButtonAnimation;
  
  // Global toggle
  applyToAllButtons: boolean;
}

export const DEFAULT_BUTTON_STYLE: ButtonStyleConfig = {
  style: 'solid',
  radius: 12,
  glowIntensity: 0,
  animation: 'none',
  applyToAllButtons: true,
};

// Button style presets
export const BUTTON_STYLE_PRESETS = {
  solid: {
    name: 'Solid',
    description: 'Classic solid button with no effects',
    style: 'solid' as ButtonStyle,
    radius: 12,
    glowIntensity: 0,
    animation: 'none' as ButtonAnimation,
  },
  glass: {
    name: 'Glass',
    description: 'Frosted glass effect with subtle blur',
    style: 'glass' as ButtonStyle,
    radius: 16,
    glowIntensity: 20,
    animation: 'subtle-lift' as ButtonAnimation,
  },
  outline: {
    name: 'Outline',
    description: 'Transparent with colored border',
    style: 'outline' as ButtonStyle,
    radius: 8,
    glowIntensity: 0,
    animation: 'none' as ButtonAnimation,
  },
  neon: {
    name: 'Neon',
    description: 'Vibrant neon glow effect',
    style: 'neon' as ButtonStyle,
    radius: 20,
    glowIntensity: 100,
    animation: 'breathing-glow' as ButtonAnimation,
  },
};

// CSS generation for button styles
export function generateButtonStyleCSS(config: ButtonStyleConfig, buttonClass: string): string {
  const baseRadius = `${config.radius}px`;
  const glowOpacity = config.glowIntensity / 100;
  
  let css = `
.${buttonClass} {
  border-radius: ${baseRadius};
`;

  switch (config.style) {
    case 'solid':
      css += `
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
`;
      break;
      
    case 'glass':
      css += `
  background: rgba(239, 68, 68, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;
      break;
      
    case 'outline':
      css += `
  background: transparent;
  border: 2px solid #ef4444;
  box-shadow: none;
`;
      break;
      
    case 'neon':
      css += `
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 0 20px rgba(239, 68, 68, ${glowOpacity}), 0 4px 15px rgba(239, 68, 68, 0.3);
`;
      break;
  }

  // Add animation
  switch (config.animation) {
    case 'pulse':
      css += `
  animation: buttonPulse 2s ease-in-out infinite;
`;
      break;
      
    case 'breathing-glow':
      css += `
  animation: buttonBreathingGlow 3s ease-in-out infinite;
`;
      break;
      
    case 'subtle-lift':
      css += `
  transition: transform 0.2s ease, box-shadow 0.2s ease;
`;
      break;
  }

  css += `
}

.${buttonClass}:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.${buttonClass}:active {
  transform: translateY(0);
}
`;

  return css;
}

// Animation keyframes
export const BUTTON_ANIMATIONS_CSS = `
@keyframes buttonPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

@keyframes buttonBreathingGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 4px 15px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 4px 15px rgba(239, 68, 68, 0.5);
  }
}
`;
