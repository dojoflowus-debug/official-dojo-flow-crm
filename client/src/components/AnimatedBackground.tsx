import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground - Anima-inspired flowing curves and organic shapes
 * 
 * Features:
 * - Canvas-based smooth bezier curves flowing horizontally
 * - Organic blob shapes with radial gradients
 * - Continuous horizontal motion (right to left)
 * - Multiple layers at different speeds (parallax effect)
 * - Vibrant red/orange/purple/blue color scheme
 * - Subtle blur effects for depth
 * - GPU-accelerated via canvas
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size to match window
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Define flowing curved lines with varied patterns
    const curves = [
      {
        baseY: 0.15,
        amplitude: 70,
        frequency: 0.0022,
        speed: 0.6,
        thickness: 3.5,
        color: 'rgba(239, 68, 68, 0.45)',
        secondaryFreq: 0.004,
        blur: 1,
      },
      {
        baseY: 0.35,
        amplitude: 90,
        frequency: 0.0018,
        speed: 0.8,
        thickness: 3,
        color: 'rgba(249, 115, 22, 0.4)',
        secondaryFreq: 0.003,
        blur: 1,
      },
      {
        baseY: 0.55,
        amplitude: 85,
        frequency: 0.0028,
        speed: 0.7,
        thickness: 3.5,
        color: 'rgba(168, 85, 247, 0.35)',
        secondaryFreq: 0.0035,
        blur: 1,
      },
      {
        baseY: 0.75,
        amplitude: 100,
        frequency: 0.002,
        speed: 0.5,
        thickness: 3,
        color: 'rgba(59, 130, 246, 0.3)',
        secondaryFreq: 0.0025,
        blur: 1,
      },
      {
        baseY: 0.9,
        amplitude: 75,
        frequency: 0.0025,
        speed: 0.4,
        thickness: 2.5,
        color: 'rgba(239, 68, 68, 0.28)',
        secondaryFreq: 0.005,
        blur: 1,
      },
    ];

    // Define organic blob shapes with richer gradients
    const blobs = [
      {
        startX: 0.12,
        startY: 0.22,
        radius: 220,
        speed: 0.16,
        driftX: 110,
        driftY: 55,
        color1: 'rgba(239, 68, 68, 0.3)',
        color2: 'rgba(249, 115, 22, 0.15)',
        color3: 'rgba(239, 68, 68, 0)',
        blur: 38,
      },
      {
        startX: 0.78,
        startY: 0.42,
        radius: 260,
        speed: 0.13,
        driftX: 130,
        driftY: 65,
        color1: 'rgba(168, 85, 247, 0.28)',
        color2: 'rgba(139, 92, 246, 0.12)',
        color3: 'rgba(168, 85, 247, 0)',
        blur: 42,
      },
      {
        startX: 0.38,
        startY: 0.68,
        radius: 190,
        speed: 0.19,
        driftX: 90,
        driftY: 45,
        color1: 'rgba(249, 115, 22, 0.25)',
        color2: 'rgba(239, 68, 68, 0.1)',
        color3: 'rgba(249, 115, 22, 0)',
        blur: 32,
      },
      {
        startX: 0.88,
        startY: 0.18,
        radius: 230,
        speed: 0.11,
        driftX: 105,
        driftY: 52,
        color1: 'rgba(59, 130, 246, 0.22)',
        color2: 'rgba(99, 102, 241, 0.08)',
        color3: 'rgba(59, 130, 246, 0)',
        blur: 40,
      },
      {
        startX: 0.5,
        startY: 0.48,
        radius: 300,
        speed: 0.09,
        driftX: 150,
        driftY: 75,
        color1: 'rgba(239, 68, 68, 0.18)',
        color2: 'rgba(168, 85, 247, 0.08)',
        color3: 'rgba(239, 68, 68, 0)',
        blur: 55,
      },
      {
        startX: 0.2,
        startY: 0.85,
        radius: 180,
        speed: 0.14,
        driftX: 85,
        driftY: 42,
        color1: 'rgba(99, 102, 241, 0.2)',
        color2: 'rgba(59, 130, 246, 0.08)',
        color3: 'rgba(99, 102, 241, 0)',
        blur: 35,
      },
    ];

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      time += 0.012; // Smooth animation speed

      // Draw organic blobs first (background layer)
      blobs.forEach((blob) => {
        const centerX = w * blob.startX + Math.sin(time * blob.speed) * blob.driftX;
        const centerY = h * blob.startY + Math.cos(time * blob.speed * 0.8) * blob.driftY;

        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, blob.radius
        );
        gradient.addColorStop(0, blob.color1);
        gradient.addColorStop(0.4, blob.color2);
        gradient.addColorStop(0.8, blob.color3);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.filter = `blur(${blob.blur}px)`;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw flowing curved lines with complex wave patterns (foreground layer)
      curves.forEach((curve) => {
        const y = h * curve.baseY;
        
        ctx.save();
        ctx.filter = `blur(${curve.blur}px)`;
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        
        // Draw smooth curve with complex wave pattern
        const padding = 100;
        for (let x = -padding; x <= w + padding; x += 5) {
          const offset = time * curve.speed * 100;
          // Primary wave
          const wave1 = Math.sin((x + offset) * curve.frequency) * curve.amplitude;
          // Secondary wave for complexity
          const wave2 = Math.cos((x + offset) * curve.secondaryFreq) * (curve.amplitude * 0.3);
          // Tertiary subtle variation
          const wave3 = Math.sin((x + offset) * curve.frequency * 2.5) * (curve.amplitude * 0.15);
          
          const waveY = y + wave1 + wave2 + wave3;
          
          if (x === -padding) {
            ctx.moveTo(x, waveY);
          } else {
            ctx.lineTo(x, waveY);
          }
        }
        
        ctx.stroke();
        ctx.restore();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      animate();
    } else {
      // Draw static version for accessibility
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      blobs.forEach((blob) => {
        const centerX = w * blob.startX;
        const centerY = h * blob.startY;
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, blob.radius
        );
        gradient.addColorStop(0, blob.color1);
        gradient.addColorStop(0.4, blob.color2);
        gradient.addColorStop(0.8, blob.color3);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.filter = `blur(${blob.blur}px)`;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }} // Increased for maximum visibility
      aria-hidden="true"
    />
  );
}
