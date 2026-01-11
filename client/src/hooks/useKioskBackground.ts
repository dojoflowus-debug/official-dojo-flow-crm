import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

// No default background - white background is the system default
// Only apply image if explicitly configured via customUrl or presetKey

interface KioskBackground {
  type?: string;
  presetKey?: string | null;
  imageUrl?: string;
  blur?: number;
  dim?: number;
  vignette?: boolean;
}

/**
 * Hook to fetch and manage kiosk background settings for a location
 */
export function useKioskBackground(locationId: number) {
  const [background, setBackground] = useState<KioskBackground | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Fetch location background
  const { data: fetchedBackground, isLoading: isFetching } =
    trpc.kiosk.getLocationBackground.useQuery({ locationId }, { staleTime: 0, refetchOnMount: 'always' });

  useEffect(() => {
    console.log('[DEBUG] useKioskBackground - fetchedBackground changed', { 
      locationId, 
      fetchedBackground,
      isFetching 
    });
    
    if (fetchedBackground) {
      // Use imageUrl only if it exists - no fallback to default image
      const validatedBackground: KioskBackground = {
        ...fetchedBackground,
        imageUrl: fetchedBackground.imageUrl || undefined,
      };
      console.log('[DEBUG] useKioskBackground - Setting validated background', { validatedBackground });
      setBackground(validatedBackground);
      setImageLoaded(false);
      setImageError(null);
      setIsLoading(false);
    }
  }, [fetchedBackground]);

  useEffect(() => {
    console.log('[DEBUG] useKioskBackground - isFetching changed', { isFetching });
    setIsLoading(isFetching);
  }, [isFetching]);

  // Preload image to detect errors early
  useEffect(() => {
    if (!background?.imageUrl) {
      console.log('[DEBUG] useKioskBackground - No imageUrl to preload');
      return;
    }

    console.log('[DEBUG] useKioskBackground - Preloading image:', background.imageUrl);
    
    const img = new Image();
    const handleLoad = () => {
      console.log('[DEBUG] useKioskBackground - Image loaded successfully:', background.imageUrl);
      setImageLoaded(true);
      setImageError(null);
    };
    const handleError = () => {
      console.warn(`[KioskBackground] Failed to load image: ${background.imageUrl}`);
      setImageError(`Failed to load image: ${background.imageUrl}`);
      setImageLoaded(false);
      // Keep the URL but mark as error - UI will handle fallback
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = background.imageUrl;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [background?.imageUrl]);

  /**
   * Apply background to an element
   */
  const applyBackground = (element: HTMLElement | null) => {
    if (!element || !background) return;

    const imageUrl = background.imageUrl;
    if (!imageUrl) return;

    // Set background image
    element.style.backgroundImage = `url('${imageUrl}')`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.style.backgroundAttachment = "fixed";

    // Apply blur effect
    if (background?.blur && background.blur > 0) {
      element.style.filter = `blur(${background.blur}px)`;
    }

    if (background?.dim && background.dim > 0) {
      const opacity = 1 - background.dim / 100;
      element.style.opacity = `${opacity}`;
    }
  };

  /**
   * Apply background with overlay div (better for text content)
   */
  const applyBackgroundWithOverlay = (element: HTMLElement | null) => {
    if (!element || !background) return;

    const imageUrl = background.imageUrl;
    if (!imageUrl) return;

    // Create or update background overlay
    let overlay = element.querySelector(".kiosk-bg-overlay") as HTMLElement;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "kiosk-bg-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.bottom = "0";
      overlay.style.zIndex = "-1";
      element.appendChild(overlay);
    }

    // Set background image
    overlay.style.backgroundImage = `url('${imageUrl}')`;
    overlay.style.backgroundSize = "cover";
    overlay.style.backgroundPosition = "center";
    overlay.style.backgroundAttachment = "fixed";

    // Apply blur effect
    if (background?.blur && background.blur > 0) {
      overlay.style.filter = `blur(${background.blur}px)`;
    }

    if (background?.dim && background.dim > 0) {
      const dimColor = `rgba(0, 0, 0, ${background.dim / 100})`;
      overlay.style.backgroundColor = dimColor;
    }
  };

  /**
   * Get CSS styles for background
   */
  const getBackgroundStyles = (): React.CSSProperties => {
    const imageUrl = background?.imageUrl;
    if (!imageUrl) return {};

    const styles: React.CSSProperties = {
      backgroundImage: `url('${imageUrl}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };

    if (background?.blur && background.blur > 0) {
      styles.filter = `blur(${background.blur}px)`;
    }

    if (background?.dim && background.dim > 0) {
      styles.opacity = 1 - background.dim / 100;
    }

    return styles;
  };

  return {
    background,
    isLoading,
    imageLoaded,
    imageError,
    applyBackground,
    applyBackgroundWithOverlay,
    getBackgroundStyles,
  };
}
