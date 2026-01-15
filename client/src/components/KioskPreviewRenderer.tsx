import React from 'react';
import { KioskFlowProvider } from '@/lib/kioskFlowContext';
import { KioskFlowScreens } from './KioskFlowScreens';

interface KioskPreviewRendererProps {
  config?: any;
  isLiveMode?: boolean;
  className?: string;
}

/**
 * KioskPreviewRenderer - Now renders interactive kiosk flows
 * Uses KioskFlowScreens for Check In, Start Training, Staff Login flows
 */
export const KioskPreviewRenderer: React.FC<KioskPreviewRendererProps> = ({
  config,
  isLiveMode = false,
  className = '',
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <KioskFlowProvider>
        <KioskFlowScreens />
      </KioskFlowProvider>
    </div>
  );
};
