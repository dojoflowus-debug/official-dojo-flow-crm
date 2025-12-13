import { useRef, useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Flame, Star, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface StageRailProps {
  selectedStage: string;
  onStageSelect: (stageId: string) => void;
  stageCounts?: Record<string, number>;
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

export default function StageRail({ 
  selectedStage, 
  onStageSelect,
  stageCounts = {}
}: StageRailProps) {
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

  // Calculate progress percentage based on selected stage
  const selectedIndex = stages.findIndex(s => s.id === selectedStage);
  const progressPercent = ((selectedIndex + 1) / stages.length) * 100;

  return (
    <div className="relative w-full py-6 px-4 md:px-6">
      {/* Progress bar background */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#E53935] to-[#FF6B6B] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
      )}

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      )}

      {/* Scrollable stage rail */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-8 md:px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          const isPast = index < selectedIndex;
          
          return (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage.id)}
              className={`
                relative flex items-center gap-2.5 px-5 py-3 rounded-full
                transition-all duration-200 ease-out cursor-pointer snap-center
                whitespace-nowrap flex-shrink-0
                ${isSelected 
                  ? 'bg-[#E53935] text-white shadow-lg shadow-red-500/30 scale-105' 
                  : isPast
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : isPast ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
                {stage.label}
              </span>
              
              {/* Count badge */}
              {count > 0 && (
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-200 text-slate-600'
                  }
                `}>
                  {count}
                </span>
              )}

              {/* Active indicator glow */}
              {isSelected && (
                <div className="absolute inset-0 rounded-full bg-[#E53935] opacity-20 blur-md -z-10 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
