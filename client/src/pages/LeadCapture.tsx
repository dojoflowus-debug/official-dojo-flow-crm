/**
 * LeadCapture - Public page for website embedding
 * Displays Kai's lead capture chat interface
 * URL: /lead-capture?org={organizationId}&location={locationId}
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KaiChatStateful } from '@/components/KaiChatStateful';

export const LeadCapture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const organizationId = parseInt(searchParams.get('org') || '0');
  const locationId = searchParams.get('location') ? parseInt(searchParams.get('location')) : undefined;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading organization data
    setIsLoading(false);
  }, [organizationId]);

  if (isLoading) {
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

  if (!organizationId || organizationId === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">Organization ID is required</p>
          <p className="text-gray-400 text-sm">Use: /lead-capture?org={organizationId}</p>
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
          locationId={locationId}
          locationName="MyDojo"
          embedded={true}
        />
      </div>
    </div>
  );
};
