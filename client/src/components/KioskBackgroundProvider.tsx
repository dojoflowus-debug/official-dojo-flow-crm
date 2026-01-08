import React, { useEffect, useRef } from "react";
import { useKioskBackground } from "@/hooks/useKioskBackground";

// Fallback background color to prevent black screen
const FALLBACK_BG_COLOR = '#1a1a1a';

interface KioskBackgroundProviderProps {
  locationId: number;
  children: React.ReactNode;
}

/**
 * Provider component that applies kiosk background to the entire page
 * Wraps kiosk routes and applies background settings
 * 
 * Layer structure:
 * 1. Fallback background color (prevents black screen)
 * 2. Background image (fixed position)
 * 3. Dim overlay (rgba on top of image)
 * 4. Content (children with z-index >= 0)
 */
export function KioskBackgroundProvider({
  locationId,
  children,
}: KioskBackgroundProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const bgDimRef = useRef<HTMLDivElement>(null);
  const { background, imageLoaded, imageError } = useKioskBackground(locationId);
  
  useEffect(() => {
    console.log('[TRUTH_TRACE] KioskBackgroundProvider - background received:', JSON.stringify(background));
  }, [background]);

  // Set up background image layer
  useEffect(() => {
    console.log('[DEBUG] KioskBackgroundProvider - useEffect triggered', { 
      hasContainer: !!containerRef.current, 
      hasImageUrl: !!background?.imageUrl,
      imageUrl: background?.imageUrl,
      imageLoaded,
      imageError,
      blur: background?.blur,
      dim: background?.dim
    });
    
    if (!containerRef.current || !background?.imageUrl) {
      console.log('[DEBUG] KioskBackgroundProvider - Early return: no container or imageUrl');
      return;
    }

    // Ensure background image div exists
    if (!bgImageRef.current) {
      console.log('[DEBUG] KioskBackgroundProvider - Creating background image div');
      bgImageRef.current = document.createElement("div");
      bgImageRef.current.className = "kiosk-bg-image";
      bgImageRef.current.style.position = "fixed";
      bgImageRef.current.style.top = "0";
      bgImageRef.current.style.left = "0";
      bgImageRef.current.style.right = "0";
      bgImageRef.current.style.bottom = "0";
      bgImageRef.current.style.zIndex = "-2";
      bgImageRef.current.style.backgroundColor = FALLBACK_BG_COLOR;
      bgImageRef.current.style.backgroundSize = "cover";
      bgImageRef.current.style.backgroundPosition = "center";
      bgImageRef.current.style.backgroundAttachment = "fixed";
      bgImageRef.current.style.backgroundRepeat = "no-repeat";
      containerRef.current.appendChild(bgImageRef.current);
    }

    // Only set background image if it loaded successfully
    if (imageLoaded) {
      // Add cache buster to force fresh load
      const cacheKey = background.imageUrl?.includes('?') ? `&v=${Date.now()}` : `?v=${Date.now()}`;
      const finalUrl = `${background.imageUrl}${cacheKey}`;
      console.log('[DEBUG] KioskBackgroundProvider - Setting background image (loaded)', { finalUrl, cacheKey });
      bgImageRef.current.style.backgroundImage = `url('${finalUrl}')`;
      bgImageRef.current.style.opacity = "1";
    } else if (imageError) {
      // Image failed to load - keep fallback color visible
      console.warn(`[KioskBackgroundProvider] Image failed to load, using fallback color:`, background.imageUrl);
      bgImageRef.current.style.backgroundImage = "none";
      bgImageRef.current.style.opacity = "1";
    } else {
      // Still loading - show fallback
      console.log('[DEBUG] KioskBackgroundProvider - Image still loading, showing fallback');
      bgImageRef.current.style.backgroundImage = "none";
      bgImageRef.current.style.opacity = "1";
    }
  }, [background?.imageUrl, imageLoaded, imageError]);

  // Set up blur effect on image layer
  useEffect(() => {
    console.log('[DEBUG] KioskBackgroundProvider - Blur effect update', { blur: background?.blur });
    if (!bgImageRef.current) return;

    if (background?.blur && background.blur > 0) {
      console.log('[DEBUG] KioskBackgroundProvider - Applying blur:', background.blur);
      bgImageRef.current.style.filter = `blur(${background.blur}px)`;
    } else {
      bgImageRef.current.style.filter = "none";
    }
  }, [background?.blur]);

  // Set up dim overlay layer
  useEffect(() => {
    console.log('[DEBUG] KioskBackgroundProvider - Dim overlay update', { dim: background?.dim });
    if (!containerRef.current) return;

    // Ensure dim overlay div exists
    if (!bgDimRef.current) {
      console.log('[DEBUG] KioskBackgroundProvider - Creating dim overlay div');
      bgDimRef.current = document.createElement("div");
      bgDimRef.current.className = "kiosk-bg-dim";
      bgDimRef.current.style.position = "fixed";
      bgDimRef.current.style.top = "0";
      bgDimRef.current.style.left = "0";
      bgDimRef.current.style.right = "0";
      bgDimRef.current.style.bottom = "0";
      bgDimRef.current.style.zIndex = "-1";
      bgDimRef.current.style.pointerEvents = "none";
      containerRef.current.appendChild(bgDimRef.current);
    }

    // Apply dim overlay
    if (background?.dim && background.dim > 0) {
      console.log('[DEBUG] KioskBackgroundProvider - Applying dim:', background.dim);
      bgDimRef.current.style.backgroundColor = `rgba(0, 0, 0, ${background.dim / 100})`;
    } else {
      bgDimRef.current.style.backgroundColor = "transparent";
    }
  }, [background?.dim]);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {children}
    </div>
  );
}
