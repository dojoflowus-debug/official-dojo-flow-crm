import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface StudentMarker {
  id: string;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive' | 'on-hold';
  photoUrl?: string;
  beltRank?: string;
}

interface LeafletMapProps {
  markers?: StudentMarker[];
  selectedStudentId?: string | null;
  onMarkerClick?: (studentId: string) => void;
  isDarkMode?: boolean;
  className?: string;
}

// Dark mode tile layer (CartoDB Dark Matter)
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Light mode tile layer (CartoDB Positron)
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  markers = [],
  selectedStudentId,
  onMarkerClick,
  isDarkMode = false,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (Houston, TX area - Tomball)
    const defaultCenter: L.LatLngExpression = [30.0974, -95.6163];
    const defaultZoom = 10;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
    });

    // Add tile layer
    const tileUrl = isDarkMode ? DARK_TILE_URL : LIGHT_TILE_URL;
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update tile layer when dark mode changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const newTileUrl = isDarkMode ? DARK_TILE_URL : LIGHT_TILE_URL;
    tileLayerRef.current.setUrl(newTileUrl);
  }, [isDarkMode]);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    if (markers.length === 0) return;

    // Add new markers
    const bounds = L.latLngBounds([]);

    markers.forEach((student) => {
      const isSelected = student.id === selectedStudentId;
      
      // Get status color
      const statusColor = student.status === 'active' 
        ? '#22c55e' 
        : student.status === 'on-hold' 
          ? '#eab308' 
          : '#ef4444';

      // Create custom icon
      const iconSize = isSelected ? 40 : 32;
      const icon = L.divIcon({
        className: 'custom-student-marker',
        html: `
          <div style="
            width: ${iconSize}px;
            height: ${iconSize}px;
            border-radius: 50%;
            background: ${isDarkMode ? '#1f2937' : '#ffffff'};
            border: 3px solid ${isSelected ? '#E53935' : statusColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '14px' : '12px'};
            font-weight: 600;
            color: ${isDarkMode ? '#ffffff' : '#1f2937'};
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${isSelected ? 'box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.3), 0 2px 8px rgba(0,0,0,0.3);' : ''}
            transition: all 0.2s ease;
          ">
            ${student.initials}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      });

      const marker = L.marker([student.lat, student.lng], { icon })
        .addTo(markersLayerRef.current!);

      // Add popup
      marker.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong>${student.name}</strong>
          ${student.beltRank ? `<br><span style="font-size: 12px; color: #666;">${student.beltRank}</span>` : ''}
        </div>
      `);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(student.id);
        }
      });

      // Add to bounds
      bounds.extend([student.lat, student.lng]);
    });

    // Fit bounds if we have markers
    if (markers.length > 0 && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [markers, selectedStudentId, onMarkerClick, isDarkMode]);

  // Pan to selected student
  useEffect(() => {
    if (!mapRef.current || !selectedStudentId) return;

    const selectedMarker = markers.find(m => m.id === selectedStudentId);
    if (selectedMarker) {
      mapRef.current.setView([selectedMarker.lat, selectedMarker.lng], 14, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedStudentId, markers]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
};

export default LeafletMap;
