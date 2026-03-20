import { useEffect, useState } from "react";

interface SplashLoaderProps {
  /** When true the splash fades out and unmounts */
  ready: boolean;
}

/**
 * SplashLoader
 *
 * Full-screen branded splash screen shown during the initial app load.
 * Displays the DojoFlow logo with a subtle pulse animation and a thin
 * progress bar at the bottom.  Once `ready` becomes true the splash
 * fades out over 400 ms and then unmounts completely so it never
 * blocks the underlying UI.
 */
export function SplashLoader({ ready }: SplashLoaderProps) {
  // Track whether we are in the fade-out phase
  const [fading, setFading] = useState(false);
  // Track whether the component has fully unmounted
  const [unmounted, setUnmounted] = useState(false);
  // Animate the fake progress bar
  const [progress, setProgress] = useState(0);

  // Fake progress: ramp quickly to ~85 % then slow down until ready
  useEffect(() => {
    if (unmounted) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (ready) return 100;
        if (prev >= 85) return prev + 0.3;
        return prev + 2.5;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [ready, unmounted]);

  // When ready, finish the bar then start the fade
  useEffect(() => {
    if (!ready) return;
    setProgress(100);
    const fadeTimer = setTimeout(() => setFading(true), 150);
    const unmountTimer = setTimeout(() => setUnmounted(true), 600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [ready]);

  if (unmounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        transition: "opacity 0.45s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Animated pulse ring */}
          <div
            style={{
              position: "absolute",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "1px solid rgba(220, 38, 38, 0.35)",
              animation: "splash-pulse 2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              animation: "splash-pulse 2s ease-in-out infinite 0.4s",
            }}
          />

          {/* Logo container */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
              alt="DojoFlow"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                filter: "brightness(1.1)",
              }}
            />
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Dojo<span style={{ color: "#dc2626" }}>Flow</span>
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Command Center
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(progress, 100)}%`,
            background: "linear-gradient(90deg, #dc2626, #ef4444)",
            transition: "width 0.12s ease",
            boxShadow: "0 0 8px rgba(220, 38, 38, 0.8)",
          }}
        />
      </div>

      {/* ── Keyframes injected inline ── */}
      <style>{`
        @keyframes splash-pulse {
          0%   { transform: scale(0.95); opacity: 0.6; }
          50%  { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
