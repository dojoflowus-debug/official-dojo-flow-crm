import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
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
  id: string | number;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive' | 'on-hold' | 'Active' | 'Inactive' | 'On Hold' | 'Trial' | 'At Risk';
  photoUrl?: string;
  beltRank?: string;
  isPulsing?: boolean;
  isHighlighted?: boolean;
}

export interface LeafletMapHandle {
  invalidateSize: () => void;
  panToStudent: (studentId: string | number, paddingBottom?: number) => void;
  flyToStudent: (studentId: string | number, options?: { offsetLeft?: number; highlight?: boolean }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getMap: () => L.Map | null;
}

interface LeafletMapProps {
  markers?: StudentMarker[];
  selectedStudentId?: string | number | null;
  onMarkerClick?: (studentId: string | number) => void;
  isDarkMode?: boolean;
  darkMode?: boolean; // alias for isDarkMode
  className?: string;
  paddingBottom?: number;
}

// Dark mode tile layer (CartoDB Dark Matter)
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Light mode tile layer (CartoDB Positron)
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(({
  markers = [],
  selectedStudentId,
  onMarkerClick,
  isDarkMode: isDarkModeProp = false,
  darkMode: darkModeProp = false,
  className = '',
  paddingBottom = 0,
}, ref) => {
  // Support both isDarkMode and darkMode props
  const isDarkMode = isDarkModeProp || darkModeProp;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersDataRef = useRef<StudentMarker[]>([]);
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);

  // Keep markers data in ref for imperative access
  useEffect(() => {
    markersDataRef.current = markers;
  }, [markers]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    invalidateSize: () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    },
    panToStudent: (studentId: string | number, padding: number = 0) => {
      if (!mapRef.current) return;
      const student = markersDataRef.current.find(m => String(m.id) === String(studentId));
      if (student) {
        // Calculate the offset to keep marker visible above bottom card
        const map = mapRef.current;
        const targetLatLng = L.latLng(student.lat, student.lng);
        
        if (padding > 0) {
          // Pan with offset to account for bottom card
          const targetPoint = map.latLngToContainerPoint(targetLatLng);
          const offsetPoint = L.point(targetPoint.x, targetPoint.y - (padding / 2));
          const offsetLatLng = map.containerPointToLatLng(offsetPoint);
          
          map.setView(offsetLatLng, 14, {
            animate: true,
            duration: 0.5,
          });
        } else {
          map.setView(targetLatLng, 14, {
            animate: true,
            duration: 0.5,
          });
        }
      }
    },
    zoomIn: () => {
      if (mapRef.current) {
        mapRef.current.zoomIn();
      }
    },
    zoomOut: () => {
      if (mapRef.current) {
        mapRef.current.zoomOut();
      }
    },
    flyToStudent: (studentId: string | number, options?: { offsetLeft?: number; highlight?: boolean }) => {
      if (!mapRef.current) return;
      const student = markersDataRef.current.find(m => String(m.id) === String(studentId));
      if (!student) return;
      
      const map = mapRef.current;
      const targetLatLng = L.latLng(student.lat, student.lng);
      const offsetLeft = options?.offsetLeft || 0;
      
      // Calculate offset center to account for right panel
      // Shift the center left so the marker appears more centered in the visible area
      const containerWidth = map.getContainer().offsetWidth;
      const offsetPixels = offsetLeft > 0 ? -(containerWidth * (offsetLeft / 100) / 2) : 0;
      
      // Fly to with animation
      map.flyTo(targetLatLng, 15, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25
      });
      
      // Apply offset after flyTo completes
      if (offsetPixels !== 0) {
        setTimeout(() => {
          if (mapRef.current) {
            const currentCenter = mapRef.current.getCenter();
            const point = mapRef.current.latLngToContainerPoint(currentCenter);
            const offsetPoint = L.point(point.x + offsetPixels, point.y);
            const newCenter = mapRef.current.containerPointToLatLng(offsetPoint);
            mapRef.current.panTo(newCenter, { animate: true, duration: 0.3 });
          }
        }, 850);
      }
      
      // Add highlight effect if requested
      if (options?.highlight) {
        // Clear any existing highlight
        if (highlightLayerRef.current) {
          highlightLayerRef.current.clearLayers();
        } else {
          highlightLayerRef.current = L.layerGroup().addTo(map);
        }
        
        // Create pulsing ring effect
        const pulseRing = L.circleMarker(targetLatLng, {
          radius: 30,
          color: '#E53935',
          weight: 3,
          opacity: 0.8,
          fillColor: '#E53935',
          fillOpacity: 0.15,
          className: 'pulse-ring'
        }).addTo(highlightLayerRef.current);
        
        // Animate the pulse
        let pulseCount = 0;
        const maxPulses = 3;
        const pulseInterval = setInterval(() => {
          pulseCount++;
          if (pulseCount >= maxPulses) {
            clearInterval(pulseInterval);
            setTimeout(() => {
              if (highlightLayerRef.current) {
                highlightLayerRef.current.clearLayers();
              }
            }, 500);
          }
        }, 800);
        
        // Auto-remove highlight after 3 seconds
        setTimeout(() => {
          if (highlightLayerRef.current) {
            highlightLayerRef.current.clearLayers();
          }
        }, 3000);
      }
    },
    getMap: () => mapRef.current,
  }), []);

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
      const isSelected = String(student.id) === String(selectedStudentId);
      
      // Get status color - handle both lowercase and capitalized status values
      const normalizedStatus = student.status?.toLowerCase().replace(' ', '-');
      const statusColor = (normalizedStatus === 'active' || student.status === 'Active')
        ? '#22c55e' 
        : (normalizedStatus === 'on-hold' || student.status === 'On Hold')
          ? '#eab308' 
          : (normalizedStatus === 'trial' || student.status === 'Trial')
            ? '#eab308'
            : (normalizedStatus === 'at-risk' || student.status === 'At Risk')
              ? '#ef4444'
              : '#ef4444';

      // Create custom icon
      const iconSize = isSelected ? 44 : 36;
      
      // Build marker HTML with photo or initials fallback
      const markerContent = student.photoUrl
        ? `<img 
             src="${student.photoUrl}" 
             alt="${student.name}"
             style="
               width: 100%;
               height: 100%;
               border-radius: 50%;
               object-fit: cover;
             "
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
           />
           <div style="
             display: none;
             width: 100%;
             height: 100%;
             align-items: center;
             justify-content: center;
             font-size: ${isSelected ? '14px' : '12px'};
             font-weight: 600;
             color: ${isDarkMode ? '#ffffff' : '#1f2937'};
           ">
             ${student.initials}
           </div>`
        : `<div style="
             width: 100%;
             height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: ${isSelected ? '14px' : '12px'};
             font-weight: 600;
             color: ${isDarkMode ? '#ffffff' : '#1f2937'};
           ">
             ${student.initials}
           </div>`;
      
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
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${isSelected ? 'box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.3), 0 2px 8px rgba(0,0,0,0.3);' : ''}
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            ${markerContent}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      });

      const marker = L.marker([student.lat, student.lng], { icon })
        .addTo(markersLayerRef.current!);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(student.id);
        }
      });

      // Add to bounds
      bounds.extend([student.lat, student.lng]);
    });

    // Fit bounds if we have markers (with padding for bottom card)
    if (markers.length > 0 && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        paddingBottomRight: [50, paddingBottom + 50],
        maxZoom: 14,
      });
    }
  }, [markers, selectedStudentId, onMarkerClick, isDarkMode, paddingBottom]);

  // Pan to selected student when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedStudentId) return;

    const selectedMarker = markers.find(m => String(m.id) === String(selectedStudentId));
    if (selectedMarker) {
      const map = mapRef.current;
      const targetLatLng = L.latLng(selectedMarker.lat, selectedMarker.lng);
      
      if (paddingBottom > 0) {
        // Pan with offset to account for bottom card
        map.setView(targetLatLng, 14, {
          animate: true,
          duration: 0.5,
        });
        
        // After animation, adjust for padding
        setTimeout(() => {
          if (mapRef.current) {
            const currentCenter = mapRef.current.getCenter();
            const point = mapRef.current.latLngToContainerPoint(currentCenter);
            const offsetPoint = L.point(point.x, point.y + (paddingBottom / 3));
            const newCenter = mapRef.current.containerPointToLatLng(offsetPoint);
            mapRef.current.panTo(newCenter, { animate: true, duration: 0.3 });
          }
        }, 500);
      } else {
        map.setView(targetLatLng, 14, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [selectedStudentId, markers, paddingBottom]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
});

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
