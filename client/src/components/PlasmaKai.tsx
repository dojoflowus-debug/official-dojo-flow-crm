import { useEffect, useRef } from 'react';

interface PlasmaKaiProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isAnimating?: boolean;
}

/**
 * PlasmaKai - Animated glass ball with 2500 interactive particles
 * Particles gravitate towards cursor movement for dynamic interaction
 * Creates a dense, cosmic dust effect with tiny particles
 * Represents Kai AI assistant with realistic glass reflections
 */
export default function PlasmaKai({ isSpeaking = false, isListening = false, isAnimating = false }: PlasmaKaiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    hue: number;
    targetHue: number;
    trail: Array<{ x: number; y: number }>;
  }>>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const prevSpeakingRef = useRef(false);
  const speedMultiplierRef = useRef(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 240;
    canvas.width = size;
    canvas.height = size;

    // Initialize 1500 particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 1500; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (size / 2 - 20);
        const initialHue = Math.random() * 40 + 180; // Pure cyan range (180-220°)
        particlesRef.current.push({
          x: size / 2 + Math.cos(angle) * radius,
          y: size / 2 + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 0.2 + 0.2, // 0.2-0.4px (smaller, dust-like particles)
          hue: initialHue,
          targetHue: initialHue,
          trail: []
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Detect speech start and trigger energy burst
      if (isSpeaking && !prevSpeakingRef.current) {
        // Speech just started - boost speed multiplier
        speedMultiplierRef.current = 1.4; // 40% speed boost (2.5 * 1.4 = 3.5)
      }
      prevSpeakingRef.current = isSpeaking;

      // Gradually decay speed multiplier back to 1.0
      if (speedMultiplierRef.current > 1.0) {
        speedMultiplierRef.current -= 0.005; // Decay over ~80 frames (1.3 seconds at 60fps)
        if (speedMultiplierRef.current < 1.0) {
          speedMultiplierRef.current = 1.0;
        }
      }

      // Draw glass ball background
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges (circular boundary)
        const dx = particle.x - size / 2;
        const dy = particle.y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > size / 2 - 20) {
          const angle = Math.atan2(dy, dx);
          particle.x = size / 2 + Math.cos(angle) * (size / 2 - 20);
          particle.y = size / 2 + Math.sin(angle) * (size / 2 - 20);
          particle.vx *= -0.8;
          particle.vy *= -0.8;
        }

        // Mouse interaction - attract particles to cursor
        const mouseDx = particle.x - mouseRef.current.x;
        const mouseDy = particle.y - mouseRef.current.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDist < 150) {
          // Attract particles toward cursor with weaker force
          particle.vx -= mouseDx / mouseDist * 0.08;
          particle.vy -= mouseDy / mouseDist * 0.08;
        }

        // Particle-to-particle repulsion to prevent close clustering
        particlesRef.current.forEach((other) => {
          if (other !== particle) {
            const pdx = particle.x - other.x;
            const pdy = particle.y - other.y;
            const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            // Apply distance-based repulsion (stronger when closer)
            if (pDist < 20 && pDist > 0) {
              // Inverse relationship: force = strength / distance
              // Closer particles = stronger push
              const repulsionStrength = 0.3;
              const repulsionForce = repulsionStrength / pDist;
              particle.vx += (pdx / pDist) * repulsionForce;
              particle.vy += (pdy / pDist) * repulsionForce;
            }
          }
        });

        // Add stronger random drift to prevent condensing
        particle.vx += (Math.random() - 0.5) * 0.04;
        particle.vy += (Math.random() - 0.5) * 0.04;

        // Apply lighter velocity damping for normal speed movement
        particle.vx *= 0.97;
        particle.vy *= 0.97;

        // Limit maximum velocity with dynamic speed multiplier for energy burst
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const baseMaxSpeed = 2.5;
        const maxSpeed = baseMaxSpeed * speedMultiplierRef.current; // 2.5 to 3.5 during burst
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }

        // Determine target color based on state
        if (isSpeaking) {
          particle.targetHue = 40 + Math.random() * 20; // Soft gold/warm champagne when speaking (40-60° hue)
        } else if (isListening) {
          particle.targetHue = 120 + Math.random() * 40; // Green when listening
        } else if (isAnimating) {
          particle.targetHue = 180 + Math.random() * 40; // Cyan when animating
        } else {
          particle.targetHue = 180 + Math.random() * 40; // Cyan idle state
        }

        // Smoothly interpolate current hue towards target hue
        const hueDiff = particle.targetHue - particle.hue;
        particle.hue += hueDiff * 0.05; // 5% interpolation per frame

        // Calculate local density (count nearby particles within 30px radius)
        let nearbyCount = 0;
        const densityRadius = 30;
        particlesRef.current.forEach((other) => {
          if (other !== particle) {
            const odx = particle.x - other.x;
            const ody = particle.y - other.y;
            const oDist = Math.sqrt(odx * odx + ody * ody);
            if (oDist < densityRadius) {
              nearbyCount++;
            }
          }
        });

        // Map density to opacity (0-20 nearby particles -> 0.3-0.9 opacity)
        const baseOpacity = 0.3 + Math.min(nearbyCount / 20, 1) * 0.6;

        // Update trail: add current position if particle is moving fast (reuse speed from velocity limit)
        // Initialize trail array if it doesn't exist
        if (!particle.trail) {
          particle.trail = [];
        }
        
        if (speed > 0.5) {
          particle.trail.unshift({ x: particle.x, y: particle.y });
          // Keep trail length proportional to speed (max 8 points)
          const maxTrailLength = Math.min(Math.floor(speed * 3), 8);
          if (particle.trail.length > maxTrailLength) {
            particle.trail.pop();
          }
        } else {
          // Fade out trail when particle slows down
          if (particle.trail && particle.trail.length > 0) {
            particle.trail.pop();
          }
        }

        // Dynamic saturation: 90% when speaking (vibrant gold), 70% otherwise
        const saturation = isSpeaking ? 90 : 70;

        // Draw fading trail behind fast-moving particles
        if (particle.trail && particle.trail.length > 0) {
          particle.trail.forEach((point, index) => {
            const trailOpacity = baseOpacity * (1 - index / particle.trail.length) * 0.5;
            const trailSize = particle.size * (1 - index / particle.trail.length * 0.5);
            ctx.fillStyle = `hsla(${particle.hue}, ${saturation}%, 60%, ${trailOpacity})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // Draw particle with density-based opacity and dynamic saturation
        ctx.fillStyle = `hsla(${particle.hue}, ${saturation}%, 60%, ${baseOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow for larger particles with density-based opacity and dynamic saturation
        if (particle.size > 0.35) {
          ctx.fillStyle = `hsla(${particle.hue}, ${saturation}%, 60%, ${baseOpacity * 0.3})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Glass reflection effect removed for cleaner appearance
      // const reflectionGradient = ctx.createLinearGradient(0, 0, size, size);
      // reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      // reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      // reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      // 
      // ctx.fillStyle = reflectionGradient;
      // ctx.beginPath();
      // ctx.arc(size / 3, size / 3, size / 4, 0, Math.PI * 2);
      // ctx.fill();

      // Update previous mouse position for next frame
      prevMouseRef.current.x = mouseRef.current.x;
      prevMouseRef.current.y = mouseRef.current.y;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, isListening, isAnimating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="w-full h-full"
      style={{ maxWidth: '240px', maxHeight: '240px' }}
    />
  );
}
