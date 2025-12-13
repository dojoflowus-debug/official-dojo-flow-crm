import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MapOverlayProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * MapOverlay - A React Portal component that renders content above the Leaflet map
 * Uses fixed positioning with high z-index to ensure visibility above all map layers
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
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default MapOverlay;
