/**
 * IndustryEnvironmentInitializer
 *
 * Silently fetches the dojo's configured industry from settings and calls
 * `initializeForIndustry` on the EnvironmentContext so that first-time users
 * see the environment that best matches their business type.
 *
 * This component renders nothing — it is a pure side-effect component.
 * It is safe to mount multiple times; the initialization is guarded by
 * localStorage so it only runs once per device.
 */
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export function IndustryEnvironmentInitializer() {
  const { initializeForIndustry } = useEnvironment();

  const { data: settings } = trpc.kai.settings.getSettings.useQuery(
    {},
    {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    if (settings) {
      // `industry` may be a value like "martial_arts", "mma", "dance", etc.
      // or a human-readable label like "Martial Arts School"
      const industry = (settings as any).industry ?? null;
      initializeForIndustry(industry);
    }
  }, [settings]);

  return null;
}
