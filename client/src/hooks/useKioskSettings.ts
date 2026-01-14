import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { applyKioskTheme } from '@/components/KioskBackground';
import type { KioskSettings } from '../../../drizzle/schema';

export function useKioskSettings(locationSlug: string) {
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data, isLoading: queryLoading, error } = trpc.kioskSettings.getSettings.useQuery(
    { locationSlug },
    { retry: 3, retryDelay: 1000 }
  );

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
      applyKioskTheme(data.settings);
    }
    setIsLoading(queryLoading);
  }, [data, queryLoading]);

  return { settings, isLoading, error };
}

export function getBackgroundStyle(settings: KioskSettings | null | undefined) {
  if (!settings?.background) return {};
  const style: React.CSSProperties = {};
  if (settings.background.imageUrl && settings.background.type === 'image') {
    style.backgroundImage = `url(${settings.background.imageUrl})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.backgroundAttachment = 'fixed';
  }
  if (settings.background.blur && settings.background.blur > 0) {
    style.filter = `blur(${settings.background.blur}px)`;
  }
  return style;
}

export function getOverlayStyle(settings: KioskSettings | null | undefined) {
  if (!settings?.background?.dim || settings.background.dim === 0) return {};
  return { backgroundColor: `rgba(0, 0, 0, ${settings.background.dim / 100})` } as React.CSSProperties;
}
