import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Loader2, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';

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

interface ScheduleReviewScreenProps {
  classes: ExtractedClass[];
  instructors?: Array<{ id: number; name: string }>;
  onImportComplete?: () => void;
  onCancel?: () => void;
}

export const ScheduleReviewScreen: React.FC<ScheduleReviewScreenProps> = ({
  classes: initialClasses,
  instructors = [],
  onImportComplete,
  onCancel,
}) => {
  const [classes, setClasses] = useState<ExtractedClass[]>(initialClasses);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set(classes.map((_, i) => i)));
  const [showConfirm, setShowConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const importMutation = trpc.classes.createClassesFromSchedule.useMutation();

  // Update a class field
  const updateClass = (index: number, field: keyof ExtractedClass, value: any) => {
    const updated = [...classes];
    updated[index] = { ...updated[index], [field]: value };
    setClasses(updated);
  };

  // Toggle row selection
  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedRows.size === classes.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(classes.map((_, i) => i)));
    }
  };

  // Remove a class
  const removeClass = (index: number) => {
    const updated = classes.filter((_, i) => i !== index);
    setClasses(updated);
    
    // Update selected rows
    const newSelected = new Set(selectedRows);
    newSelected.delete(index);
    // Adjust indices for removed rows
    const adjustedSelected = new Set<number>();
    for (const idx of newSelected) {
      if (idx > index) {
        adjustedSelected.add(idx - 1);
      } else {
        adjustedSelected.add(idx);
      }
    }
    setSelectedRows(adjustedSelected);
  };

  // Import selected classes
  const handleImport = async () => {
    if (selectedRows.size === 0) {
      toast.error('Please select at least one class to import');
      return;
    }

    const classesToImport = Array.from(selectedRows)
      .sort((a, b) => a - b)
      .map(i => classes[i]);

    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({
        classes: classesToImport,
      });

      if (result.success) {
        toast.success(`Successfully imported ${result.imported} classes`);
        onImportComplete?.();
      } else {
        toast.error(result.error || 'Failed to import classes');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import classes');
    } finally {
      setIsImporting(false);
      setShowConfirm(false);
    }
  };

  const levelOptions = ['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Kids', 'Teens', 'Adults'];
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Review Extracted Classes
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Edit class details below before importing. {selectedRows.size} of {classes.length} selected.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isImporting}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={selectedRows.size === 0 || isImporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Import {selectedRows.size} Classes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="text-slate-400 text-xs font-medium">Total Classes</div>
            <div className="text-2xl font-bold text-white">{classes.length}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="text-slate-400 text-xs font-medium">Selected</div>
            <div className="text-2xl font-bold text-emerald-400">{selectedRows.size}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="text-slate-400 text-xs font-medium">With Instructor</div>
            <div className="text-2xl font-bold text-blue-400">
              {classes.filter(c => c.instructor).length}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="text-slate-400 text-xs font-medium">Avg Capacity</div>
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(
                classes.reduce((sum, c) => sum + (c.maxCapacity || 20), 0) / classes.length
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-600 bg-slate-800/50">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-700/80 border-b border-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === classes.length && classes.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-500 bg-slate-600 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Class Name</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Day</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Time</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Instructor</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Level</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Capacity</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Location</th>
              <th className="px-4 py-3 text-center text-slate-300 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {classes.map((cls, index) => (
              <tr
                key={index}
                className={`transition-colors ${
                  selectedRows.has(index)
                    ? 'bg-emerald-900/30 hover:bg-emerald-900/50'
                    : 'bg-slate-800/30 hover:bg-slate-700/50'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRow(index)}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-600 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={cls.name}
                    onChange={(e) => updateClass(index, 'name', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    placeholder="Class name"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select value={cls.dayOfWeek} onValueChange={(v) => updateClass(index, 'dayOfWeek', v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {dayOptions.map(day => (
                        <SelectItem key={day} value={day} className="text-white">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Input
                      type="time"
                      value={cls.startTime}
                      onChange={(e) => updateClass(index, 'startTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm w-20"
                    />
                    <span className="text-slate-400 px-1 py-2">-</span>
                    <Input
                      type="time"
                      value={cls.endTime}
                      onChange={(e) => updateClass(index, 'endTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm w-20"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select value={cls.instructor || ''} onValueChange={(v) => updateClass(index, 'instructor', v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="" className="text-white">
                        None
                      </SelectItem>
                      {instructors.map(inst => (
                        <SelectItem key={inst.id} value={inst.name} className="text-white">
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select value={cls.level || 'All Levels'} onValueChange={(v) => updateClass(index, 'level', v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {levelOptions.map(level => (
                        <SelectItem key={level} value={level} className="text-white">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={cls.maxCapacity || 20}
                    onChange={(e) => updateClass(index, 'maxCapacity', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm w-16"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={cls.location || ''}
                    onChange={(e) => updateClass(index, 'location', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    placeholder="e.g., Studio A"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => removeClass(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Remove class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400">No classes to review</p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-slate-800 border-slate-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Import Classes</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              You are about to import {selectedRows.size} classes into your schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={isImporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
