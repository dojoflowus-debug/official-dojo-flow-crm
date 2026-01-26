/**
 * LeadCaptureLocation - Location-specific lead capture page
 * Detects location from URL slug and initializes location-aware Kai chat
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { KaiChatStateful } from '@/components/KaiChatStateful';

interface LocationConfig {
  id: number;
  slug: string;
  name: string;
  address?: string;
  phone?: string;
}

export default function LeadCaptureLocation() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [location, setLocation] = useState<LocationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const organizationId = parseInt(searchParams.get('org') || '120001');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        if (!slug) {
          setError('Location slug is required');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/locations/config/${slug}?org=${organizationId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch location: ${response.statusText}`);
        }

        const data = await response.json();
        setLocation(data);
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Could not load location. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [slug, organizationId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            K
          </div>
          <p className="text-white">Loading Kai...</p>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Location not found'}</p>
          <p className="text-gray-400 text-sm">Please check the URL and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <KaiChatStateful
          organizationId={organizationId}
          locationSlug={location.slug}
          locationName={location.name}
          locationId={location.id}
          embedded={true}
        />
      </div>
    </div>
  );
}
