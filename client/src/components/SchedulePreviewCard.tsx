import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  AlertTriangle,
  Plus,
} from 'lucide-react';

export type ExtractedClass = {
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  instructor?: string;
  location?: string;
  level?: string;
  maxCapacity?: number;
  notes?: string;
};

type SchedulePreviewCardProps = {
  classes: ExtractedClass[];
  confidence: number;
  warnings?: string[];
  onConfirm: (classes: ExtractedClass[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
};

// Helper to format time for display
const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Day abbreviations
const dayAbbrev: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export function SchedulePreviewCard({
  classes: initialClasses,
  confidence,
  warnings,
  onConfirm,
  onCancel,
  isProcessing = false,
  isDark = false,
  isCinematic = false,
  isFocusMode = false,
}: SchedulePreviewCardProps) {
  const [classes, setClasses] = useState<ExtractedClass[]>(initialClasses);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  
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
  
  const handleRemoveClass = (index: number) => {
    setClasses(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateClass = (index: number, updates: Partial<ExtractedClass>) => {
    setClasses(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
  };
  
  const confidenceColor = confidence >= 0.7 ? 'text-green-500' : confidence >= 0.4 ? 'text-yellow-500' : 'text-red-500';
  
  return (
    <Card className={`overflow-hidden border ${getBackgroundClass()} transition-all duration-200`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCinematic || isFocusMode || isDark ? 'bg-[#FF4C4C]/20' : 'bg-[#FF4C4C]/10'
          }`}>
            <Calendar className="w-5 h-5 text-[#FF4C4C]" />
          </div>
          <div>
            <p className={`font-medium text-sm ${getTextClass()}`}>
              Schedule Extracted ({classes.length} classes)
            </p>
            <p className={`text-xs ${getSecondaryTextClass()}`}>
              Confidence: <span className={confidenceColor}>{Math.round(confidence * 100)}%</span>
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
          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className={`p-2 rounded-lg flex items-start gap-2 ${
              isCinematic || isFocusMode || isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
            }`}>
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Class List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {classes.map((cls, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  isCinematic || isFocusMode || isDark 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <Input
                      value={cls.name}
                      onChange={(e) => handleUpdateClass(index, { name: e.target.value })}
                      placeholder="Class name"
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <select
                        value={cls.dayOfWeek}
                        onChange={(e) => handleUpdateClass(index, { dayOfWeek: e.target.value })}
                        className={`h-8 px-2 rounded border text-sm flex-1 ${
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200'
                        }`}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <Input
                        type="time"
                        value={cls.startTime}
                        onChange={(e) => handleUpdateClass(index, { startTime: e.target.value })}
                        className="h-8 text-sm w-24"
                      />
                      <span className={`self-center ${getSecondaryTextClass()}`}>-</span>
                      <Input
                        type="time"
                        value={cls.endTime}
                        onChange={(e) => handleUpdateClass(index, { endTime: e.target.value })}
                        className="h-8 text-sm w-24"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${getTextClass()}`}>{cls.name}</p>
                      <div className={`flex items-center gap-3 text-xs ${getSecondaryTextClass()}`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dayAbbrev[cls.dayOfWeek] || cls.dayOfWeek}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </span>
                        {cls.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {cls.instructor}
                          </span>
                        )}
                        {cls.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cls.location}
                          </span>
                        )}
                      </div>
                      {cls.level && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          isCinematic || isFocusMode || isDark 
                            ? 'bg-white/10 text-white/80' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {cls.level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveClass(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {classes.length === 0 && (
            <p className={`text-center py-4 text-sm ${getSecondaryTextClass()}`}>
              No classes to import. Add classes manually or try a different image.
            </p>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
              onClick={() => onConfirm(classes)}
              disabled={isProcessing || classes.length === 0}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Create {classes.length} Classes
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className={
                isCinematic || isFocusMode || isDark
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : ''
              }
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
