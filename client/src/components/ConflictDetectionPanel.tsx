import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ConflictItem {
  id: string;
  type: 'overlapping_class' | 'duplicate_name' | 'invalid_data' | 'belt_rank_mismatch' | 'capacity_invalid';
  severity: 'warning' | 'error';
  message: string;
  affectedRows: number[];
  suggestion?: string;
  resolution?: string;
}

interface ConflictDetectionPanelProps {
  conflicts: ConflictItem[];
  onResolve?: (conflictId: string, resolution: string) => void;
  isLoading?: boolean;
}

export default function ConflictDetectionPanel({
  conflicts,
  onResolve,
  isLoading = false,
}: ConflictDetectionPanelProps) {
  if (conflicts.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          No conflicts detected. Your data looks good!
        </AlertDescription>
      </Alert>
    );
  }

  const errorCount = conflicts.filter((c) => c.severity === 'error').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        {errorCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Conflicts list */}
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className={`p-4 rounded-lg border ${
              conflict.severity === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {conflict.severity === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <h4
                  className={`font-semibold ${
                    conflict.severity === 'error'
                      ? 'text-red-900'
                      : 'text-amber-900'
                  }`}
                >
                  {getConflictTitle(conflict.type)}
                </h4>

                <p
                  className={`text-sm mt-1 ${
                    conflict.severity === 'error'
                      ? 'text-red-800'
                      : 'text-amber-800'
                  }`}
                >
                  {conflict.message}
                </p>

                {conflict.affectedRows.length > 0 && (
                  <p
                    className={`text-xs mt-2 ${
                      conflict.severity === 'error'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    Affected rows: {conflict.affectedRows.join(', ')}
                  </p>
                )}

                {conflict.suggestion && (
                  <p className="text-sm mt-2 p-2 bg-white rounded border border-slate-200">
                    💡 <strong>Suggestion:</strong> {conflict.suggestion}
                  </p>
                )}

                {conflict.severity === 'warning' && onResolve && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onResolve(conflict.id, 'ignore')
                      }
                      disabled={isLoading}
                    >
                      Ignore
                    </Button>
                    {conflict.resolution && (
                      <Button
                        size="sm"
                        onClick={() =>
                          onResolve(conflict.id, conflict.resolution!)
                        }
                        disabled={isLoading}
                      >
                        {conflict.resolution === 'merge' && 'Merge'}
                        {conflict.resolution === 'rename' && 'Rename'}
                        {conflict.resolution === 'skip' && 'Skip'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info message */}
      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please resolve all errors before proceeding. You can fix the data in
            your spreadsheet and re-upload it.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function getConflictTitle(type: ConflictItem['type']): string {
  const titles: Record<ConflictItem['type'], string> = {
    overlapping_class: 'Overlapping Classes',
    duplicate_name: 'Duplicate Name',
    invalid_data: 'Invalid Data',
    belt_rank_mismatch: 'Invalid Belt Rank',
    capacity_invalid: 'Invalid Capacity',
  };
  return titles[type] || 'Conflict Detected';
}
