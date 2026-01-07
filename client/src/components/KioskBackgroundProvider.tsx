import React, { useEffect, useRef } from "react";
import { useKioskBackground } from "@/hooks/useKioskBackground";

interface KioskBackgroundProviderProps {
  locationId: number;
  children: React.ReactNode;
}

/**
 * Provider component that applies kiosk background to the entire page
 * Wraps kiosk routes and applies background settings
 */
export function KioskBackgroundProvider({
  locationId,
  children,
}: KioskBackgroundProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { background, isLoading, getBackgroundStyles } =
    useKioskBackground(locationId);

  useEffect(() => {
    if (!containerRef.current || !background) return;

    const imageUrl = background.imageUrl || background.presetKey;
    if (!imageUrl) return;

    // Create background overlay div
    let bgOverlay = containerRef.current.querySelector(
      ".kiosk-bg-overlay"
    ) as HTMLElement;

    if (!bgOverlay) {
      bgOverlay = document.createElement("div");
      bgOverlay.className = "kiosk-bg-overlay";
      containerRef.current.appendChild(bgOverlay);
    }

    // Apply styles
    bgOverlay.style.position = "fixed";
    bgOverlay.style.top = "0";
    bgOverlay.style.left = "0";
    bgOverlay.style.right = "0";
    bgOverlay.style.bottom = "0";
    bgOverlay.style.zIndex = "-1";
    bgOverlay.style.backgroundImage = `url('${imageUrl}')`;
    bgOverlay.style.backgroundSize = "cover";
    bgOverlay.style.backgroundPosition = "center";
    bgOverlay.style.backgroundAttachment = "fixed";

    // Apply blur
    if (background.blur && background.blur > 0) {
      bgOverlay.style.filter = `blur(${background.blur}px)`;
    }

    // Apply dim overlay
    if (background.dim && background.dim > 0) {
      bgOverlay.style.backgroundColor = `rgba(0, 0, 0, ${background.dim / 100})`;
    } else {
      bgOverlay.style.backgroundColor = "";
    }
  }, [background]);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {children}
    </div>
  );
}
