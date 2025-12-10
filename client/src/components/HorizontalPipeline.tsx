import { User, Mail, Phone, Calendar, Flame, Star, MessageSquare, Clock } from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface HorizontalPipelineProps {
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

export default function HorizontalPipeline({ 
  selectedStage, 
  onStageSelect,
  stageCounts = {}
}: HorizontalPipelineProps) {
  return (
    <div className="w-full py-12 px-4">
      {/* Pipeline Container */}
      <div className="relative flex items-center justify-between max-w-7xl mx-auto">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          
          return (
            <div key={stage.id} className="flex items-center">
              {/* Stage Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStageSelect(stage.id)}
                  className={`
                    relative w-20 h-20 rounded-full flex items-center justify-center
                    transition-all duration-300 cursor-pointer
                    ${isSelected 
                      ? 'bg-red-600 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' 
                      : 'bg-gray-900 border-2 border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  <Icon 
                    className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-400'}`} 
                  />
                  
                  {/* Count Badge */}
                  {count > 0 && (
                    <div className={`
                      absolute -top-2 -right-2 w-7 h-7 rounded-full 
                      flex items-center justify-center text-xs font-bold
                      ${isSelected 
                        ? 'bg-white text-red-600' 
                        : 'bg-red-600 text-white'
                      }
                    `}>
                      {count}
                    </div>
                  )}
                </button>
                
                {/* Stage Label */}
                <div className={`
                  mt-4 text-center max-w-[120px]
                  ${isSelected ? 'text-white font-semibold' : 'text-gray-400'}
                `}>
                  <div className="text-sm leading-tight">
                    {stage.label}
                  </div>
                </div>
              </div>
              
              {/* Connecting Line */}
              {index < stages.length - 1 && (
                <div className="w-16 h-0.5 bg-red-600 mx-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
