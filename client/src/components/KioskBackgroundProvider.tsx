import React, { useEffect, useRef } from "react";
import { useKioskBackground } from "@/hooks/useKioskBackground";

// System default: clean white background
const DEFAULT_BG_COLOR = '#ffffff';

interface KioskBackgroundProviderProps {
  locationId: number;
  children: React.ReactNode;
}

/**
 * Provider component that applies kiosk background to the entire page
 * Wraps kiosk routes and applies background settings
 * 
 * Layer structure:
 * 1. White default background (no image)
 * 2. Background image (fixed position) - only when imageUrl exists
 * 3. Dim overlay (rgba on top of image) - only when imageUrl exists
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

  // Set up background image layer - only when image URL exists
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
    
    // If no imageUrl, don't create background image layer - use white default
    if (!background?.imageUrl) {
      console.log('[DEBUG] KioskBackgroundProvider - No imageUrl, using white default background');
      // Clean up background image div if it exists
      if (bgImageRef.current && containerRef.current?.contains(bgImageRef.current)) {
        containerRef.current.removeChild(bgImageRef.current);
        bgImageRef.current = null;
      }
      return;
    }

    if (!containerRef.current) {
      console.log('[DEBUG] KioskBackgroundProvider - Early return: no container');
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
      bgImageRef.current.style.backgroundColor = DEFAULT_BG_COLOR;
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
      // Image failed to load - keep white default visible
      console.warn(`[KioskBackgroundProvider] Image failed to load, using white default:`, background.imageUrl);
      bgImageRef.current.style.backgroundImage = "none";
      bgImageRef.current.style.opacity = "1";
    } else {
      // Still loading - show white fallback
      console.log('[DEBUG] KioskBackgroundProvider - Image still loading, showing white fallback');
      bgImageRef.current.style.backgroundImage = "none";
      bgImageRef.current.style.opacity = "1";
    }
  }, [background?.imageUrl, imageLoaded, imageError]);

  // Set up blur effect on image layer - only when image exists
  useEffect(() => {
    console.log('[DEBUG] KioskBackgroundProvider - Blur effect update', { blur: background?.blur, hasImage: !!background?.imageUrl });
    if (!bgImageRef.current || !background?.imageUrl) return;

    if (background?.blur && background.blur > 0) {
      console.log('[DEBUG] KioskBackgroundProvider - Applying blur:', background.blur);
      bgImageRef.current.style.filter = `blur(${background.blur}px)`;
    } else {
      bgImageRef.current.style.filter = "none";
    }
  }, [background?.blur, background?.imageUrl]);

  // Set up dim overlay layer - only when image exists
  useEffect(() => {
    console.log('[DEBUG] KioskBackgroundProvider - Dim overlay update', { dim: background?.dim, hasImage: !!background?.imageUrl });
    if (!containerRef.current || !background?.imageUrl) {
      // Clean up dim overlay if no image
      if (bgDimRef.current && containerRef.current?.contains(bgDimRef.current)) {
        containerRef.current.removeChild(bgDimRef.current);
        bgDimRef.current = null;
      }
      return;
    }

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

    // Apply dim overlay only when image exists
    if (background?.dim && background.dim > 0) {
      console.log('[DEBUG] KioskBackgroundProvider - Applying dim:', background.dim);
      bgDimRef.current.style.backgroundColor = `rgba(0, 0, 0, ${background.dim / 100})`;
    } else {
      bgDimRef.current.style.backgroundColor = "transparent";
    }
  }, [background?.dim, background?.imageUrl]);

  return (
    <div 
      ref={containerRef} 
      className="relative min-h-screen kiosk-background-provider"
      style={{
        backgroundColor: DEFAULT_BG_COLOR,
        backgroundImage: 'none',
        backgroundAttachment: 'unset',
      }}
    >
      {children}
    </div>
  );
}
