import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  User,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  AlertTriangle,
  Shield,
} from 'lucide-react';

export type ExtractedStudent = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  beltRank?: string;
  program?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  membershipStatus?: string;
};

export type StudentDuplicateInfo = {
  importIndex: number;
  existingStudent: { id: number; firstName: string; lastName: string; email: string | null };
  matchType: 'exact' | 'name_only' | 'email_match' | 'phone_match';
};

type RosterPreviewCardProps = {
  students: ExtractedStudent[];
  confidence: number;
  warnings?: string[];
  duplicates?: StudentDuplicateInfo[];
  onConfirm: (students: ExtractedStudent[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isCheckingDuplicates?: boolean;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
};

// Belt rank colors
const beltColors: Record<string, string> = {
  White: '#FFFFFF',
  Yellow: '#FFD700',
  Orange: '#FFA500',
  Green: '#228B22',
  Blue: '#0000FF',
  Purple: '#800080',
  Brown: '#8B4513',
  Red: '#FF0000',
  Black: '#000000',
};

export function RosterPreviewCard({
  students: initialStudents,
  confidence,
  warnings,
  duplicates = [],
  onConfirm,
  onCancel,
  isProcessing = false,
  isCheckingDuplicates = false,
  isDark = false,
  isCinematic = false,
  isFocusMode = false,
}: RosterPreviewCardProps) {
  const [students, setStudents] = useState<ExtractedStudent[]>(initialStudents);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  
  const getBackgroundClass = () => {
    if (isCinematic || isFocusMode) {
      return 'bg-black/40 backdrop-blur-sm border-white/20';
    }
    if (isDark) {
      return 'bg-[#1a1a1a] border-white/10';
    }
    return 'bg-white border-slate-200';
  };
  
  const getTextClass = () => {
    if (isCinematic || isFocusMode || isDark) {
      return 'text-white';
    }
    return 'text-slate-900';
  };
  
  const getSecondaryTextClass = () => {
    if (isCinematic || isFocusMode || isDark) {
      return 'text-white/70';
    }
    return 'text-slate-500';
  };
  
  const handleRemoveStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateStudent = (index: number, updates: Partial<ExtractedStudent>) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };
  
  const confidenceColor = confidence >= 0.7 ? 'text-green-500' : confidence >= 0.4 ? 'text-yellow-500' : 'text-red-500';
  
  return (
    <Card className={`overflow-hidden border ${getBackgroundClass()} transition-all duration-200`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCinematic || isFocusMode || isDark ? 'bg-[#FF4C4C]/20' : 'bg-[#FF4C4C]/10'
          }`}>
            <Users className="w-5 h-5 text-[#FF4C4C]" />
          </div>
          <div>
            <p className={`font-medium text-sm ${getTextClass()}`}>
              Roster Extracted ({students.length} students)
            </p>
            <p className={`text-xs ${getSecondaryTextClass()}`}>
              Confidence: <span className={confidenceColor}>{Math.round(confidence * 100)}%</span>
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className={`p-2 rounded-lg flex items-start gap-2 ${
              isCinematic || isFocusMode || isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
            }`}>
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Duplicate Warnings */}
          {duplicates.length > 0 && (
            <div className={`p-3 rounded-lg border ${
              isCinematic || isFocusMode || isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className={`text-sm font-medium ${
                  isCinematic || isFocusMode || isDark ? 'text-orange-400' : 'text-orange-700'
                }`}>
                  {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} found
                </span>
              </div>
              <div className="space-y-1">
                {duplicates.map((dup, i) => {
                  const student = students[dup.importIndex];
                  if (!student) return null;
                  const matchLabel = dup.matchType === 'exact' ? 'Exact match' 
                    : dup.matchType === 'name_only' ? 'Same name' 
                    : dup.matchType === 'email_match' ? 'Same email'
                    : 'Same phone';
                  return (
                    <div key={i} className={`text-xs ${
                      isCinematic || isFocusMode || isDark ? 'text-orange-300' : 'text-orange-600'
                    }`}>
                      <span className="font-medium">{student.firstName} {student.lastName}</span>
                      {student.email && <span className="ml-1">({student.email})</span>}
                      <span className="mx-1">→</span>
                      <span className="italic">{matchLabel}</span> with existing "{dup.existingStudent.firstName} {dup.existingStudent.lastName}"
                      {dup.existingStudent.email && <span className="ml-1">({dup.existingStudent.email})</span>}
                    </div>
                  );
                })}
              </div>
              <p className={`text-xs mt-2 ${
                isCinematic || isFocusMode || isDark ? 'text-orange-400/70' : 'text-orange-500'
              }`}>
                You can remove duplicates above before importing, or import anyway.
              </p>
            </div>
          )}
          
          {/* Checking duplicates indicator */}
          {isCheckingDuplicates && (
            <div className={`p-2 rounded-lg flex items-center gap-2 ${
              isCinematic || isFocusMode || isDark ? 'bg-blue-500/10' : 'bg-blue-50'
            }`}>
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className={`text-xs ${
                isCinematic || isFocusMode || isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>Checking for duplicate students...</span>
            </div>
          )}
          
          {/* Student List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {students.map((student, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  isCinematic || isFocusMode || isDark 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={student.firstName}
                        onChange={(e) => handleUpdateStudent(index, { firstName: e.target.value })}
                        placeholder="First name"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={student.lastName}
                        onChange={(e) => handleUpdateStudent(index, { lastName: e.target.value })}
                        placeholder="Last name"
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={student.email || ''}
                        onChange={(e) => handleUpdateStudent(index, { email: e.target.value })}
                        placeholder="Email"
                        type="email"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={student.phone || ''}
                        onChange={(e) => handleUpdateStudent(index, { phone: e.target.value })}
                        placeholder="Phone"
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={student.beltRank || 'White'}
                        onChange={(e) => handleUpdateStudent(index, { beltRank: e.target.value })}
                        className={`h-8 px-2 rounded border text-sm flex-1 ${
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200'
                        }`}
                      >
                        {['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black'].map(belt => (
                          <option key={belt} value={belt}>{belt}</option>
                        ))}
                      </select>
                      <select
                        value={student.program || 'Adults'}
                        onChange={(e) => handleUpdateStudent(index, { program: e.target.value })}
                        className={`h-8 px-2 rounded border text-sm flex-1 ${
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200'
                        }`}
                      >
                        {['Kids', 'Teens', 'Adults', 'Family', 'Competition'].map(prog => (
                          <option key={prog} value={prog}>{prog}</option>
                        ))}
                      </select>
                    </div>
                    {/* Guardian fields */}
                    <div className="flex gap-2">
                      <Input
                        value={student.guardianName || ''}
                        onChange={(e) => handleUpdateStudent(index, { guardianName: e.target.value })}
                        placeholder="Guardian name"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={student.guardianPhone || ''}
                        onChange={(e) => handleUpdateStudent(index, { guardianPhone: e.target.value })}
                        placeholder="Guardian phone"
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${getTextClass()}`}>
                          {student.firstName} {student.lastName}
                        </p>
                        {student.beltRank && (
                          <span 
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: beltColors[student.beltRank] || '#CCCCCC' }}
                            title={`${student.beltRank} Belt`}
                          />
                        )}
                      </div>
                      <div className={`flex flex-wrap items-center gap-3 text-xs ${getSecondaryTextClass()}`}>
                        {student.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </span>
                        )}
                        {student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {student.phone}
                          </span>
                        )}
                        {student.dateOfBirth && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {student.dateOfBirth}
                          </span>
                        )}
                        {student.guardianName && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {student.guardianName}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {student.program && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isCinematic || isFocusMode || isDark 
                              ? 'bg-white/10 text-white/80' 
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {student.program}
                          </span>
                        )}
                        {student.beltRank && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isCinematic || isFocusMode || isDark 
                              ? 'bg-white/10 text-white/80' 
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {student.beltRank} Belt
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveStudent(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {students.length === 0 && (
            <p className={`text-center py-4 text-sm ${getSecondaryTextClass()}`}>
              No students to import. Add students manually or try a different file.
            </p>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
              onClick={() => onConfirm(students)}
              disabled={isProcessing || students.length === 0}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Add {students.length} Students
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
        </div>
      )}
    </Card>
  );
}
