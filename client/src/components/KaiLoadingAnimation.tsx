import React from 'react';
import { Loader2 } from 'lucide-react';

interface KaiLoadingAnimationProps {
  isDark?: boolean;
  isCinematic?: boolean;
}

export const KaiLoadingAnimation: React.FC<KaiLoadingAnimationProps> = ({ 
  isDark = false, 
  isCinematic = false 
}) => {
  return (
    <div className="flex gap-3 relative animate-in fade-in duration-300">
      {/* Kai Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${isCinematic ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30' : isDark ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
        <span className="text-[10px]">KAI</span>
      </div>

      {/* Loading Bubble */}
      <div className={`flex-1 max-w-2xl`}>
        <div 
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg ${
            isCinematic 
              ? 'bg-white/10 border border-white/20 backdrop-blur-sm' 
              : isDark 
                ? 'bg-[#1A1A1B] border border-white/10' 
                : 'bg-slate-100 border border-slate-200'
          }`}
          style={isCinematic ? { 
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          } : {}}
        >
          <Loader2 className={`w-4 h-4 animate-spin ${isCinematic ? 'text-white' : isDark ? 'text-white/70' : 'text-slate-500'}`} />
          <span className={`text-sm ${isCinematic ? 'text-white/80' : isDark ? 'text-white/70' : 'text-slate-600'}`}>
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
};

export default KaiLoadingAnimation;
