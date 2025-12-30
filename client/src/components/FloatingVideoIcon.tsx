import { useEffect, useRef, useState, useCallback } from "react";

interface FloatingVideoIconProps {
  videoSrc: string;
  posterSrc?: string;
  heroRef: React.RefObject<HTMLElement>;
}

export function FloatingVideoIcon({ videoSrc, posterSrc, heroRef }: FloatingVideoIconProps) {
  const [isCondensed, setIsCondensed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll handler with requestAnimationFrame for 60fps
  const handleScroll = useCallback(() => {
    if (!heroRef.current) return;

    const heroRect = heroRef.current.getBoundingClientRect();
    const heroHeight = heroRect.height;
    const scrolled = -heroRect.top;
    
    // Start showing when scrolled past 60% of hero
    const threshold = heroHeight * 0.6;
    
    setIsCondensed(scrolled >= threshold);
  }, [heroRef]);

  useEffect(() => {
    let rafId: number;
    
    const onScroll = () => {
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [handleScroll]);

  // Start video playback
  useEffect(() => {
    if (videoRef.current && isCondensed) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked
      });
    }
  }, [isCondensed]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* SVG Definitions for masks and filters */}
      <svg width="0" height="0" style={{ position: "absolute", visibility: "hidden" }}>
        <defs>
          {/* DojoFlow swirl icon mask - circular base */}
          <clipPath id="dojoflow-circle-mask" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.48" />
          </clipPath>
          
          {/* Glow filter for the icon */}
          <filter id="icon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="rgba(239, 68, 68, 0.6)" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Floating Video Icon Container */}
      <div
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-50 cursor-pointer transition-all duration-500 ease-out ${
          isCondensed 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
        style={{
          bottom: "24px",
          right: "24px",
          width: "88px",
          height: "88px",
        }}
        title="Back to top"
      >
        {/* Breathing glow effect */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(239, 68, 68, 0.2) 40%, transparent 70%)",
            filter: "blur(12px)",
            transform: isHovered ? "scale(1.5)" : "scale(1.3)",
            transition: "transform 0.3s ease-out",
            animation: "breathingGlow 3s ease-in-out infinite",
          }}
        />

        {/* Main container with video */}
        <div 
          className="relative w-full h-full rounded-full overflow-hidden transition-all duration-300"
          style={{
            transform: isHovered ? "scale(1.08)" : "scale(1)",
            boxShadow: isHovered
              ? "0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.15)"
              : "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Video element clipped to circle */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              clipPath: "url(#dojoflow-circle-mask)",
              filter: isHovered ? "brightness(1.1) contrast(1.05)" : "brightness(0.85) contrast(1.1)",
              transition: "filter 0.3s ease-out",
            }}
            poster={posterSrc}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* Dark overlay for icon visibility */}
          <div 
            className="absolute inset-0 rounded-full transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)",
              opacity: isHovered ? 0.4 : 0.6,
            }}
          />

          {/* DojoFlow swirl icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <img 
              src="/kai-icon-hero.png" 
              alt="DojoFlow"
              className="w-full h-full object-contain transition-all duration-300"
              style={{
                filter: isHovered 
                  ? "drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) brightness(1.1)" 
                  : "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))",
                transform: isHovered ? "scale(1.05)" : "scale(1)",
              }}
            />
          </div>

          {/* Glass reflection effect */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
            }}
          />

          {/* Border ring */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
            style={{
              border: isHovered ? "2px solid rgba(239, 68, 68, 0.6)" : "1px solid rgba(239, 68, 68, 0.3)",
            }}
          />
        </div>

        {/* Tooltip */}
        <div 
          className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          Back to top
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(0,0,0,0.9)",
            }}
          />
        </div>
      </div>

      {/* CSS for breathing animation */}
      <style>{`
        @keyframes breathingGlow {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
          }
        }
      `}</style>
    </>
  );
}

export default FloatingVideoIcon;
