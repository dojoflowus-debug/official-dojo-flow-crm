import { useRef, useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Flame, Star, MessageSquare, Clock, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SignatureStageRailProps {
  selectedStage: string;
  onStageSelect: (stageId: string) => void;
  stageCounts?: Record<string, number>;
  stageHealth?: Record<string, 'green' | 'yellow' | 'red'>;
  isDarkMode: boolean;
  isResolveMode?: boolean;
}

const stages: PipelineStage[] = [
  { id: 'new_lead', label: 'New Lead', icon: User },
  { id: 'attempting_contact', label: 'Attempting Contact', icon: Mail },
  { id: 'contact_made', label: 'Contact Made', icon: Phone },
  { id: 'intro_scheduled', label: 'Intro Scheduled', icon: Calendar },
  { id: 'offer_presented', label: 'Offer Presented', icon: Flame },
  { id: 'enrolled', label: 'Enrolled', icon: Star },
  { id: 'nurture', label: 'Nurture', icon: MessageSquare },
  { id: 'lost_winback', label: 'Lost / Winback', icon: Clock },
];

// Health color configurations
const healthColors = {
  green: {
    bg: 'from-green-500/10 to-green-500/5',
    border: 'border-green-500/30',
    text: 'text-green-500',
    glow: 'shadow-green-500/20',
    line: 'bg-green-500',
  },
  yellow: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/20',
    line: 'bg-amber-500',
  },
  red: {
    bg: 'from-red-500/10 to-red-500/5',
    border: 'border-red-500/30',
    text: 'text-red-500',
    glow: 'shadow-red-500/20',
    line: 'bg-red-500',
  },
};

export default function SignatureStageRail({ 
  selectedStage, 
  onStageSelect,
  stageCounts = {},
  stageHealth = {},
  isDarkMode,
  isResolveMode = false
}: SignatureStageRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [illuminatedStage, setIlluminatedStage] = useState<string | null>(null);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Calculate default health based on stage counts
  const getStageHealth = (stageId: string): 'green' | 'yellow' | 'red' => {
    if (stageHealth[stageId]) return stageHealth[stageId];
    const count = stageCounts[stageId] || 0;
    if (count === 0) return 'green';
    if (count <= 5) return 'green';
    if (count <= 10) return 'yellow';
    return 'red';
  };

  // Handle stage selection with illumination effect
  const handleStageSelect = (stageId: string) => {
    setIlluminatedStage(stageId);
    setTimeout(() => setIlluminatedStage(null), 500);
    onStageSelect(stageId);
  };

  return (
    <div className="relative w-full py-4 px-4 md:px-6">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-800 shadow-lg hover:bg-slate-700' : 'bg-white shadow-lg hover:bg-slate-50'}`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-slate-600'}`} />
        </button>
      )}

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-800 shadow-lg hover:bg-slate-700' : 'bg-white shadow-lg hover:bg-slate-50'}`}
        >
          <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-slate-600'}`} />
        </button>
      )}

      {/* Scrollable stage rail */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-8 md:px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          const health = getStageHealth(stage.id);
          const colors = healthColors[health];
          const isIlluminated = illuminatedStage === stage.id;
          const selectedIndex = stages.findIndex(s => s.id === selectedStage);
          const isPast = index < selectedIndex;
          
          // In resolve mode, dim green stages
          const isDimmed = isResolveMode && health === 'green';
          
          return (
            <div key={stage.id} className="flex items-center flex-shrink-0">
              {/* Stage button */}
              <button
                onClick={() => handleStageSelect(stage.id)}
                className={`
                  relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl
                  transition-all duration-300 ease-out cursor-pointer
                  ${isDimmed ? 'opacity-30' : ''}
                  ${isSelected 
                    ? `bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-lg ${colors.glow}` 
                    : isDarkMode
                      ? 'bg-slate-800/50 border border-white/10 hover:bg-slate-700/50'
                      : 'bg-white/50 border border-slate-200 hover:bg-slate-50'
                  }
                  ${isIlluminated ? 'animate-pulse' : ''}
                `}
              >
                {/* Count badge */}
                {count > 0 && (
                  <div className={`
                    absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full 
                    flex items-center justify-center text-xs font-bold
                    ${isSelected 
                      ? `${health === 'green' ? 'bg-green-500' : health === 'yellow' ? 'bg-amber-500' : 'bg-red-500'} text-white` 
                      : isDarkMode 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }
                  `}>
                    {count}
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isSelected 
                    ? colors.text 
                    : isDarkMode ? 'text-white/60' : 'text-slate-500'
                  }
                  ${isSelected ? `bg-gradient-to-br ${colors.bg}` : isDarkMode ? 'bg-white/5' : 'bg-slate-100'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label */}
                <span className={`
                  text-xs font-medium whitespace-nowrap
                  ${isSelected 
                    ? colors.text 
                    : isDarkMode ? 'text-white/60' : 'text-slate-500'
                  }
                `}>
                  {stage.label}
                </span>

                {/* Health indicator bar */}
                <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${colors.line} ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
              </button>

              {/* Connector line between stages */}
              {index < stages.length - 1 && (
                <div className="relative w-8 h-8 flex items-center justify-center mx-1">
                  {/* Base line */}
                  <div className={`
                    absolute w-full h-0.5 rounded-full
                    ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}
                  `} />
                  
                  {/* Animated glow for Kai suggestions */}
                  {isPast && (
                    <div className={`
                      absolute w-full h-0.5 rounded-full bg-[#E53935]
                      animate-[shimmer_2s_ease-in-out_infinite]
                    `} style={{ opacity: 0.5 }} />
                  )}
                  
                  {/* Connector dot */}
                  <Zap className={`
                    w-3 h-3 z-10
                    ${isPast ? 'text-[#E53935]' : isDarkMode ? 'text-white/20' : 'text-slate-300'}
                  `} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
