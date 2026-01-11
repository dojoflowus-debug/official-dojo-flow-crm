import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import KioskLayout from '@/components/KioskLayout';
import KioskHome from '@/components/KioskHome';
import { trpc } from '@/lib/trpc';

/**
 * Kiosk - Main kiosk page
 * 
 * This page:
 * - Fetches kiosk configuration for the location
 * - Wraps content in KioskLayout (handles background, idle detection, screensaver)
 * - Renders KioskHome (the main kiosk UI)
 */
export default function Kiosk() {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [draftSettings, setDraftSettings] = useState<any>(null);
  const isStudioPreview = new URLSearchParams(window.location.search).get('studioPreview') === '1';

  // Listen for PostMessage from studio preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'KIOSK_SETTINGS_UPDATE') {
        setDraftSettings(event.data.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch kiosk runtime configuration
  const { data: kioskConfig, isLoading, error } = trpc.kiosk.getKioskRuntime.useQuery(
    { slug: locationSlug! },
    { enabled: !!locationSlug }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading kiosk...</div>
      </div>
    );
  }

  // Missing slug state
  if (!locationSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Invalid Kiosk URL</h1>
          <p className="text-muted-foreground">
            The kiosk location could not be found. Please check the URL and try again.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator for assistance.
          </p>
        </Card>
      </div>
    );
  }

  // Error state - kiosk not found or disabled
  if (error || !kioskConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Kiosk Not Available</h1>
          <p className="text-muted-foreground">
            {error?.message || 'This kiosk is not configured or has been disabled.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator for assistance.
          </p>
        </Card>
      </div>
    );
  }

  const { locationName, settings } = kioskConfig;
  
  // Use draft settings from studio preview if available, otherwise use published settings
  const effectiveSettings = draftSettings || settings;
  const backgroundImage = effectiveSettings?.appearance?.backgroundImageUrl || effectiveSettings?.background?.imageUrl;
  const backgroundPreset = effectiveSettings?.appearance?.presetKey || effectiveSettings?.background?.presetKey || 'default';

  const idleSeconds = effectiveSettings?.behavior?.idleSeconds || effectiveSettings?.behavior?.idleTimeout || 60;

  return (
    <KioskLayout 
      backgroundImage={backgroundImage} 
      backgroundPreset={backgroundPreset} 
      isStudioPreview={isStudioPreview}
      idleSeconds={idleSeconds}
    >
      <KioskHome locationName={locationName} locationSlug={locationSlug} />
    </KioskLayout>
  );
}
