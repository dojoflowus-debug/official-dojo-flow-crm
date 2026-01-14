import React from 'react';
import { X } from 'lucide-react';
import { StudentEditForm } from '@/components/StudentEditForm';
import { cn } from '@/lib/utils';

interface StudentEditDrawerProps {
  studentId: number;
  studentData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    program?: string;
    beltRank?: string;
    status?: string;
    photoUrl?: string | null;
    address?: string;
    dateOfBirth?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedData: any) => void;
}

export function StudentEditDrawer({
  studentId,
  studentData,
  isOpen,
  onClose,
  onSave,
}: StudentEditDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 light:bg-black/30 pointer-events-auto"
        onClick={onClose}
        role="presentation"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Edit Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors duration-200"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <StudentEditForm
            studentId={studentId}
            initialData={studentData || {}}
            onClose={onClose}
            onSave={onSave}
          />
        </div>
      </div>
    </>
  );
}
