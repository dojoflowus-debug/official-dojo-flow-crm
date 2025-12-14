import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Check, 
  X, 
  Eye, 
  FileText,
  ChevronDown,
  ChevronUp,
  Import,
  Save,
  AlertCircle
} from 'lucide-react';
import type { DetectedStructuredData, DetectedDataType } from '@/lib/structuredDataDetection';

interface PastedDataCardProps {
  data: DetectedStructuredData;
  onImport: (data: DetectedStructuredData) => void;
  onReview: (data: DetectedStructuredData) => void;
  onSaveDraft: (data: DetectedStructuredData) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
}

const TYPE_CONFIG: Record<DetectedDataType, {
  icon: typeof Users;
  label: string;
  color: string;
  importLabel: string;
}> = {
  student_roster: {
    icon: Users,
    label: 'Student Roster',
    color: 'bg-blue-500',
    importLabel: 'Import Students'
  },
  class_schedule: {
    icon: Calendar,
    label: 'Class Schedule',
    color: 'bg-green-500',
    importLabel: 'Import Classes'
  },
  lead_list: {
    icon: UserPlus,
    label: 'Lead List',
    color: 'bg-purple-500',
    importLabel: 'Import Leads'
  },
  unknown: {
    icon: FileText,
    label: 'Structured Data',
    color: 'bg-gray-500',
    importLabel: 'Import Data'
  }
};

export function PastedDataCard({
  data,
  onImport,
  onReview,
  onSaveDraft,
  onCancel,
  isProcessing = false,
  isDark = true,
  isCinematic = false,
  isFocusMode = false
}: PastedDataCardProps) {
  const [showPreview, setShowPreview] = useState(true);
  const config = TYPE_CONFIG[data.type];
  const Icon = config.icon;
  
  // Limit preview to first 5 rows
  const previewRows = data.rows.slice(0, 5);
  const hasMoreRows = data.rows.length > 5;
  
  // Get background style based on mode
  const getCardStyle = () => {
    if (isCinematic) {
      return {
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      };
    }
    if (isFocusMode) {
      return isDark 
        ? { background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }
        : { background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0, 0, 0, 0.1)' };
    }
    return isDark 
      ? { background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)' }
      : { background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.1)' };
  };
  
  const textColor = (isCinematic || (isFocusMode && isDark) || isDark) ? 'text-white' : 'text-gray-900';
  const mutedColor = (isCinematic || (isFocusMode && isDark) || isDark) ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <Card className="w-full max-w-2xl shadow-lg" style={getCardStyle()}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className={`text-lg ${textColor}`}>
                {config.label} Detected
              </CardTitle>
              <p className={`text-sm ${mutedColor}`}>
                {data.rows.length} {data.rows.length === 1 ? 'entry' : 'entries'} found
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${data.confidence >= 0.7 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}
          >
            {Math.round(data.confidence * 100)}% confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className={`w-full justify-between ${mutedColor}`}
        >
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview Data
          </span>
          {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {/* Data Preview Table */}
        {showPreview && (
          <ScrollArea className="max-h-64 rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  {data.headers.slice(0, 5).map((header, idx) => (
                    <TableHead key={idx} className={`${textColor} font-medium`}>
                      {header}
                    </TableHead>
                  ))}
                  {data.headers.length > 5 && (
                    <TableHead className={mutedColor}>+{data.headers.length - 5} more</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, rowIdx) => (
                  <TableRow key={rowIdx} className="border-white/10">
                    {data.headers.slice(0, 5).map((header, colIdx) => (
                      <TableCell key={colIdx} className={mutedColor}>
                        {row[header] || '-'}
                      </TableCell>
                    ))}
                    {data.headers.length > 5 && (
                      <TableCell className={mutedColor}>...</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMoreRows && (
              <div className={`text-center py-2 text-sm ${mutedColor}`}>
                + {data.rows.length - 5} more rows
              </div>
            )}
          </ScrollArea>
        )}
        
        {/* Low confidence warning */}
        {data.confidence < 0.7 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-500">
              Some columns may not be mapped correctly. Review before importing.
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={() => onImport(data)}
            disabled={isProcessing}
            className="flex-1 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Import className="w-4 h-4 mr-2" />
                {config.importLabel}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onReview(data)}
            disabled={isProcessing}
            className={`${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300'}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Review First
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onSaveDraft(data)}
            disabled={isProcessing}
            className={`${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300'}`}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
            className={mutedColor}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
