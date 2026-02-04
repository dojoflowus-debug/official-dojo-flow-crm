import React, { useEffect, useState } from 'react';

interface KioskScreensaverProps {
  onReturn: () => void;
  message?: string;
  showLogo?: boolean;
}

/**
 * KioskScreensaver - Full-screen idle mode
 * 
 * Features:
 * - Animated background with subtle motion
 * - Centered school logo
 * - Large "Tap to check in" text
 * - Any interaction returns to kiosk home
 */
export default function KioskScreensaver({ onReturn, message = 'Tap the screen to check in', showLogo = true }: KioskScreensaverProps) {
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.3);

  // Subtle animation loop - slow zoom and fade
  useEffect(() => {
    let animationFrame: number;
    let direction = 1;
    let currentScale = 1;
    let currentOpacity = 0.3;

    const animate = () => {
      currentScale += direction * 0.0005;
      if (currentScale >= 1.1) {
        direction = -1;
        currentScale = 1.1;
      } else if (currentScale <= 1) {
        direction = 1;
        currentScale = 1;
      }
      setScale(currentScale);

      const target = direction === 1 ? 0.3 : 0.5;
      currentOpacity = currentOpacity + (target - currentOpacity) * 0.01;
      setOpacity(currentOpacity);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Handle any interaction to return to home
  const handleInteraction = () => {
    onReturn();
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Animated background particles/gradient */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated background circles */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            bottom: '10%',
            right: '10%',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Logo */}
        {showLogo && (
          <div
            className="mb-12 transition-transform duration-100"
            style={{
              transform: `scale(${scale})`,
              opacity,
            }}
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
              alt="DojoFlow"
              className="h-32 w-32 object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Main text */}
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight">
            Welcome
          </h1>

          <p className="text-3xl md:text-4xl text-white/80 font-light">
            {message}
          </p>

          {/* Rotating slogans */}
          <div className="mt-12 h-12 flex items-center justify-center">
            <p className="text-lg md:text-xl text-white/60 font-medium animate-pulse">
              Discipline • Confidence • Fitness
            </p>
          </div>
        </div>

        {/* Tap indicator - pulsing circle at bottom */}
        <div className="absolute bottom-12 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/40"
                style={{
                  animation: `pulse 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
          <p className="text-white/40 text-sm">Tap anywhere to continue</p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(0px);
          }
          75% {
            transform: translateY(-20px) translateX(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
