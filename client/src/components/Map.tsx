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

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { MapPin, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: typeof google;
    gm_authFailure?: () => void;
  }
}

// Get API key from environment
const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Log API key status on module load (for diagnostics)
if (!API_KEY) {
  console.error('[GoogleMaps] CRITICAL: VITE_FRONTEND_FORGE_API_KEY is not configured');
} else {
  console.log('[GoogleMaps] API key configured:', API_KEY.substring(0, 8) + '...');
}

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

// Track script loading state globally
let scriptLoaded = false;
let scriptLoading: Promise<boolean> | null = null;
let authError = false;
let lastError: string | null = null;

// Global auth failure handler - Google Maps calls this on auth errors
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    authError = true;
    lastError = 'Google Maps authentication failed (API key/billing/referrer issue)';
    console.error('[GoogleMaps] Auth failure:', lastError);
    // Dispatch custom event so components can react
    window.dispatchEvent(new CustomEvent('googlemaps-auth-error', { detail: lastError }));
  };
  
  // Add CSS to hide Google's error dialog more aggressively
  const style = document.createElement('style');
  style.textContent = `
    /* Hide Google Maps error dialogs */
    .dismissButton, 
    .gm-err-container,
    .gm-style-iw-a,
    .gm-err-title,
    .gm-err-message,
    .gm-err-autocomplete,
    div[style*="z-index: 1000001"],
    div[role="dialog"][aria-modal="true"],
    div.modal-dialog,
    div[class*="dismissButton"],
    /* Target the specific Google error dialog */
    div[style*="position: fixed"][style*="z-index"] > div[style*="background-color: white"],
    div[style*="position: fixed"][style*="z-index"] > div[style*="background: white"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

function loadMapScript(): Promise<boolean> {
  // Check if API key is missing
  if (!API_KEY) {
    console.error('[GoogleMaps] Cannot load script: API key is missing');
    lastError = 'Google Maps API key is not configured';
    return Promise.resolve(false);
  }

  // If auth error occurred, don't retry automatically
  if (authError) {
    console.warn('[GoogleMaps] Skipping load due to previous auth error');
    return Promise.resolve(false);
  }

  // Already loaded successfully
  if (scriptLoaded && window.google?.maps) {
    return Promise.resolve(true);
  }
  
  // Loading in progress
  if (scriptLoading) {
    return scriptLoading;
  }
  
  console.log('[GoogleMaps] Starting script load...');
  
  scriptLoading = new Promise((resolve) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps/api/js"]');
    if (existingScript) {
      console.log('[GoogleMaps] Found existing script tag');
      if (window.google?.maps) {
        scriptLoaded = true;
        console.log('[GoogleMaps] Google Maps already available');
        resolve(true);
        return;
      }
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          scriptLoaded = true;
          console.log('[GoogleMaps] Existing script loaded successfully');
          resolve(true);
        } else {
          console.error('[GoogleMaps] Script loaded but google.maps not available');
          lastError = 'Google Maps script loaded but API not available';
          resolve(false);
        }
      });
      existingScript.addEventListener('error', () => {
        console.error('[GoogleMaps] Existing script failed to load');
        lastError = 'Failed to load Google Maps script';
        resolve(false);
      });
      return;
    }
    
    // The Manus Maps proxy requires the API key as a query parameter
    // The proxy handles authentication internally
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    
    script.onload = () => {
      // Small delay to ensure google.maps is fully initialized
      setTimeout(() => {
        if (window.google?.maps) {
          scriptLoaded = true;
          console.log('[GoogleMaps] Script loaded successfully');
          resolve(true);
        } else {
          console.error('[GoogleMaps] Script loaded but google.maps not available');
          lastError = 'Google Maps script loaded but API not available';
          resolve(false);
        }
      }, 100);
    };
    
    script.onerror = (event) => {
      console.error('[GoogleMaps] Script load error:', event);
      lastError = 'Failed to load Google Maps script (network error)';
      scriptLoading = null;
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
  
  return scriptLoading;
}

// Reset function to allow retry
function resetMapScript() {
  console.log('[GoogleMaps] Resetting script state for retry');
  scriptLoaded = false;
  scriptLoading = null;
  authError = false;
  lastError = null;
  
  // Remove existing script tags
  const scripts = document.querySelectorAll('script[src*="maps/api/js"]');
  scripts.forEach(script => script.remove());
  
  // Clear google object
  if (window.google) {
    delete (window as any).google;
  }
}

// Map load status type
type MapLoadStatus = 'loading' | 'success' | 'error';

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  darkMode?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
  onError?: (error: string) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  darkMode = false,
  onMapReady,
  onError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const currentDarkMode = useRef<boolean>(darkMode);
  const initialized = useRef<boolean>(false);
  
  const [status, setStatus] = useState<MapLoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen for auth errors
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      setStatus('error');
      setErrorMessage(event.detail || 'Google Maps authentication failed');
      onError?.(event.detail);
    };
    
    window.addEventListener('googlemaps-auth-error', handleAuthError as EventListener);
    return () => {
      window.removeEventListener('googlemaps-auth-error', handleAuthError as EventListener);
    };
  }, [onError]);

  const init = usePersistFn(async () => {
    if (initialized.current) return;
    
    // Check for API key first
    if (!API_KEY) {
      console.error('[GoogleMaps] Cannot initialize: API key missing');
      setStatus('error');
      setErrorMessage('Google Maps API key is not configured');
      onError?.('Google Maps API key is not configured');
      return;
    }
    
    setStatus('loading');
    
    const loaded = await loadMapScript();
    
    if (!loaded || !window.google?.maps) {
      console.error('[GoogleMaps] Failed to load Google Maps');
      setStatus('error');
      setErrorMessage(lastError || 'Failed to load Google Maps');
      onError?.(lastError || 'Failed to load Google Maps');
      return;
    }
    
    if (!mapContainer.current) {
      console.warn('[GoogleMaps] Map container not available yet, will retry');
      // Don't set error - the container might just not be mounted yet
      // The useEffect will retry
      return;
    }
    
    initialized.current = true;
    
    try {
      // IMPORTANT: When using custom styles, do NOT use mapId
      // mapId is for cloud-based styling which conflicts with inline styles
      // Apply styles ONLY after successful map creation
      const mapOptions: google.maps.MapOptions = {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        // Start without styles - apply after map is created
      };
      
      console.log('[GoogleMaps] Creating map instance...');
      map.current = new window.google.maps.Map(mapContainer.current, mapOptions);
      
      // Set up MutationObserver to detect and hide Google's error dialogs
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Check for Google's error dialog - multiple detection methods
              const isErrorDialog = 
                node.classList.contains('dismissButton') || 
                node.classList.contains('gm-err-container') ||
                node.classList.contains('gm-err-title') ||
                node.classList.contains('gm-err-message') ||
                node.getAttribute('role') === 'dialog' ||
                node.textContent?.includes("can't load Google Maps correctly") ||
                node.textContent?.includes("This page can't load Google Maps") ||
                node.textContent?.includes("Do you own this website");
              
              if (isErrorDialog) {
                console.error('[GoogleMaps] Detected Google error dialog, hiding it');
                node.style.display = 'none';
                node.style.visibility = 'hidden';
                node.style.opacity = '0';
                node.style.pointerEvents = 'none';
                // Also hide parent if it's a modal backdrop
                if (node.parentElement && node.parentElement.style.position === 'fixed') {
                  node.parentElement.style.display = 'none';
                }
                // Trigger our error state
                if (!authError) {
                  authError = true;
                  lastError = 'Google Maps failed to load (API key/billing/referrer issue)';
                  setStatus('error');
                  setErrorMessage(lastError);
                  onError?.(lastError);
                }
              }
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Also check for existing error dialogs immediately
      const existingDialogs = document.querySelectorAll('[role="dialog"], .gm-err-container, .dismissButton');
      existingDialogs.forEach((dialog) => {
        if (dialog instanceof HTMLElement) {
          dialog.style.display = 'none';
        }
      });
      
      // Apply dark mode styles AFTER map is successfully created
      if (darkMode) {
        console.log('[GoogleMaps] Applying dark mode styles...');
        map.current.setOptions({ styles: DARK_MAP_STYLES });
      }
      
      currentDarkMode.current = darkMode;
      setStatus('success');
      
      console.log('[GoogleMaps] Map initialized successfully, darkMode:', darkMode);
      
      if (onMapReady) {
        onMapReady(map.current);
      }
      
      // Clean up observer after a delay (error dialogs appear quickly if there's an issue)
      setTimeout(() => {
        observer.disconnect();
      }, 5000);
    } catch (error) {
      console.error('[GoogleMaps] Error creating map:', error);
      setStatus('error');
      setErrorMessage('Error creating map instance');
      onError?.('Error creating map instance');
    }
  });

  // Initialize map when component mounts
  useEffect(() => {
    // Small delay to ensure container ref is set after render
    const timer = setTimeout(() => {
      init();
    }, 100);
    return () => clearTimeout(timer);
  }, [init]);

  // Update map styles when darkMode prop changes
  useEffect(() => {
    if (map.current && currentDarkMode.current !== darkMode && status === 'success') {
      console.log('[GoogleMaps] Updating styles, darkMode:', darkMode);
      try {
        map.current.setOptions({
          styles: darkMode ? DARK_MAP_STYLES : [],
        });
        currentDarkMode.current = darkMode;
      } catch (error) {
        console.error('[GoogleMaps] Error updating styles:', error);
      }
    }
  }, [darkMode, status]);

  // Retry handler
  const handleRetry = () => {
    console.log('[GoogleMaps] User requested retry');
    resetMapScript();
    initialized.current = false;
    setStatus('loading');
    setErrorMessage(null);
    // Small delay before retrying
    setTimeout(() => {
      init();
    }, 500);
  };

  // Always render the container div so the ref is available
  // Show overlay for loading/error states
  return (
    <div className={cn("w-full h-[500px] relative", className)}>
      {/* Map container - always rendered for ref */}
      <div 
        ref={mapContainer} 
        className={cn(
          "w-full h-full absolute inset-0",
          status !== 'success' && "invisible"
        )} 
      />
      
      {/* Error state overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Map unavailable</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage || 'Google Maps failed to load (API key/billing/referrer).'}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      {/* Loading state overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center animate-pulse">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the dark map styles for use in other components
export { DARK_MAP_STYLES };
