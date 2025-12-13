import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MapOverlayProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * MapOverlay - A React Portal component that renders content above the Leaflet map
 * Uses fixed positioning with high z-index to ensure visibility above all map layers
 * Positioned to avoid overlap with bottom navigation bar
 */
export const MapOverlay: React.FC<MapOverlayProps> = ({ children, isVisible }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div
      id="map-overlay-root"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 72, // Account for bottom navigation bar height
        top: 'auto',
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '0 16px 16px 16px',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default MapOverlay;
