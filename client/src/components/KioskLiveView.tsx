/**
 * KioskLiveView - Fullscreen kiosk runtime for deployment
 * Removes all studio UI, runs kiosk fullscreen, optimized for touch
 * This is what runs on actual hardware (TVs, tablets, wall-mounted displays)
 */

import React, { useEffect, useState } from 'react';
import { KioskPreviewRenderer } from './KioskPreviewRenderer';
import { KioskFlowProvider } from '@/lib/kioskFlowContext';

interface KioskLiveViewProps {
  locationId: number;
  kioskConfig?: any;
  logoDataUrl?: string;
  contentData?: { headline: string; subheadline: string; helper?: string; footer?: string };
}

/**
 * KioskLiveView - Production-ready kiosk runtime
 * - Fullscreen display
 * - Touch-optimized
 * - No UI chrome or controls
 * - Locked layout
 * - Hardware-ready
 */
export const KioskLiveView: React.FC<KioskLiveViewProps> = ({
  locationId,
  kioskConfig,
  logoDataUrl,
  contentData,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Request fullscreen on mount
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (error) {
        console.log('Fullscreen request failed (may be restricted):', error);
        // Fullscreen may be restricted in some contexts, continue anyway
        setIsFullscreen(true);
      }
    };

    // Request fullscreen after a short delay to ensure DOM is ready
    const timer = setTimeout(requestFullscreen, 500);
    return () => clearTimeout(timer);
  }, []);

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <KioskFlowProvider>
      <div
        className="w-screen h-screen overflow-hidden bg-black"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          border: 'none',
        }}
      >
        {/* Kiosk Content - Full viewport */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
          }}
        >
          <KioskPreviewRenderer
            config={kioskConfig}
            isLiveMode={true}
            logoDataUrl={logoDataUrl}
            contentData={contentData}
            kioskConfig={kioskConfig}
          />
        </div>

        {/* Debug indicator (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              position: 'fixed',
              bottom: 10,
              right: 10,
              fontSize: '10px',
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 9999,
            }}
          >
            Live View {isFullscreen ? '(fullscreen)' : '(windowed)'}
          </div>
        )}
      </div>
    </KioskFlowProvider>
  );
};
