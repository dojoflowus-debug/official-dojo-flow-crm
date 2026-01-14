import React, { useState } from 'react';
import { Trash2, RotateCcw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

export interface ImportRecord {
  id: number;
  filename: string;
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRows: number;
  processedRows: number;
  createdAt: string;
  errorMessage?: string;
}

interface ImportHistoryPanelProps {
  imports: ImportRecord[];
  onUndo?: (importId: number) => Promise<void>;
  isLoading?: boolean;
}

export default function ImportHistoryPanel({
  imports,
  onUndo,
  isLoading = false,
}: ImportHistoryPanelProps) {
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);

  const handleUndoClick = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setShowUndoConfirm(true);
  };

  const handleConfirmUndo = async () => {
    if (!selectedImport || !onUndo) return;

    setUndoLoading(true);
    try {
      await onUndo(selectedImport.id);
      setShowUndoConfirm(false);
      setSelectedImport(null);
    } finally {
      setUndoLoading(false);
    }
  };

  const getStatusIcon = (status: ImportRecord['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusLabel = (status: ImportRecord['status']): string => {
    const labels: Record<ImportRecord['status'], string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: ImportRecord['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50';
      case 'failed':
      case 'cancelled':
        return 'text-red-700 bg-red-50';
      case 'processing':
      case 'pending':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-slate-700 bg-slate-50';
    }
  };

  const getTypeLabel = (type: ImportRecord['importType']): string => {
    const labels: Record<ImportRecord['importType'], string> = {
      programs: 'Programs',
      classes: 'Classes',
      pricing: 'Pricing Plans',
      staff: 'Staff',
      locations: 'Locations',
    };
    return labels[type] || type;
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No imports yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {imports.map((importRecord) => (
          <div
            key={importRecord.id}
            className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(importRecord.status)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900 truncate">
                  {importRecord.filename}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    importRecord.status
                  )}`}
                >
                  {getStatusLabel(importRecord.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                <span>{getTypeLabel(importRecord.importType)}</span>
                <span>
                  {importRecord.processedRows}/{importRecord.totalRows} rows
                </span>
                <span>
                  {formatDistanceToNow(new Date(importRecord.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {importRecord.errorMessage && (
                <p className="text-xs text-red-600 mt-2">
                  Error: {importRecord.errorMessage}
                </p>
              )}
            </div>

            {/* Actions */}
            {importRecord.status === 'completed' && onUndo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUndoClick(importRecord)}
                disabled={isLoading || undoLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}

            {importRecord.status === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                disabled
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Failed
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Undo confirmation dialog */}
      <Dialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Import?</DialogTitle>
            <DialogDescription>
              This will remove all data from the "{selectedImport?.filename}"
              import. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Warning:</strong> This will delete{' '}
              {selectedImport?.processedRows} imported records.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUndoConfirm(false)}
              disabled={undoLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUndo}
              disabled={undoLoading}
            >
              {undoLoading ? 'Undoing...' : 'Undo Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
