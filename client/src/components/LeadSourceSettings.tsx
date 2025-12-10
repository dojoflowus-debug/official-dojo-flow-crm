import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Globe, 
  MessageSquare, 
  Layout, 
  Monitor, 
  QrCode, 
  Facebook, 
  MessageCircle, 
  Phone, 
  PhoneOff, 
  MessageSquareText, 
  Mail, 
  Settings,
  Loader2,
  X
} from "lucide-react";

// Map icon names to components
const iconMap: Record<string, any> = {
  Globe,
  MessageSquare,
  Layout,
  Monitor,
  QrCode,
  Facebook,
  MessageCircle,
  Phone,
  PhoneOff,
  MessageSquareText,
  Mail,
  Settings,
};

interface LeadSourceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadSourceSettings({ isOpen, onClose }: LeadSourceSettingsProps) {
  const utils = trpc.useUtils();
  const { data: sources, isLoading } = trpc.leadSources.list.useQuery();
  const toggleMutation = trpc.leadSources.toggle.useMutation({
    onSuccess: () => {
      utils.leadSources.list.invalidate();
    },
  });

  const [localStates, setLocalStates] = useState<Record<number, boolean>>({});

  const handleToggle = async (id: number, currentEnabled: number) => {
    const newEnabled = currentEnabled === 1 ? 0 : 1;
    
    // Optimistically update local state
    setLocalStates(prev => ({ ...prev, [id]: newEnabled === 1 }));
    
    try {
      await toggleMutation.mutateAsync({ id, enabled: newEnabled });
    } catch (error) {
      // Revert on error
      setLocalStates(prev => ({ ...prev, [id]: currentEnabled === 1 }));
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Settings;
    return <IconComponent className="w-6 h-6" />;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-black border-2 border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="flex items-start justify-between p-8 pb-4">
            <div className="flex-1">
              {/* Kai Speech Bubble */}
              <div className="mb-8">
                <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 max-w-md shadow-xl inline-block">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-white text-sm leading-relaxed">
                        I'll add new leads from your website, calls, chat, and more. 
                        Toggle the sources you need to get set up!
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex-shrink-0 shadow-lg shadow-cyan-500/50"></div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Choose Lead Sources</h1>
                <p className="text-base text-slate-400">
                  Select the methods for adding new leads to your pipeline.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-8 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources?.map((source) => {
                  const isEnabled = localStates[source.id] !== undefined 
                    ? localStates[source.id] 
                    : source.enabled === 1;

                  return (
                    <Card
                      key={source.id}
                      className={`
                        bg-slate-900/60 border-2 p-6
                        transition-all duration-200 hover:bg-slate-900/80
                        ${isEnabled ? 'border-red-500/60' : 'border-slate-700/40'}
                        rounded-2xl
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-red-900/30">
                            <div className="text-white">
                              {getIconComponent(source.icon)}
                            </div>
                          </div>
                          <span className="text-lg font-medium text-white">
                            {source.name}
                          </span>
                        </div>
                        
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggle(source.id, source.enabled)}
                          className={`
                            data-[state=checked]:bg-red-500 
                            data-[state=unchecked]:bg-slate-700
                            scale-110
                          `}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Bottom Button */}
          <div className="border-t border-slate-800 p-6 flex justify-center">
            <Button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white px-16 py-6 text-lg font-semibold rounded-full shadow-xl shadow-red-500/40 transition-all duration-200 hover:shadow-red-500/60 hover:scale-105"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
