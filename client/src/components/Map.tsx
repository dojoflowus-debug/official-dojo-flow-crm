/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   darkMode={true} // Enable dark charcoal map style
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - "map-attached" → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - "standalone" → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - "data-only" → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Premium deep charcoal / near-black night style for dark mode
// Apple-style dashboard aesthetic: calm, minimal, high contrast
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // Overall map background - deep charcoal
  {
    elementType: "geometry",
    stylers: [{ color: "#0f1115" }]
  },
  // Labels - soft light gray, never pure white
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f1115" }]
  },
  // Administrative areas
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1a1d23" }]
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }]
  },
  // Points of interest
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#15181d" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#151a1f" }]
  },
  // Roads - muted graphite gray, low contrast
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f2933" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f1115" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2a2f38" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1d23" }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#252a32" }]
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#1a1d23" }]
  },
  // Transit
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1d23" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }]
  },
  // Water - dark navy / teal-black
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0b1c26" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }]
  },
  // Landscape
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#12151a" }]
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#15181d" }]
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#12151a" }]
  }
];

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  if (scriptLoaded && window.google?.maps) {
    return Promise.resolve();
  }
  
  if (scriptLoading) {
    return scriptLoading;
  }
  
  scriptLoading = new Promise((resolve) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps) {
        scriptLoaded = true;
        resolve();
        return;
      }
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        scriptLoaded = true;
        resolve();
      });
      return;
    }
    
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      scriptLoading = null;
      resolve();
    };
    document.head.appendChild(script);
  });
  
  return scriptLoading;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  darkMode?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  darkMode = false,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const currentDarkMode = useRef<boolean>(darkMode);
  const initialized = useRef<boolean>(false);

  const init = usePersistFn(async () => {
    if (initialized.current) return;
    
    await loadMapScript();
    if (!mapContainer.current || !window.google?.maps) {
      console.error("Map container or Google Maps not available");
      return;
    }
    
    initialized.current = true;
    
    // IMPORTANT: When using custom styles, do NOT use mapId
    // mapId is for cloud-based styling which conflicts with inline styles
    const mapOptions: google.maps.MapOptions = {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      // Apply dark styles on initialization if darkMode is true
      styles: darkMode ? DARK_MAP_STYLES : undefined,
    };
    
    map.current = new window.google.maps.Map(mapContainer.current, mapOptions);
    currentDarkMode.current = darkMode;
    
    console.log('[Map] Initialized with darkMode:', darkMode);
    
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  // Update map styles when darkMode prop changes
  useEffect(() => {
    if (map.current && currentDarkMode.current !== darkMode) {
      console.log('[Map] Updating styles, darkMode:', darkMode);
      map.current.setOptions({
        styles: darkMode ? DARK_MAP_STYLES : [],
      });
      currentDarkMode.current = darkMode;
    }
  }, [darkMode]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}

// Export the dark map styles for use in other components
export { DARK_MAP_STYLES };
