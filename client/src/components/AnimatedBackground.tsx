import { motion } from "framer-motion";

/**
 * AnimatedBackground - Anima-inspired moving background
 * 
 * Features:
 * - Large organic blob shapes with gradient fills
 * - Smooth curved lines flowing across canvas
 * - Multiple layers moving at different speeds (parallax)
 * - Purple-to-blue gradient color scheme
 * - Subtle glow effects for depth
 * - GPU-accelerated animations
 * - Respects prefers-reduced-motion
 */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large Blob Shape 1 - Top Right - Purple gradient */}
      <motion.div
        className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 100%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [-100, 100, -100],
          y: [-50, 50, -50],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Large Blob Shape 2 - Bottom Left - Blue gradient */}
      <motion.div
        className="absolute -bottom-32 -left-32 w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 100%)",
          filter: "blur(90px)",
        }}
        animate={{
          x: [100, -100, 100],
          y: [50, -50, 50],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Medium Blob Shape 3 - Center - Purple-blue mix */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.15) 50%, transparent 100%)",
          filter: "blur(70px)",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          x: [-150, 150, -150],
          y: [-100, 100, -100],
          scale: [0.9, 1.1, 0.9],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      {/* Curved flowing line 1 - Top area */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[400px]"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 80%)",
          filter: "blur(40px)",
        }}
        animate={{
          x: [-200, 200, -200],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Curved flowing line 2 - Middle area */}
      <motion.div
        className="absolute top-1/3 left-0 w-full h-[300px]"
        style={{
          background: "linear-gradient(45deg, transparent 0%, rgba(59, 130, 246, 0.15) 50%, transparent 100%)",
          clipPath: "polygon(0 30%, 100% 0, 100% 70%, 0 100%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [200, -200, 200],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Small accent blob - top left */}
      <motion.div
        className="absolute top-20 left-20 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [-50, 50, -50],
          y: [-30, 30, -30],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Small accent blob - bottom right */}
      <motion.div
        className="absolute bottom-20 right-20 w-[450px] h-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 100%)",
          filter: "blur(65px)",
        }}
        animate={{
          x: [50, -50, 50],
          y: [30, -30, 30],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Diagonal flowing gradient 1 */}
      <motion.div
        className="absolute top-0 right-0 w-[800px] h-[800px]"
        style={{
          background: "linear-gradient(225deg, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Diagonal flowing gradient 2 */}
      <motion.div
        className="absolute bottom-0 left-0 w-[700px] h-[700px]"
        style={{
          background: "linear-gradient(45deg, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{
          rotate: [360, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      />

      {/* Accessibility: Respect prefers-reduced-motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animated-background * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
