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
  const sortedClasses = [...classes].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
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

            {/* Classes by Day */}
            {dayOrder.map(day => {
              const dayClasses = sortedClasses.filter(c => c.dayOfWeek === day);
              if (dayClasses.length === 0) return null;

              return (
                <div key={day} className="space-y-2">
                  <div className="text-sm font-semibold text-slate-300 px-3 py-2 bg-slate-700/30 rounded">
                    {day}
                  </div>
                  <div className="space-y-2 pl-4">
                    {dayClasses.map((cls, idx) => {
                      const globalIdx = classes.indexOf(cls);
                      const isSelected = selectedClasses.has(globalIdx);

                      return (
                        <div
                          key={globalIdx}
                          onClick={() => toggleClass(globalIdx)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-900/30 border-emerald-500/50'
                              : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleClass(globalIdx)}
                              className="w-5 h-5 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{cls.name}</div>
                              <div className="text-sm text-slate-300 mt-1 space-y-1">
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
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <div>
            <div className="text-xs text-slate-400">Total Classes</div>
            <div className="text-lg font-bold text-white">{classes.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Selected</div>
            <div className="text-lg font-bold text-emerald-400">{selectedClasses.size}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">With Instructor</div>
            <div className="text-lg font-bold text-blue-400">
              {Array.from(selectedClasses).filter(i => classes[i].instructor).length}
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
