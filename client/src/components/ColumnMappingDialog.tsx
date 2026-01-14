import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ColumnDetection {
  columnName: string;
  targetField: string;
  confidence: number;
  dataType: 'text' | 'number' | 'date' | 'enum' | 'boolean';
}

interface ColumnMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mappings: Record<string, string>) => void;
  columns: string[];
  detectedMappings: ColumnDetection[];
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations';
  previewData: Record<string, any>[];
}

export default function ColumnMappingDialog({
  isOpen,
  onClose,
  onConfirm,
  columns,
  detectedMappings,
  importType,
  previewData,
}: ColumnMappingDialogProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    detectedMappings.forEach((m) => {
      initial[m.columnName] = m.targetField;
    });
    return initial;
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleMappingChange = (column: string, targetField: string) => {
    setMappings((prev) => ({
      ...prev,
      [column]: targetField,
    }));
  };

  const handleAutoDetect = () => {
    const newMappings: Record<string, string> = {};
    detectedMappings.forEach((m) => {
      newMappings[m.columnName] = m.targetField;
    });
    setMappings(newMappings);
  };

  const validateMappings = (): boolean => {
    const newErrors: string[] = [];
    const mappedFields = Object.values(mappings).filter(Boolean);
    const uniqueFields = new Set(mappedFields);

    if (uniqueFields.size !== mappedFields.length) {
      newErrors.push('Each target field can only be mapped once');
    }

    const requiredFields: Record<string, string[]> = {
      programs: ['name'],
      classes: ['name', 'program'],
      pricing: ['name', 'price'],
      staff: ['firstName', 'lastName', 'email'],
      locations: ['name', 'address', 'city', 'state', 'zipCode'],
    };

    const required = requiredFields[importType] || [];
    for (const field of required) {
      if (!mappedFields.includes(field)) {
        newErrors.push(`Missing required field: ${field}`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConfirm = () => {
    if (validateMappings()) {
      onConfirm(mappings);
    }
  };

  const getFieldOptions = (): string[] => {
    const options: Record<string, string[]> = {
      programs: [
        'name',
        'type',
        'ageRange',
        'price',
        'maxSize',
        'description',
      ],
      classes: [
        'name',
        'program',
        'dayOfWeek',
        'time',
        'instructor',
        'capacity',
        'level',
        'room',
      ],
      pricing: ['name', 'price', 'billing', 'contractLength', 'description'],
      staff: [
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'specialties',
      ],
      locations: ['name', 'address', 'city', 'state', 'zipCode', 'phone'],
    };
    return options[importType] || [];
  };

  const fieldOptions = getFieldOptions();
  const mappedFields = new Set(Object.values(mappings).filter(Boolean));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Map Your Columns</DialogTitle>
          <DialogDescription>
            Match your spreadsheet columns to the fields we need. We've detected
            some mappings automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-detect button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetect}
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto-Detect
            </Button>
          </div>

          {/* Column mappings */}
          <div className="space-y-4">
            {columns.map((column) => {
              const detection = detectedMappings.find(
                (m) => m.columnName === column
              );
              const currentMapping = mappings[column] || '';
              const confidence = detection?.confidence || 0;

              return (
                <div
                  key={column}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {column}
                    </div>
                    {detection && confidence > 0.7 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Auto-detected
                      </div>
                    )}
                  </div>

                  <div className="w-48">
                    <Select
                      value={currentMapping}
                      onValueChange={(value) =>
                        handleMappingChange(column, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          <span className="text-slate-500">Skip this column</span>
                        </SelectItem>
                        {fieldOptions.map((field) => (
                          <SelectItem
                            key={field}
                            value={field}
                            disabled={
                              mappedFields.has(field) && currentMapping !== field
                            }
                          >
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Preview</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      {Object.keys(mappings)
                        .filter((col) => mappings[col])
                        .map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left font-medium text-slate-900"
                          >
                            {mappings[col]}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        {Object.keys(mappings)
                          .filter((col) => mappings[col])
                          .map((col) => (
                            <td
                              key={col}
                              className="px-4 py-2 text-slate-700"
                            >
                              {row[mappings[col]] || '-'}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 3 && (
                <p className="text-xs text-slate-600 mt-2">
                  Showing 3 of {previewData.length} rows
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={errors.length > 0}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
