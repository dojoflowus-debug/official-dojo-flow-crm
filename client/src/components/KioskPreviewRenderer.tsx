import { KioskFlowProvider } from '@/lib/kioskFlowContext';
import { KioskFlowScreens } from './KioskFlowScreens';

interface KioskPreviewRendererProps {
  config?: any;
  isLiveMode?: boolean;
  className?: string;
  logoDataUrl?: string;
  contentData?: { headline: string; subheadline: string; helper?: string; footer?: string };
  kioskConfig?: any; // Full kiosk config with theme values
}

/**
 * KioskPreviewRenderer - Now renders interactive kiosk flows
 * Uses KioskFlowScreens for Check In, Start Training, Staff Login flows
 */
export const KioskPreviewRenderer: React.FC<KioskPreviewRendererProps> = ({
  config,
  isLiveMode = false,
  className = '',
  logoDataUrl,
  contentData,
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <KioskFlowProvider>
        <KioskFlowScreens 
          logoDataUrl={logoDataUrl} 
          contentData={contentData}
          kioskConfig={kioskConfig}
        />
      </KioskFlowProvider>
    </div>
  );
};
