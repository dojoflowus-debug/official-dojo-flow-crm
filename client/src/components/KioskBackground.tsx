import React from 'react';
import type { KioskSettings } from '../../../drizzle/schema';

interface KioskBackgroundProps {
  settings: KioskSettings;
  children: React.ReactNode;
  className?: string;
}

export function KioskBackground({ settings, children, className = '' }: KioskBackgroundProps) {
  const backgroundStyle: React.CSSProperties = {};
  const overlayStyle: React.CSSProperties = {};

  if (settings.background?.imageUrl && settings.background.type === 'image') {
    backgroundStyle.backgroundImage = `url(${settings.background.imageUrl})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
    backgroundStyle.backgroundAttachment = 'fixed';
  }

  if (settings.background?.blur && settings.background.blur > 0) {
    backgroundStyle.filter = `blur(${settings.background.blur}px)`;
  }

  if (settings.background?.dim && settings.background.dim > 0) {
    overlayStyle.backgroundColor = `rgba(0, 0, 0, ${settings.background.dim / 100})`;
  }

  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      <div className="absolute inset-0 -z-20" style={backgroundStyle} />
      {settings.background?.dim && settings.background.dim > 0 && (
        <div className="absolute inset-0 -z-10" style={overlayStyle} />
      )}
      <div className="relative z-0">{children}</div>
    </div>
  );
}

export function getPresetBackgroundUrl(presetKey: string): string {
  const presets: Record<string, string> = {
    'dojo-warm-lights': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    'clean-modern-gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    'kids-class-bright': 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=1920&q=80',
  };
  return presets[presetKey] || presets['dojo-warm-lights'];
}

export function applyKioskTheme(settings: KioskSettings) {
  const root = document.documentElement;
  if (settings.theme?.mode) {
    if (settings.theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  if (settings.theme?.primaryColor) {
    root.style.setProperty('--primary', settings.theme.primaryColor);
  }
  if (settings.theme?.accentColor) {
    root.style.setProperty('--accent', settings.theme.accentColor);
  }
}
