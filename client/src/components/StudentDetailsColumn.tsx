import React from 'react';
import { X } from 'lucide-react';
import { StudentDetailsPanel } from './StudentDetailsPanel';

interface StudentDetailsColumnProps {
  isOpen: boolean;
  studentId: number | null;
  onClose: () => void;
}

export function StudentDetailsColumn({ isOpen, studentId, onClose }: StudentDetailsColumnProps) {
  if (!isOpen || !studentId) {
    return null;
  }

  return (
    <div className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Student Details</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-slate-800 transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        <StudentDetailsPanel
          isOpen={isOpen}
          studentId={studentId}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
