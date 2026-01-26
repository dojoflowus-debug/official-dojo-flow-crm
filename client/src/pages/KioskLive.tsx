/**
 * KioskLive - Live deployment page for kiosk
 * Fullscreen kiosk runtime that can be deployed to hardware
 * URL: /kiosk/live/:locationId
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { KioskLiveView } from '@/components/KioskLiveView';
import { trpc } from '@/lib/trpc';

/**
 * KioskLive Page - Production kiosk runtime
 * - Fetches kiosk configuration for the location
 * - Renders fullscreen kiosk display
 * - Optimized for touch and hardware deployment
 */
export function KioskLive() {
  const { locationId } = useParams<{ locationId: string }>();
  const [kioskConfig, setKioskConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch kiosk configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!locationId) {
          setError('Location ID is required');
          setLoading(false);
          return;
        }

        // Fetch the kiosk settings for this location
        const response = await fetch(`/api/kiosk/settings/${locationId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch kiosk settings: ${response.statusText}`);
        }

        const data = await response.json();
        setKioskConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching kiosk config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load kiosk configuration');
        // Still render with default config
        setKioskConfig({});
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [locationId]);

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '18px',
        }}
      >
        Loading kiosk...
      </div>
    );
  }

  if (error && !kioskConfig) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#f00',
          fontSize: '18px',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>Error loading kiosk: {error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f00',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <KioskLiveView
      locationId={parseInt(locationId || '0')}
      kioskConfig={kioskConfig}
    />
  );
}
