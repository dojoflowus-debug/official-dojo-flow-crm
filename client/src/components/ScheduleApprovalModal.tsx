import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ExtractedClass {
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  instructor?: string;
  location?: string;
  level?: string;
  maxCapacity?: number;
  isDuplicate?: boolean;
  duplicateOf?: number;
}

interface ScheduleApprovalModalProps {
  isOpen: boolean;
  classes: ExtractedClass[];
  fileName?: string;
  onApprove: (selectedClasses: ExtractedClass[]) => Promise<void>;
  onCancel: () => void;
}

export const ScheduleApprovalModal: React.FC<ScheduleApprovalModalProps> = ({
  isOpen,
  classes,
  fileName,
  onApprove,
  onCancel,
}) => {
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(
    new Set(classes.map((_, i) => i))
  );
  const [isApproving, setIsApproving] = useState(false);

  const toggleClass = (index: number) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedClasses(newSelected);
  };

  const toggleAll = () => {
    if (selectedClasses.size === classes.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(classes.map((_, i) => i)));
    }
  };

  const handleApprove = async () => {
    if (selectedClasses.size === 0) {
      toast.error('Please select at least one class to approve');
      return;
    }

    const classesToApprove = Array.from(selectedClasses)
      .sort((a, b) => a - b)
      .map(i => classes[i]);

    setIsApproving(true);
    try {
      await onApprove(classesToApprove);
    } finally {
      setIsApproving(false);
    }
  };

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Group classes by their attributes (name, time, instructor, level, capacity)
  // and combine multiple days into a single class entry
  const groupedClasses = classes.reduce((acc, cls) => {
    // Create a key based on class attributes (excluding day)
    const key = `${cls.name}|${cls.startTime}|${cls.endTime}|${cls.instructor || ''}|${cls.level || ''}|${cls.maxCapacity || ''}`;
    
    const existing = acc.find(item => item.key === key);
    if (existing) {
      // Add day to existing class if not already present
      const daysArray = Array.isArray(existing.class.dayOfWeek)
        ? existing.class.dayOfWeek
        : [existing.class.dayOfWeek];
      
      const newDay = Array.isArray(cls.dayOfWeek) ? cls.dayOfWeek[0] : cls.dayOfWeek;
      if (!daysArray.includes(newDay)) {
        daysArray.push(newDay);
        // Sort days in week order
        daysArray.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        existing.class.dayOfWeek = daysArray;
      }
    } else {
      // Create new grouped class entry
      acc.push({
        key,
        class: {
          ...cls,
          dayOfWeek: Array.isArray(cls.dayOfWeek) ? cls.dayOfWeek : [cls.dayOfWeek]
        }
      });
    }
    return acc;
  }, [] as { key: string; class: ExtractedClass }[]);
  
  // Sort grouped classes
  const sortedClasses = groupedClasses.map(item => item.class).sort((a, b) => {
    const daysA = Array.isArray(a.dayOfWeek) ? a.dayOfWeek : [a.dayOfWeek];
    const daysB = Array.isArray(b.dayOfWeek) ? b.dayOfWeek : [b.dayOfWeek];
    const dayDiff = dayOrder.indexOf(daysA[0]) - dayOrder.indexOf(daysB[0]);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Review & Approve Schedule
          </DialogTitle>
          <DialogDescription className="text-slate-300 mt-2">
            {fileName && <span className="block mb-2">File: <strong>{fileName}</strong></span>}
            Review the extracted classes below. Check or uncheck classes to select which ones to import.
            {selectedClasses.size} of {classes.length} classes selected.
          </DialogDescription>
        </DialogHeader>

        {/* Classes List */}
        <div className="flex-1 overflow-auto border border-slate-600 rounded-lg bg-slate-800/50">
          <div className="p-4 space-y-2">
            {/* Select All */}
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 sticky top-0 z-10">
              <Checkbox
                checked={selectedClasses.size === classes.length && classes.length > 0}
                onCheckedChange={toggleAll}
                className="w-5 h-5"
              />
              <span className="font-semibold text-white flex-1">
                {selectedClasses.size === classes.length && classes.length > 0 ? 'Deselect All' : 'Select All'}
              </span>
              <span className="text-sm text-slate-400">
                {selectedClasses.size} / {classes.length}
              </span>
            </div>

            {/* Grouped Classes */}
            {sortedClasses.map((cls, idx) => {
              const isSelected = selectedClasses.has(idx);
              const daysArray = Array.isArray(cls.dayOfWeek) ? cls.dayOfWeek : [cls.dayOfWeek];
              const daysDisplay = daysArray.join(', ');

              return (
                <div
                  key={idx}
                  onClick={() => toggleClass(idx)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-900/30 border-emerald-500/50'
                      : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleClass(idx)}
                      className="w-5 h-5 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white truncate">{cls.name}</div>
                        {cls.isDuplicate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" />
                            Duplicate
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-300 mt-1 space-y-1">
                        <div>
                          <span className="text-slate-400">Days:</span> {daysDisplay}
                        </div>
                        <div>
                          <span className="text-slate-400">Time:</span> {cls.startTime} - {cls.endTime}
                        </div>
                        {cls.instructor && (
                          <div>
                            <span className="text-slate-400">Instructor:</span> {cls.instructor}
                          </div>
                        )}
                        {cls.level && (
                          <div>
                            <span className="text-slate-400">Level:</span> {cls.level}
                          </div>
                        )}
                        {cls.maxCapacity && (
                          <div>
                            <span className="text-slate-400">Capacity:</span> {cls.maxCapacity}
                          </div>
                        )}
                        {cls.location && (
                          <div>
                            <span className="text-slate-400">Location:</span> {cls.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <div>
            <div className="text-xs text-slate-400">Total Classes</div>
            <div className="text-lg font-bold text-white">{sortedClasses.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Selected</div>
            <div className="text-lg font-bold text-emerald-400">{Array.from(selectedClasses).filter(i => i < sortedClasses.length).length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">With Instructor</div>
            <div className="text-lg font-bold text-blue-400">
              {Array.from(selectedClasses).filter(i => i < sortedClasses.length && sortedClasses[i].instructor).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Avg Capacity</div>
            <div className="text-lg font-bold text-purple-400">
              {selectedClasses.size > 0
                ? Math.round(
                    Array.from(selectedClasses).reduce((sum, i) => sum + (classes[i].maxCapacity || 20), 0) /
                      selectedClasses.size
                  )
                : 0}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isApproving}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={selectedClasses.size === 0 || isApproving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve & Import {selectedClasses.size} Classes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
