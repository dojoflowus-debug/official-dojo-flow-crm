import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Users, 
  FolderOpen, 
  Calendar, 
  FileCheck, 
  Receipt,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import type { ProposedAction, FileAnalysis } from '@/lib/fileIntelligence';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Users,
  FolderOpen,
  Calendar,
  FileCheck,
  Receipt,
};

type FileActionCardProps = {
  analysis: FileAnalysis;
  fileName: string;
  fileUrl: string;
  fileType: string;
  onActionSelect: (action: ProposedAction) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
};

export function FileActionCard({
  analysis,
  fileName,
  fileUrl,
  fileType,
  onActionSelect,
  onCancel,
  isProcessing = false,
  isDark = false,
  isCinematic = false,
  isFocusMode = false,
}: FileActionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  
  const isImage = fileType.startsWith('image/');
  const primaryAction = analysis.proposedActions.find(a => a.primary);
  const secondaryActions = analysis.proposedActions.filter(a => !a.primary);
  
  const getBackgroundClass = () => {
    if (isCinematic || isFocusMode) {
      return 'bg-black/40 backdrop-blur-sm border-white/20';
    }
    if (isDark) {
      return 'bg-[#1a1a1a] border-white/10';
    }
    return 'bg-white border-slate-200';
  };
  
  const getTextClass = () => {
    if (isCinematic || isFocusMode || isDark) {
      return 'text-white';
    }
    return 'text-slate-900';
  };
  
  const getSecondaryTextClass = () => {
    if (isCinematic || isFocusMode || isDark) {
      return 'text-white/70';
    }
    return 'text-slate-500';
  };
  
  const handleActionClick = (action: ProposedAction) => {
    if (action.requiresConfirmation) {
      setSelectedAction(action);
    } else {
      onActionSelect(action);
    }
  };
  
  const handleConfirm = () => {
    if (selectedAction) {
      onActionSelect(selectedAction);
    }
  };
  
  const handleCancelConfirmation = () => {
    setSelectedAction(null);
  };
  
  return (
    <Card className={`overflow-hidden border ${getBackgroundClass()} transition-all duration-200`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isImage && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/10 flex-shrink-0">
              <img src={fileUrl} alt={fileName} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className={`font-medium text-sm ${getTextClass()}`}>{fileName}</p>
            <p className={`text-xs ${getSecondaryTextClass()}`}>
              {analysis.category.replace('_', ' ')} • {Math.round(analysis.confidence * 100)}% confidence
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Confirmation Dialog */}
          {selectedAction && (
            <div className={`p-3 rounded-lg border ${
              isCinematic || isFocusMode || isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={`text-sm font-medium mb-2 ${getTextClass()}`}>
                Confirm: {selectedAction.label}?
              </p>
              <p className={`text-xs mb-3 ${getSecondaryTextClass()}`}>
                {selectedAction.description}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelConfirmation}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          {!selectedAction && (
            <div className="space-y-2">
              {/* Primary Action */}
              {primaryAction && (
                <Button
                  className="w-full justify-start bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
                  onClick={() => handleActionClick(primaryAction)}
                  disabled={isProcessing}
                >
                  {(() => {
                    const Icon = iconMap[primaryAction.icon] || FolderOpen;
                    return <Icon className="w-4 h-4 mr-2" />;
                  })()}
                  {primaryAction.label}
                </Button>
              )}
              
              {/* Secondary Actions */}
              {secondaryActions.map((action) => {
                const Icon = iconMap[action.icon] || FolderOpen;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className={`w-full justify-start ${
                      isCinematic || isFocusMode || isDark
                        ? 'border-white/20 text-white hover:bg-white/10'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => handleActionClick(action)}
                    disabled={isProcessing}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                );
              })}
              
              {/* Template Download Link - show for schedule-related files */}
              {analysis.category === 'class_schedule' && (
                <a
                  href="/templates/class-schedule-template.xlsx"
                  download="DojoFlow-Class-Schedule-Template.xlsx"
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm rounded-md transition-colors ${
                    isCinematic || isFocusMode || isDark
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download sample template
                </a>
              )}
              
              {/* Cancel Button */}
              <Button
                variant="ghost"
                className={`w-full justify-start ${getSecondaryTextClass()}`}
                onClick={onCancel}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
