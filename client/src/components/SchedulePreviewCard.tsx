import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Users, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export interface ExtractedClass {
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  instructor?: string;
  location?: string;
  level?: string;
  maxCapacity?: number;
  notes?: string;
}

interface SchedulePreviewCardProps {
  classes: ExtractedClass[];
  fileName: string;
  confidence: number;
  warnings?: string[];
  onConfirm: (selectedClasses: ExtractedClass[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
}

// Helper to format 24-hour time to 12-hour
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Helper to get day abbreviation
function getDayAbbreviation(day: string): string {
  const abbrevs: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };
  return abbrevs[day] || day.slice(0, 3);
}

// Group classes by name for display
function groupClassesByName(classes: ExtractedClass[]): Map<string, ExtractedClass[]> {
  const grouped = new Map<string, ExtractedClass[]>();
  for (const cls of classes) {
    const existing = grouped.get(cls.name) || [];
    existing.push(cls);
    grouped.set(cls.name, existing);
  }
  return grouped;
}

export function SchedulePreviewCard({
  classes,
  fileName,
  confidence,
  warnings,
  onConfirm,
  onCancel,
  isProcessing = false,
  isDark = false,
  isCinematic = false,
  isFocusMode = false,
}: SchedulePreviewCardProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(classes.map((_, i) => i))
  );
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleClass = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(classes.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleConfirm = () => {
    const selectedClasses = classes.filter((_, i) => selectedIndices.has(i));
    console.log('[SchedulePreviewCard] handleConfirm called with', selectedClasses.length, 'classes');
    console.log('[SchedulePreviewCard] First class:', JSON.stringify(selectedClasses[0]));
    onConfirm(selectedClasses);
  };

  const groupedClasses = groupClassesByName(classes);
  const confidencePercent = Math.round(confidence * 100);

  const cardBg = isCinematic || isFocusMode 
    ? 'bg-black/40 backdrop-blur-xl border-white/20' 
    : isDark 
      ? 'bg-slate-800/90 border-slate-700' 
      : 'bg-white border-slate-200';

  const textColor = isCinematic || isFocusMode || isDark ? 'text-white' : 'text-slate-900';
  const mutedColor = isCinematic || isFocusMode || isDark ? 'text-white/70' : 'text-slate-500';

  return (
    <Card className={`${cardBg} border shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className={`font-semibold ${textColor}`}>Schedule Import Preview</h3>
              <p className={`text-sm ${mutedColor}`}>{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={confidencePercent >= 80 ? 'border-emerald-500 text-emerald-500' : confidencePercent >= 50 ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500'}
            >
              {confidencePercent}% confidence
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={mutedColor}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-500">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class List */}
      {isExpanded && (
        <div className="p-4">
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm ${mutedColor}`}>
              {selectedIndices.size} of {classes.length} classes selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className={mutedColor}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className={mutedColor}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Classes */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {classes.map((cls, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedIndices.has(index)
                      ? isCinematic || isFocusMode
                        ? 'bg-white/10 border-white/30'
                        : isDark
                          ? 'bg-slate-700/50 border-slate-600'
                          : 'bg-slate-50 border-slate-300'
                      : isCinematic || isFocusMode
                        ? 'bg-white/5 border-white/10 opacity-50'
                        : isDark
                          ? 'bg-slate-800/30 border-slate-700 opacity-50'
                          : 'bg-white border-slate-200 opacity-50'
                  }`}
                  onClick={() => toggleClass(index)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIndices.has(index)}
                      onCheckedChange={() => toggleClass(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${textColor}`}>{cls.name}</span>
                        {cls.level && (
                          <Badge variant="secondary" className="text-xs">
                            {cls.level}
                          </Badge>
                        )}
                      </div>
                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm ${mutedColor}`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {getDayAbbreviation(cls.dayOfWeek)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime12Hour(cls.startTime)} - {formatTime12Hour(cls.endTime)}
                        </span>
                        {cls.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {cls.instructor}
                          </span>
                        )}
                        {cls.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {cls.location}
                          </span>
                        )}
                        {cls.maxCapacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {cls.maxCapacity} max
                          </span>
                        )}
                      </div>
                      {cls.notes && (
                        <p className={`text-xs mt-1 ${mutedColor}`}>{cls.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

        </div>
      )}

      {/* Action Buttons - Outside ScrollArea for better click handling */}
      {isExpanded && (
        <div className="flex gap-2 p-4 border-t border-inherit relative z-50" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              className="flex-1 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[SchedulePreviewCard] Button clicked!');
                handleConfirm();
              }}
              disabled={isProcessing || selectedIndices.size === 0}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Create {selectedIndices.size} Classes
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
      )}
    </Card>
  );
}
