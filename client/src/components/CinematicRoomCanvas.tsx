import React from 'react';

interface CinematicRoomCanvasProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  className?: string;
}

export function CinematicRoomCanvas({ width, height, children, className = '' }: CinematicRoomCanvasProps) {
  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient opacity-30" style={{
        backgroundImage: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.6) 100%)'
      }} />
      
      {/* Subtle bloom/glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)'
      }} />

      {/* Room container with texture */}
      <div 
        className="relative bg-gradient-to-b from-slate-700 to-slate-800 border-4 border-slate-600 rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
        }}
      >
        {/* Inner padding container */}
        <div className="absolute inset-4 border-2 border-dashed border-slate-500 rounded pointer-events-none" />
        
        {/* Stage area at top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-red-900/40 to-red-900/20 border-b border-red-700/50 flex items-center justify-center">
          <span className="text-xs font-bold text-red-300 uppercase tracking-wider">FRONT OF CLASS</span>
        </div>

        {/* Content area with padding */}
        <div className="absolute inset-0 pt-20 px-4 pb-4 pointer-events-auto">
          {children}
        </div>

        {/* Subtle light reflection */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-lg" />
      </div>
    </div>
  );
}
