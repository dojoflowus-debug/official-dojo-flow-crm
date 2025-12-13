import { useRef, useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Flame, Star, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Calculate health based on stage counts
  const getStageHealth = (stageId: string): 'green' | 'yellow' | 'red' => {
    if (stageHealth[stageId]) return stageHealth[stageId];
    const count = stageCounts[stageId] || 0;
    if (count === 0) return 'green';
    if (count <= 5) return 'green';
    if (count <= 10) return 'yellow';
    return 'red';
  };

  // Get connector line color based on flow status
  const getConnectorColor = (fromIndex: number, toIndex: number): string => {
    const fromHealth = getStageHealth(stages[fromIndex].id);
    const toHealth = getStageHealth(stages[toIndex].id);
    
    // If either stage has issues, connector shows that
    if (fromHealth === 'red' || toHealth === 'red') return 'bg-red-400';
    if (fromHealth === 'yellow' || toHealth === 'yellow') return 'bg-amber-400';
    return 'bg-green-400';
  };

  return (
    <div className="relative w-full py-4 px-4 md:px-6">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full 
            flex items-center justify-center
            transition-all duration-[180ms] ease-out
            ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-50'}
          `}
        >
          <ChevronLeft className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-slate-600'}`} />
        </button>
      )}

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className={`
            absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full 
            flex items-center justify-center
            transition-all duration-[180ms] ease-out
            ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-50'}
          `}
        >
          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-slate-600'}`} />
        </button>
      )}

      {/* Scrollable stage rail */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide scroll-smooth px-6 md:px-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          const health = getStageHealth(stage.id);
          
          // In resolve mode, dim green stages
          const isDimmed = isResolveMode && health === 'green';
          
          // Health-based styling
          const healthStyles = {
            green: {
              border: isSelected ? 'border-green-400/50' : 'border-transparent',
              text: isSelected ? 'text-green-600' : isDarkMode ? 'text-white/60' : 'text-slate-500',
              bg: isSelected ? (isDarkMode ? 'bg-green-900/20' : 'bg-green-50') : '',
            },
            yellow: {
              border: isSelected ? 'border-amber-400/50' : 'border-transparent',
              text: isSelected ? 'text-amber-600' : isDarkMode ? 'text-white/60' : 'text-slate-500',
              bg: isSelected ? (isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50') : '',
            },
            red: {
              border: isSelected ? 'border-red-400/50' : 'border-transparent',
              text: isSelected ? 'text-red-600' : isDarkMode ? 'text-white/60' : 'text-slate-500',
              bg: isSelected ? (isDarkMode ? 'bg-red-900/20' : 'bg-red-50') : '',
            },
          };
          
          const styles = healthStyles[health];
          
          return (
            <div key={stage.id} className="flex items-center flex-shrink-0">
              {/* Stage button */}
              <button
                onClick={() => onStageSelect(stage.id)}
                className={`
                  relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                  transition-all duration-[180ms] ease-out cursor-pointer
                  border ${styles.border} ${styles.bg}
                  ${isDimmed ? 'opacity-30' : ''}
                  ${isSelected 
                    ? '' 
                    : isDarkMode
                      ? 'hover:bg-white/5'
                      : 'hover:bg-slate-50'
                  }
                `}
              >
                {/* Count badge - fade in */}
                {count > 0 && (
                  <div className={`
                    absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full 
                    flex items-center justify-center text-[10px] font-semibold
                    transition-opacity duration-[180ms] ease-out
                    ${health === 'green' ? 'bg-green-500' : health === 'yellow' ? 'bg-amber-500' : 'bg-red-500'} 
                    text-white
                  `}>
                    {count}
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  transition-all duration-[180ms] ease-out
                  ${isSelected 
                    ? styles.text 
                    : isDarkMode ? 'text-white/50' : 'text-slate-400'
                  }
                  ${isDarkMode ? 'bg-white/5' : 'bg-slate-100/50'}
                `}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Label */}
                <span className={`
                  text-[10px] font-medium whitespace-nowrap
                  transition-all duration-[180ms] ease-out
                  ${styles.text}
                `}>
                  {stage.label}
                </span>
              </button>

              {/* Connector line between stages */}
              {index < stages.length - 1 && (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  {/* Base connector line */}
                  <div className={`
                    absolute w-full h-[2px] rounded-full
                    transition-all duration-[180ms] ease-out
                    ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}
                  `} />
                  
                  {/* Animated flow line (left to right) */}
                  <div 
                    className={`
                      absolute h-[2px] rounded-full
                      ${getConnectorColor(index, index + 1)}
                      ${isResolveMode ? 'opacity-60' : 'opacity-30'}
                    `}
                    style={{
                      width: '100%',
                      animation: 'flowRight 2s ease-out infinite',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flow animation keyframes */}
      <style>{`
        @keyframes flowRight {
          0% { 
            transform: scaleX(0); 
            transform-origin: left;
            opacity: 0;
          }
          50% { 
            transform: scaleX(1); 
            transform-origin: left;
            opacity: 0.5;
          }
          100% { 
            transform: scaleX(0); 
            transform-origin: right;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
