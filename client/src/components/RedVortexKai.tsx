import { useState, useEffect } from 'react'

interface RedVortexKaiProps {
  isSpeaking?: boolean
  className?: string
}

export default function RedVortexKai({ isSpeaking = false, className = '' }: RedVortexKaiProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    let animationFrame: number
    
    const animate = () => {
      setRotation(prev => prev + (isSpeaking ? 0.03 : 0.01))
      animationFrame = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isSpeaking])

  return (
    <div className={`relative ${className}`} style={{ width: '400px', height: '400px' }}>
      {/* Background Particle Stars */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Smoke/Mist Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }}>
        {/* Smoke layer 1 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(80, 80, 80, 0.15) 0%, transparent 60%)',
            animation: 'float 8s ease-in-out infinite',
            filter: 'blur(20px)'
          }}
        />
        
        {/* Smoke layer 2 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(100, 100, 100, 0.2) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s',
            filter: 'blur(25px)'
          }}
        />
        
        {/* Smoke layer 3 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(60, 60, 60, 0.18) 0%, transparent 65%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s',
            filter: 'blur(30px)'
          }}
        />
      </div>

      {/* Concentric Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Outer Ring 1 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow"
          style={{
            width: '380px',
            height: '380px',
            border: '2px solid rgba(255, 69, 0, 0.3)',
            boxShadow: '0 0 20px rgba(255, 69, 0, 0.5), inset 0 0 20px rgba(255, 69, 0, 0.2)',
            animationDuration: '20s'
          }}
        />
        
        {/* Outer Ring 2 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow"
          style={{
            width: '320px',
            height: '320px',
            border: '2px solid rgba(255, 69, 0, 0.4)',
            boxShadow: '0 0 25px rgba(255, 69, 0, 0.6), inset 0 0 25px rgba(255, 69, 0, 0.3)',
            animationDuration: '15s',
            animationDirection: 'reverse'
          }}
        />
        
        {/* Inner Ring 1 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow"
          style={{
            width: '260px',
            height: '260px',
            border: '2px solid rgba(255, 69, 0, 0.5)',
            boxShadow: '0 0 30px rgba(255, 69, 0, 0.7), inset 0 0 30px rgba(255, 69, 0, 0.4)',
            animationDuration: '12s'
          }}
        />
        
        {/* Inner Ring 2 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow"
          style={{
            width: '200px',
            height: '200px',
            border: '2px solid rgba(255, 69, 0, 0.6)',
            boxShadow: '0 0 35px rgba(255, 69, 0, 0.8), inset 0 0 35px rgba(255, 69, 0, 0.5)',
            animationDuration: '10s',
            animationDirection: 'reverse'
          }}
        />
      </div>

      {/* Yin-Yang Core */}
      <div 
        className="absolute top-1/2 left-1/2 z-10"
        style={{ 
          width: '220px', 
          height: '220px',
          marginLeft: '-110px',
          marginTop: '-110px',
          transform: `rotate(${rotation}rad)`,
          filter: 'drop-shadow(0 0 20px rgba(255, 69, 0, 0.6))'
        }}
      >
        <img 
          src="/yinyang-red-white.png" 
          alt="Yin Yang" 
          className="w-full h-full"
          style={{ 
            imageRendering: 'crisp-edges',
            objectFit: 'contain',
            mixBlendMode: 'normal'
          }}
        />
      </div>
      
      {/* Bottom Glow Reflection */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '300px',
          height: '60px',
          background: 'radial-gradient(ellipse at center, rgba(255, 69, 0, 0.6) 0%, rgba(255, 69, 0, 0.3) 40%, transparent 70%)',
          filter: 'blur(15px)',
          zIndex: 0,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
