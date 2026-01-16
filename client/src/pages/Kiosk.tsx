import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import KioskLayout from '@/components/KioskLayout';
import KioskHome from '@/components/KioskHome';
import { trpc } from '@/lib/trpc';

/**
 * DEBUG PANEL - Shows diagnostic information when ?debug=1 is in URL
 */
function DebugPanel({ kiosk, error, locationSlug }: any) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!isOpen) return null;

  let reason = 'UNKNOWN';
  if (error) {
    const msg = error.message || '';
    if (msg.includes('NO_KIOSK_FOUND')) reason = 'NO_KIOSK_FOUND';
    else if (msg.includes('DISABLED')) reason = 'DISABLED';
    else if (msg.includes('NO_PUBLISHED_CONFIG')) reason = 'NO_PUBLISHED_CONFIG';
    else if (msg.includes('ORG_CONTEXT_MISSING')) reason = 'ORG_CONTEXT_MISSING';
    else if (msg.includes('QUERY_ERROR')) reason = 'QUERY_ERROR';
  } else if (!kiosk) {
    reason = 'NO_KIOSK_DATA';
  } else if (!kiosk.publishedConfig) {
    reason = 'NO_PUBLISHED_CONFIG';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-slate-900 border border-red-500 rounded-lg p-4 text-xs font-mono text-red-100 space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-red-400">DEBUG PANEL</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1 border-t border-red-500/30 pt-2">
          <div><span className="text-red-400">slug:</span> {locationSlug}</div>
          <div><span className="text-red-400">kioskId:</span> {kiosk?.id || 'null'}</div>
          <div><span className="text-red-400">orgId:</span> {kiosk?.organizationId || 'null'}</div>
          <div><span className="text-red-400">isActive:</span> {kiosk?.isActive ? 'true' : 'false'}</div>
          <div><span className="text-red-400">hasPublishedConfig:</span> {kiosk?.publishedConfig ? 'true' : 'false'}</div>
          <div className="border-t border-red-500/30 pt-1 mt-1">
            <div><span className="text-red-400">reason:</span> <span className="text-yellow-300">{reason}</span></div>
          </div>
          {error && (
            <div className="border-t border-red-500/30 pt-1 mt-1">
              <div><span className="text-red-400">error:</span></div>
              <div className="text-red-300 break-words">{error.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Kiosk - Main kiosk page
 * 
 * This page:
 * - Fetches kiosk by slug (public endpoint)
 * - Renders published kiosk configuration
 * - Wraps content in KioskLayout (handles background, idle detection, screensaver)
 * - Renders KioskHome (the main kiosk UI)
 * - Shows DEBUG panel if ?debug=1 is in URL
 */
export default function Kiosk() {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [searchParams] = useSearchParams();
  const [draftSettings, setDraftSettings] = useState<any>(null);
  const isStudioPreview = searchParams.get('studioPreview') === '1';
  const isDebugMode = searchParams.get('debug') === '1';

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

  // Fetch kiosk by slug to get published config
  const { data: kiosk, isLoading, error } = trpc.kioskDevice.getBySlug.useQuery(
    { slug: locationSlug! },
    { enabled: !!locationSlug }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading kiosk...</div>
        {isDebugMode && <DebugPanel kiosk={null} error={null} locationSlug={locationSlug} />}
      </div>
    );
  }

  // Missing slug state
  if (!locationSlug) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
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
        {isDebugMode && <DebugPanel kiosk={null} error={null} locationSlug={locationSlug} />}
      </div>
    );
  }

  // Error state - kiosk not found or disabled
  if (error || !kiosk) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Kiosk Not Available</h1>
          <p className="text-muted-foreground">
            {error?.message || 'This kiosk is not configured or has been disabled.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator for assistance.
          </p>
          {isDebugMode && (
            <p className="text-xs text-blue-400 mt-4">
              <a href={`${window.location.pathname}?debug=1`} className="underline">View Debug Info</a>
            </p>
          )}
        </Card>
        {isDebugMode && <DebugPanel kiosk={kiosk} error={error} locationSlug={locationSlug} />}
      </div>
    );
  }

  // Use published settings, fallback to draft if in preview mode
  const effectiveSettings = draftSettings || kiosk?.publishedConfig;
  
  if (!effectiveSettings) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Kiosk Not Configured</h1>
          <p className="text-muted-foreground">
            This kiosk has not been published yet. Please configure it in the Kiosk Manager.
          </p>
        </Card>
        {isDebugMode && <DebugPanel kiosk={kiosk} error={error} locationSlug={locationSlug} />}
      </div>
    );
  }

  const backgroundSettings = effectiveSettings.background || {};
  const idleSeconds = effectiveSettings.screensaver?.idleSeconds || 60;

  return (
    <>
      <KioskLayout 
        backgroundSettings={backgroundSettings}
        isStudioPreview={isStudioPreview}
        idleSeconds={idleSeconds}
        screensaverSettings={effectiveSettings.screensaver}
      >
        <KioskHome locationName={kiosk?.name || 'Dojo'} locationSlug={locationSlug} settings={effectiveSettings} />
      </KioskLayout>
      {isDebugMode && <DebugPanel kiosk={kiosk} error={error} locationSlug={locationSlug} />}
    </>
  );
}
