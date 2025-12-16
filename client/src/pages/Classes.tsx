import { useState, useEffect, useMemo } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Clock, Users, User, MapPin, Edit, Trash2, LayoutGrid, Eye, CheckCircle, DollarSign, ChevronDown, ChevronUp, AlertCircle, GraduationCap, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FloorPlanManager from '../components/FloorPlanManagerNew';
import { trpc } from '@/lib/trpc';

const API_URL = '/api';  // Use relative path to work from any device

// Dark mode hook wrapper
const useDarkMode = () => {
  const { theme } = useTheme()
  return theme === 'dark' || theme === 'cinematic'
}

// Day selector chips - compact Apple-style
const DayChip = ({ day, selected, onClick, isDark }: { day: string; selected: boolean; onClick: () => void; isDark: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-150 ${
      selected
        ? 'bg-primary text-primary-foreground shadow-sm scale-105'
        : isDark
          ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
    }`}
  >
    {day}
  </button>
);

// Helper functions for formatting
const formatTimeDisplay = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDaysDisplay = (days: string[]) => {
  if (days.length === 0) return '';
  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} & ${days[1]}`;
  return days.slice(0, -1).join(', ') + ' & ' + days[days.length - 1];
};

// Landscape Preview Card - Shows on right side of modal (desktop/tablet)
const LandscapePreviewCard = ({ formData, programs, instructors, isDark }: { 
  formData: any; 
  programs: any[]; 
  instructors: { id: number; name: string; fullName: string; role: string; photoUrl: string | null; email: string | null; }[];
  isDark: boolean 
}) => {
  const className = formData.name || 
    (formData.program && formData.level && formData.level !== 'All Levels' ? `${formData.program} ${formData.level}` : formData.program) || 
    'New Class';
  const hasSchedule = formData.days.length > 0 && formData.startTime && formData.endTime;
  const scheduleLine = hasSchedule 
    ? `${formatDaysDisplay(formData.days)} • ${formatTimeDisplay(formData.startTime)}–${formatTimeDisplay(formData.endTime)}`
    : null;
  const isComplete = formData.program && formData.days.length > 0 && formData.startTime && formData.endTime;
  
  // Get selected instructor details
  const selectedInstructor = formData.instructorId 
    ? instructors.find(i => i.id === formData.instructorId) 
    : null;

  // Preview row component
  const PreviewRow = ({ icon: Icon, label, value, customContent }: { icon: any; label: string; value?: string | null; customContent?: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className={`w-4 h-4 flex-shrink-0 ${!value && !customContent ? (isDark ? 'text-white/20' : 'text-gray-300') : (isDark ? 'text-white/40' : 'text-gray-400')}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{label}</span>
        {customContent || (
          <p className={`text-sm font-medium truncate -mt-0.5 ${!value ? (isDark ? 'text-white/20' : 'text-gray-300') : (isDark ? 'text-white' : 'text-gray-900')}`}>
            {value || '—'}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl p-5 h-full transition-all duration-300 ${
      isDark 
        ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]' 
        : 'bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-sm'
    }`}>
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className={`text-[11px] font-medium uppercase tracking-wide ${isComplete ? 'text-green-500' : 'text-amber-500'}`}>
            {isComplete ? 'Ready to create' : 'Complete the form'}
          </span>
        </div>
        <h3 className={`text-xl font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {className}
        </h3>
        {scheduleLine && (
          <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            {scheduleLine}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="space-y-0">
        <PreviewRow icon={Calendar} label="Schedule" value={scheduleLine} />
        <PreviewRow 
          icon={User} 
          label="Instructor" 
          customContent={
            selectedInstructor ? (
              <div className="flex items-center gap-2 -mt-0.5">
                {selectedInstructor.photoUrl ? (
                  <img 
                    src={selectedInstructor.photoUrl} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDark ? 'bg-primary/30 text-primary' : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedInstructor.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedInstructor.name}
                </span>
              </div>
            ) : (
              <p className={`text-sm font-medium -mt-0.5 ${isDark ? 'text-white/20' : 'text-gray-300'}`}>
                Not assigned
              </p>
            )
          }
        />
        <PreviewRow icon={MapPin} label="Room" value={formData.room} />
        <PreviewRow icon={Users} label="Capacity" value={formData.capacity ? `${formData.capacity} students` : null} />
        <PreviewRow icon={GraduationCap} label="Level" value={formData.level || 'All Levels'} />
        {(formData.ageMin || formData.ageMax) && (
          <PreviewRow 
            icon={Users} 
            label="Ages" 
            value={formData.ageMin && formData.ageMax 
              ? `${formData.ageMin}–${formData.ageMax} years`
              : formData.ageMin ? `${formData.ageMin}+ years` : `Up to ${formData.ageMax} years`
            } 
          />
        )}
      </div>
    </div>
  );
};

// Mobile Summary Chip - Shows on mobile instead of full preview
const MobileSummaryChip = ({ formData, isDark }: { formData: any; isDark: boolean }) => {
  const className = formData.program || 'New Class';
  const hasSchedule = formData.days.length > 0 && formData.startTime && formData.endTime;
  const isComplete = formData.program && formData.days.length > 0 && formData.startTime && formData.endTime;

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
      isComplete
        ? isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
        : isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isComplete ? 'bg-green-500/20' : isDark ? 'bg-white/10' : 'bg-gray-200'
      }`}>
        <Calendar className={`w-4 h-4 ${isComplete ? 'text-green-500' : isDark ? 'text-white/40' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {className}
        </p>
        <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          {hasSchedule 
            ? `${formatDaysDisplay(formData.days)} • ${formatTimeDisplay(formData.startTime)}–${formatTimeDisplay(formData.endTime)}`
            : 'Select days and times'
          }
        </p>
      </div>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`} />
    </div>
  );
};

// Helper to check if two time ranges overlap
const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  if (!start1 || !end1 || !start2 || !end2) return false;
  // Convert to minutes for comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// Helper to check if days overlap
const daysOverlap = (days1: string[], days2: string[]): boolean => {
  return days1.some(d => days2.includes(d));
};

const ClassForm = ({ 
  formData, 
  handleInputChange, 
  handleSelectChange, 
  handleDayToggle,
  instructors, 
  programs,
  existingClasses,
  editingClassId,
  onProgramChange,
  onSubmit, 
  submitText, 
  onCancel,
  showAdvanced,
  setShowAdvanced,
  timeError,
  isDark
}: {
  formData: any;
  handleInputChange: (e: any) => void;
  handleSelectChange: (field: string, value: string) => void;
  handleDayToggle: (day: string) => void;
  instructors: any[];
  programs: any[];
  existingClasses: any[];
  editingClassId?: number | null;
  onProgramChange: (programId: string) => void;
  onSubmit: (e: any) => void;
  submitText: string;
  onCancel: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  timeError: string;
  isDark: boolean;
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [showAgeRules, setShowAgeRules] = useState(false);
  
  // Check for instructor conflicts - now uses instructorId for more reliable matching
  const instructorConflict = useMemo(() => {
    // Check using instructorId if available, otherwise fall back to instructor name
    const hasInstructor = formData.instructorId || formData.instructor;
    if (!hasInstructor || !formData.startTime || !formData.endTime || formData.days.length === 0) {
      return null;
    }
    
    // Find conflicting classes
    const conflicts = existingClasses.filter(cls => {
      // Skip the class being edited
      if (editingClassId && cls.id === editingClassId) return false;
      
      // Check if same instructor - prefer instructorId matching, fall back to name
      let sameInstructor = false;
      if (formData.instructorId && cls.instructorId) {
        sameInstructor = cls.instructorId === formData.instructorId;
      } else if (formData.instructor && cls.instructor) {
        sameInstructor = cls.instructor === formData.instructor;
      }
      if (!sameInstructor) return false;
      
      // Parse class days from schedule (e.g., "Mon, Wed" or "Mon/Wed")
      const classDays = cls.schedule ? cls.schedule.split(/[,\/]/).map((d: string) => d.trim()) : [];
      // Check if days overlap
      if (!daysOverlap(formData.days, classDays)) return false;
      // Parse class times (e.g., "4:30 PM - 5:15 PM" or stored as startTime/endTime)
      const classStart = cls.startTime || '';
      const classEnd = cls.endTime || '';
      // Check if times overlap
      return timeRangesOverlap(formData.startTime, formData.endTime, classStart, classEnd);
    });
    
    if (conflicts.length === 0) return null;
    
    // Format conflict message
    const conflict = conflicts[0];
    const conflictDays = conflict.schedule || '';
    const conflictTime = conflict.time || `${conflict.startTime} - ${conflict.endTime}`;
    
    // Get instructor name for display
    const instructorName = formData.instructor || 
      instructors.find(i => i.id === formData.instructorId)?.name || 
      'This instructor';
    
    return {
      className: conflict.name || conflict.type || 'Another class',
      schedule: `${conflictDays} ${conflictTime}`.trim(),
      instructorName
    };
  }, [formData.instructorId, formData.instructor, formData.days, formData.startTime, formData.endTime, existingClasses, editingClassId, instructors]);
  
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Mobile Summary Chip - Only visible on mobile */}
      <div className="md:hidden">
        <MobileSummaryChip formData={formData} isDark={isDark} />
      </div>

      {/* Row 1: Program & Instructor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="program" className="text-xs font-medium mb-1.5 block">Program</Label>
          <Select value={formData.program} onValueChange={(value) => onProgramChange(value)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.length === 0 ? (
                <SelectItem value="__no_programs__" disabled>No programs yet</SelectItem>
              ) : (
                programs.map((program) => (
                  <SelectItem key={program.id} value={program.name}>
                    {program.name} {program.price ? `($${(program.price / 100).toFixed(0)}/mo)` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="instructor" className="text-xs font-medium mb-1.5 block">Instructor</Label>
          <Select 
            value={formData.instructorId?.toString() || ''} 
            onValueChange={(value) => {
              const id = parseInt(value);
              const instructor = instructors.find(i => i.id === id);
              handleSelectChange('instructorId', value);
              handleSelectChange('instructor', instructor?.name || '');
            }}
          >
            <SelectTrigger className={`h-10 ${instructorConflict ? 'border-amber-500' : ''}`}>
              <SelectValue placeholder="Select instructor">
                {formData.instructorId && instructors.find(i => i.id === formData.instructorId) && (
                  <div className="flex items-center gap-2">
                    {instructors.find(i => i.id === formData.instructorId)?.photoUrl ? (
                      <img 
                        src={instructors.find(i => i.id === formData.instructorId)?.photoUrl || ''} 
                        alt="" 
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        isDark ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {instructors.find(i => i.id === formData.instructorId)?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span>{instructors.find(i => i.id === formData.instructorId)?.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {instructors.length === 0 ? (
                <SelectItem value="__no_instructors__" disabled>No instructors available</SelectItem>
              ) : (
                instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    <div className="flex items-center gap-2">
                      {instructor.photoUrl ? (
                        <img src={instructor.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          isDark ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {instructor.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span>{instructor.name}</span>
                      <span className="text-xs text-muted-foreground">({instructor.role})</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Instructor Conflict Warning */}
      {instructorConflict && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
          isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Schedule conflict
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              {instructorConflict.instructorName} is already teaching {instructorConflict.className} ({instructorConflict.schedule})
            </p>
          </div>
        </div>
      )}

      {/* Row 2: Level & Room */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="level" className="text-xs font-medium mb-1.5 block">Level</Label>
          <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="All Levels">All Levels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="room" className="text-xs font-medium mb-1.5 block">Room / Mat</Label>
          <Input
            id="room"
            name="room"
            value={formData.room}
            onChange={handleInputChange}
            placeholder="Mat A"
            className="h-10"
          />
        </div>
      </div>

      {/* Days - Prominent */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Days</Label>
        <div className="flex gap-1.5 justify-between">
          {days.map((day) => (
            <DayChip
              key={day}
              day={day}
              selected={formData.days.includes(day)}
              onClick={() => handleDayToggle(day)}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      {/* Row 3: Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startTime" className="text-xs font-medium mb-1.5 block">Start</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleInputChange}
            className="h-10"
            required
          />
        </div>

        <div>
          <Label htmlFor="endTime" className="text-xs font-medium mb-1.5 block">End</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleInputChange}
            className="h-10"
            required
          />
        </div>
      </div>
      
      {timeError && (
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {timeError}
        </div>
      )}

      {/* Capacity - Always visible */}
      <div>
        <Label htmlFor="capacity" className="text-xs font-medium mb-1.5 block">Capacity</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleInputChange}
          placeholder="15"
          className="h-10 w-24"
          required
        />
      </div>

      {/* Age Rules - Collapsible */}
      <div>
        <button
          type="button"
          onClick={() => setShowAgeRules(!showAgeRules)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {showAgeRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Age restrictions
        </button>
        
        {showAgeRules && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label htmlFor="ageMin" className="text-xs font-medium mb-1.5 block">Min Age</Label>
              <Input
                id="ageMin"
                name="ageMin"
                type="number"
                value={formData.ageMin}
                onChange={handleInputChange}
                placeholder="5"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="ageMax" className="text-xs font-medium mb-1.5 block">Max Age</Label>
              <Input
                id="ageMax"
                name="ageMax"
                type="number"
                value={formData.ageMax}
                onChange={handleInputChange}
                placeholder="12"
                className="h-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Options - Collapsed */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          More options
        </button>
        
        {showAdvanced && (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="name" className="text-xs font-medium mb-1.5 block">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Custom name for schedule"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="monthlyCost" className="text-xs font-medium mb-1.5 block">Price Override</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>$</span>
                <Input
                  id="monthlyCost"
                  name="monthlyCost"
                  type="number"
                  step="0.01"
                  value={formData.monthlyCost}
                  onChange={handleInputChange}
                  placeholder="Use program price"
                  className="h-10 w-32"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs font-medium mb-1.5 block">Notes</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Internal notes..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-9 px-4">
          Cancel
        </Button>
        <Button type="submit" disabled={formData.days.length === 0 || !formData.program} className="h-9 px-5">
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default function Classes({ onLogout, theme, toggleTheme }) {
  const isDarkMode = useDarkMode()
  const [classes, setClasses] = useState([]);
  
  // Fetch programs from database
  const { data: programs = [] } = trpc.programs.list.useQuery();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    avgClassSize: 0,
    activeInstructors: 0
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'dayOfWeek'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [instructors, setInstructors] = useState<{
    id: number;
    name: string;
    fullName: string;
    role: string;
    photoUrl: string | null;
    email: string | null;
  }[]>([]);
  
  // Floor plan modal state
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [selectedClassForFloorPlan, setSelectedClassForFloorPlan] = useState(null);
  
  // Enrollment modal state
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // Success confirmation modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdClass, setCreatedClass] = useState<{
    id?: number;
    name: string;
    type: string;
    level: string;
    instructor: string;
    schedule: string;
    time: string;
    capacity: string;
    ageMin: string;
    ageMax: string;
    monthlyCost: string;
    description: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    program: '',
    level: '',
    instructor: '',
    instructorId: null as number | null,
    days: [] as string[],
    startTime: '',
    endTime: '',
    room: '',
    capacity: '',
    ageMin: '',
    ageMax: '',
    monthlyCost: '',
    description: ''
  });
  
  // Advanced section collapsed state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Time validation error
  const [timeError, setTimeError] = useState('');
  
  // Handle program selection - auto-fill pricing from program defaults
  const handleProgramChange = (programName: string) => {
    setFormData(prev => ({ ...prev, program: programName }));
    
    // Find the selected program and auto-fill pricing if not already set
    const selectedProgram = programs.find(p => p.name === programName);
    if (selectedProgram && selectedProgram.price && !formData.monthlyCost) {
      setFormData(prev => ({
        ...prev,
        program: programName,
        monthlyCost: (selectedProgram.price / 100).toString()
      }));
    }
  };

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students and enrollments when enrollment modal opens
  useEffect(() => {
    if (isEnrollmentModalOpen && selectedClassForEnrollment) {
      // Fetch all students using tRPC endpoint
      fetch('/api/trpc/students.list')
        .then(res => res.json())
        .then(data => {
          if (data.result?.data?.json) {
            setAllStudents(data.result.data.json.map((s: any) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              program: s.program,
              photoUrl: s.photoUrl
            })));
          }
        })
        .catch(err => console.error('Failed to fetch students:', err));

      // Fetch enrolled students for this class
      fetch(`/api/trpc/classes.getEnrolledStudents?input=${encodeURIComponent(JSON.stringify({ json: { classId: selectedClassForEnrollment.id } }))}`)
        .then(res => res.json())
        .then(data => {
          if (data.result?.data?.json) {
            setEnrolledStudentIds(data.result.data.json.map((s: any) => s.id));
          }
        })
        .catch(err => console.error('Failed to fetch enrollments:', err));
    }
  }, [isEnrollmentModalOpen, selectedClassForEnrollment]);

  // Fetch instructors using tRPC
  const { data: instructorsData } = trpc.staff.getInstructors.useQuery();
  
  // Update instructors state when data changes
  useEffect(() => {
    if (instructorsData?.instructors) {
      setInstructors(instructorsData.instructors);
    }
  }, [instructorsData]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/classes`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setClasses(data);
        await calculateStats(data);  // Added await
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (classesData) => {
    const totalClasses = classesData.length;
    const totalStudents = classesData.reduce((sum, cls) => sum + (cls.enrolled || 0), 0);
    const avgClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
    
    // Get instructor count from Staff API
    try {
      const response = await fetch(`${API_URL}/staff/stats`);
      const staffStats = await response.json();
      console.log('Staff Stats API Response:', staffStats);
      const activeInstructors = (staffStats.instructors || 0) + (staffStats.assistants || 0);
      console.log('Active Instructors Count:', activeInstructors);
      
      setStats({
        totalClasses,
        totalStudents,
        avgClassSize,
        activeInstructors
      });
      console.log('Stats set to:', { totalClasses, totalStudents, avgClassSize, activeInstructors });
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      // Fallback to counting from classes
      const activeInstructors = new Set(classesData.map(cls => cls.instructor)).size;
      setStats({
        totalClasses,
        totalStudents,
        avgClassSize,
        activeInstructors
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate time when start or end time changes
    if (name === 'startTime' || name === 'endTime') {
      const start = name === 'startTime' ? value : formData.startTime;
      const end = name === 'endTime' ? value : formData.endTime;
      if (start && end && start >= end) {
        setTimeError('End time must be after start time');
      } else {
        setTimeError('');
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      program: '',
      level: '',
      instructor: '',
      instructorId: null,
      days: [],
      startTime: '',
      endTime: '',
      room: '',
      capacity: '',
      ageMin: '',
      ageMax: '',
      monthlyCost: '',
      description: ''
    });
    setShowAdvanced(false);
    setTimeError('');
  };

  // Helper to format time from 24h to 12h format
  const formatTime = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    
    // Validate time
    if (formData.startTime >= formData.endTime) {
      setTimeError('End time must be after start time');
      return;
    }
    
    // Build schedule string from days array
    const schedule = formData.days.join(', ');
    // Build time string from start and end time
    const time = `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`;
    // Build display name if not provided
    const displayName = formData.name || `${formData.program}${formData.level ? ' ' + formData.level : ''} – ${schedule}`;
    
    try {
      const response = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: displayName,
          type: formData.program,
          level: formData.level || 'All Levels',
          instructor: formData.instructor,
          instructorId: formData.instructorId,
          schedule: schedule,
          time: time,
          room: formData.room,
          capacity: parseInt(formData.capacity) || 15,
          ageMin: parseInt(formData.ageMin) || null,
          ageMax: parseInt(formData.ageMax) || null,
          monthlyCost: parseFloat(formData.monthlyCost) || null,
          description: formData.description,
          enrolled: 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store the created class details for the success modal including the ID
        setCreatedClass({ 
          ...formData, 
          id: result.id,
          type: formData.program,
          schedule: schedule,
          time: time
        });
        setIsAddModalOpen(false);
        setIsSuccessModalOpen(true);
        resetForm();
        fetchClasses();
      } else {
        toast.error('Failed to add class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error('Error adding class');
    }
  };

  // Helper to parse time string like "4:00 PM - 5:00 PM" to 24h format
  const parseTimeTo24h = (timeStr: string) => {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    
    // Parse schedule string into days array
    const scheduleStr = classItem.day_of_week || classItem.schedule || '';
    const daysArray = scheduleStr.split(',').map(d => d.trim()).filter(d => d);
    
    // Parse time string into start and end times
    const timeStr = classItem.time || '';
    const timeParts = timeStr.split(' - ');
    const startTime = timeParts[0] ? parseTimeTo24h(timeParts[0]) : '';
    const endTime = timeParts[1] ? parseTimeTo24h(timeParts[1]) : '';
    
    // Try to find matching program from the class name
    // e.g., "Little Ninjas Basics" should match "Little Ninjas" program
    let programName = classItem.type || classItem.program || '';
    if (!programName && classItem.name && programs.length > 0) {
      // Find the best matching program by checking if class name starts with or contains program name
      const matchedProgram = programs.find(p => 
        classItem.name.toLowerCase().startsWith(p.name.toLowerCase()) ||
        classItem.name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchedProgram) {
        programName = matchedProgram.name;
      }
    }
    
    // Try to extract level from the name (e.g., "Kids Beginner" -> level: "Beginner")
    let levelName = classItem.level || '';
    if (!levelName && classItem.name) {
      const levelPatterns = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
      for (const pattern of levelPatterns) {
        if (classItem.name.toLowerCase().includes(pattern.toLowerCase())) {
          levelName = pattern;
          break;
        }
      }
    }
    
    // Find instructor ID from instructor name if not set
    let instructorIdValue = classItem.instructorId || null;
    if (!instructorIdValue && classItem.instructor && instructors.length > 0) {
      const foundInstructor = instructors.find(i => 
        i.name === classItem.instructor || 
        i.fullName === classItem.instructor ||
        classItem.instructor.includes(i.name)
      );
      if (foundInstructor) {
        instructorIdValue = foundInstructor.id;
      }
    }
    
    setFormData({
      name: classItem.name || '',
      program: programName,
      level: levelName || 'All Levels',
      instructor: classItem.instructor || '',
      instructorId: instructorIdValue,
      days: daysArray,
      startTime: startTime,
      endTime: endTime,
      room: classItem.room || 'Main Dojo',
      capacity: classItem.capacity?.toString() || '20',
      ageMin: classItem.age_min?.toString() || '',
      ageMax: classItem.age_max?.toString() || '',
      monthlyCost: classItem.monthly_cost?.toString() || '',
      description: classItem.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    
    // Validate time
    if (formData.startTime >= formData.endTime) {
      setTimeError('End time must be after start time');
      return;
    }
    
    // Build schedule string from days array
    const schedule = formData.days.join(', ');
    // Build time string from start and end time
    const time = `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`;
    // Build display name if not provided
    const displayName = formData.name || `${formData.program}${formData.level ? ' ' + formData.level : ''} – ${schedule}`;
    
    try {
      const response = await fetch(`${API_URL}/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: displayName,
          type: formData.program,
          level: formData.level || 'All Levels',
          instructor: formData.instructor,
          instructorId: formData.instructorId,
          schedule: schedule,
          time: time,
          room: formData.room,
          capacity: parseInt(formData.capacity) || 15,
          ageMin: parseInt(formData.ageMin) || null,
          ageMax: parseInt(formData.ageMax) || null,
          monthlyCost: parseFloat(formData.monthlyCost) || null,
          description: formData.description,
        }),
      });

      if (response.ok) {
        toast.success('Class updated successfully!');
        setIsEditModalOpen(false);
        setEditingClass(null);
        resetForm();
        fetchClasses();
      } else {
        toast.error('Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Error updating class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/classes/${classId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Class deleted successfully!');
        fetchClasses();
      } else {
        toast.error('Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Error deleting class');
    }
  };

  // ClassForm now defined outside component

  return (
    <BottomNavLayout>
      {/* Breadcrumb Navigation */}
      <div className={`backdrop-blur-sm border-b px-6 py-2 ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-background/80 border-border/40'}`}>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Classes', href: '/classes' },
          ]}
        />
      </div>

      <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'bg-[#0F1115]' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Schedule</h1>
            <p className="text-muted-foreground">Manage your dojo's class schedule and enrollment</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sorting Controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: 'name' | 'createdAt' | 'dayOfWeek') => setSortBy(value)}>
                <SelectTrigger className="w-[140px] h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Class Name</SelectItem>
                  <SelectItem value="dayOfWeek">Day of Week</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Class Time</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a recurring class time under an existing program.
                </p>
              </DialogHeader>
              <div className="flex gap-6">
                {/* Form - Left side (60%) */}
                <div className="flex-[3] min-w-0">
                  <ClassForm 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSelectChange={handleSelectChange}
                    handleDayToggle={handleDayToggle}
                    instructors={instructors}
                    programs={programs}
                    existingClasses={classes}
                    editingClassId={null}
                    onProgramChange={handleProgramChange}
                    onSubmit={handleAddClass}
                    submitText="Add Class Time"
                    onCancel={() => {
                      setIsAddModalOpen(false);
                      resetForm();
                    }}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    timeError={timeError}
                    isDark={isDarkMode}
                  />
                </div>
                {/* Preview - Right side (40%) - Hidden on mobile */}
                <div className="hidden md:block flex-[2] min-w-0">
                  <LandscapePreviewCard formData={formData} programs={programs} instructors={instructors} isDark={isDarkMode} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Classes</p>
                <p className="text-3xl font-bold mt-1">{stats.totalClasses}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Class Size</p>
                <p className="text-3xl font-bold mt-1">{stats.avgClassSize}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <User className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Instructors</p>
                <p className="text-3xl font-bold mt-1">{stats.activeInstructors}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <User className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Classes Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first class</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...classes].sort((a, b) => {
              // Day of week order mapping
              const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
              
              let comparison = 0;
              
              if (sortBy === 'name') {
                comparison = (a.name || '').localeCompare(b.name || '');
              } else if (sortBy === 'createdAt') {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                comparison = dateA - dateB;
              } else if (sortBy === 'dayOfWeek') {
                const dayA = a.day_of_week || a.schedule || '';
                const dayB = b.day_of_week || b.schedule || '';
                const orderA = dayOrder[dayA] || 8;
                const orderB = dayOrder[dayB] || 8;
                comparison = orderA - orderB;
              }
              
              return sortOrder === 'asc' ? comparison : -comparison;
            }).map((classItem) => (
              <div key={classItem.id} id={`class-${classItem.id}`} className={`p-6 rounded-lg border hover:border-primary transition-all duration-300 ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{classItem.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                      {classItem.level}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {/* Show Floor Plan button for Kickboxing classes */}
                    {classItem.type === 'Kickboxing' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedClassForFloorPlan(classItem);
                            setIsFloorPlanModalOpen(true);
                          }}
                          title="Configure Floor Plan"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/instructor-view/${classItem.id}`, '_blank')}
                          title="Instructor View - Bag Assignments"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClass(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClass(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{classItem.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{classItem.day_of_week || classItem.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{classItem.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Main Dojo</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enrollment</span>
                    <span className="text-sm font-semibold">
                      {classItem.enrolled || 0} / {classItem.is_unlimited_capacity ? '∞' : classItem.capacity}
                    </span>
                  </div>
                  <div className="mt-2 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: classItem.is_unlimited_capacity 
                          ? '0%' 
                          : `${Math.min(((classItem.enrolled || 0) / classItem.capacity) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedClassForEnrollment(classItem);
                      setIsEnrollmentModalOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Enrollments
                  </Button>
                </div>

                {classItem.monthly_cost && (
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-primary">
                      ${classItem.monthly_cost}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                )}

                {/* Creation timestamp */}
                {classItem.createdAt && (
                  <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
                    <p className="text-xs text-muted-foreground/60 text-center">
                      Created {new Date(classItem.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {new Date(classItem.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Class Time</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update the class time details.
              </p>
            </DialogHeader>
            <div className="flex gap-6">
              {/* Form - Left side (60%) */}
              <div className="flex-[3] min-w-0">
                <ClassForm 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                  handleDayToggle={handleDayToggle}
                  instructors={instructors}
                  programs={programs}
                  existingClasses={classes}
                  editingClassId={editingClass?.id}
                  onProgramChange={handleProgramChange}
                  onSubmit={handleUpdateClass}
                  submitText="Update Class Time"
                  onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingClass(null);
                    resetForm();
                  }}
                  showAdvanced={showAdvanced}
                  setShowAdvanced={setShowAdvanced}
                  timeError={timeError}
                  isDark={isDarkMode}
                />
              </div>
              {/* Preview - Right side (40%) - Hidden on mobile */}
              <div className="hidden md:block flex-[2] min-w-0">
                <LandscapePreviewCard formData={formData} programs={programs} instructors={instructors} isDark={isDarkMode} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Floor Plan Manager Modal */}
        {/* Success Confirmation Modal */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle className="text-xl">Class Created Successfully!</DialogTitle>
              </div>
            </DialogHeader>
            
            {createdClass && (
              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#18181A] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <h3 className="font-semibold text-lg mb-3">
                    {createdClass.name || `${createdClass.program}${createdClass.level ? ' ' + createdClass.level : ''}`}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Program:</span>
                      <span className="font-medium">{createdClass.program || 'Not set'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium">{createdClass.level || 'All Levels'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Instructor:</span>
                      <span className="font-medium">{createdClass.instructor}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {createdClass.startTime && createdClass.endTime 
                          ? `${createdClass.startTime} - ${createdClass.endTime}`
                          : 'Not set'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Days:</span>
                      <span className="font-medium">
                        {Array.isArray(createdClass.days) ? createdClass.days.join(', ') : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{createdClass.capacity} students</span>
                    </div>
                    
                    {(createdClass.ageMin || createdClass.ageMax) && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ages:</span>
                        <span className="font-medium">
                          {createdClass.ageMin && createdClass.ageMax 
                            ? `${createdClass.ageMin} - ${createdClass.ageMax}`
                            : createdClass.ageMin 
                              ? `${createdClass.ageMin}+`
                              : `Up to ${createdClass.ageMax}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {createdClass.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Room:</span>
                        <span className="font-medium">{createdClass.room}</span>
                      </div>
                    )}
                  </div>
                  
                  {createdClass.description && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">{createdClass.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsSuccessModalOpen(false)}
                  >
                    Close
                  </Button>
                  {createdClass.id && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsSuccessModalOpen(false);
                        // Scroll to the class in the list
                        const classElement = document.getElementById(`class-${createdClass.id}`);
                        if (classElement) {
                          classElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          classElement.classList.add('ring-2', 'ring-primary');
                          setTimeout(() => classElement.classList.remove('ring-2', 'ring-primary'), 2000);
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Class
                    </Button>
                  )}
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setIsSuccessModalOpen(false);
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {selectedClassForFloorPlan && (
          <FloorPlanManager
            classId={selectedClassForFloorPlan.id}
            className={selectedClassForFloorPlan.name}
            isOpen={isFloorPlanModalOpen}
            onClose={() => {
              setIsFloorPlanModalOpen(false);
              setSelectedClassForFloorPlan(null);
            }}
          />
        )}

        {/* Enrollment Management Modal */}
        <Dialog open={isEnrollmentModalOpen} onOpenChange={(open) => {
          setIsEnrollmentModalOpen(open);
          if (!open) {
            setSelectedClassForEnrollment(null);
            setEnrollmentSearchQuery('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Enrollments - {selectedClassForEnrollment?.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {selectedClassForEnrollment?.day_of_week} • {selectedClassForEnrollment?.time}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <Input
                placeholder="Search students..."
                value={enrollmentSearchQuery}
                onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
              />

              {/* Student List */}
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {allStudents
                  .filter(s => 
                    `${s.firstName} ${s.lastName}`.toLowerCase().includes(enrollmentSearchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    // Sort: Enrolled first, then Suggested, then others
                    const aEnrolled = enrolledStudentIds.includes(a.id);
                    const bEnrolled = enrolledStudentIds.includes(b.id);
                    if (aEnrolled !== bEnrolled) return aEnrolled ? -1 : 1;
                    
                    const className = selectedClassForEnrollment?.name?.toLowerCase() || '';
                    const aProgram = (a.program || '').toLowerCase();
                    const bProgram = (b.program || '').toLowerCase();
                    const aSuggested = (
                      (aProgram.includes('little') && className.includes('little ninja')) ||
                      (aProgram.includes('kids') && (className.includes('kids') || className.includes('family'))) ||
                      (aProgram.includes('teen') && className.includes('teen')) ||
                      (aProgram.includes('adult') && (className.includes('adult') || className.includes('cardio') || className.includes('sparring'))) ||
                      (aProgram.includes('dragon') && (className.includes('little ninja') || className.includes('kids'))) ||
                      (aProgram.includes('karate') && (className.includes('kids') || className.includes('beginner') || className.includes('intermediate')))
                    );
                    const bSuggested = (
                      (bProgram.includes('little') && className.includes('little ninja')) ||
                      (bProgram.includes('kids') && (className.includes('kids') || className.includes('family'))) ||
                      (bProgram.includes('teen') && className.includes('teen')) ||
                      (bProgram.includes('adult') && (className.includes('adult') || className.includes('cardio') || className.includes('sparring'))) ||
                      (bProgram.includes('dragon') && (className.includes('little ninja') || className.includes('kids'))) ||
                      (bProgram.includes('karate') && (className.includes('kids') || className.includes('beginner') || className.includes('intermediate')))
                    );
                    if (aSuggested !== bSuggested) return aSuggested ? -1 : 1;
                    return 0;
                  })
                  .map(student => {
                    const isEnrolled = enrolledStudentIds.includes(student.id);
                    // Program-to-class matching logic
                    const className = selectedClassForEnrollment?.name?.toLowerCase() || '';
                    const studentProgram = (student.program || '').toLowerCase();
                    const isSuggested = (
                      (studentProgram.includes('little') && className.includes('little ninja')) ||
                      (studentProgram.includes('kids') && (className.includes('kids') || className.includes('family'))) ||
                      (studentProgram.includes('teen') && className.includes('teen')) ||
                      (studentProgram.includes('adult') && (className.includes('adult') || className.includes('cardio') || className.includes('sparring'))) ||
                      (studentProgram.includes('dragon') && (className.includes('little ninja') || className.includes('kids'))) ||
                      (studentProgram.includes('competition') && (className.includes('sparring') || className.includes('leadership'))) ||
                      (studentProgram.includes('jiu-jitsu') && (className.includes('adult') || className.includes('sparring'))) ||
                      (studentProgram.includes('muay thai') && (className.includes('adult') || className.includes('cardio') || className.includes('kickboxing'))) ||
                      (studentProgram.includes('karate') && (className.includes('adult') || className.includes('kids') || className.includes('beginner') || className.includes('intermediate')))
                    );
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 hover:bg-muted/50 ${isSuggested && !isEnrolled ? 'bg-green-500/10 border-l-2 border-l-green-500' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{student.firstName} {student.lastName}</p>
                              {isSuggested && !isEnrolled && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-medium">
                                  Suggested
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{student.program || 'No program'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isEnrolled ? 'destructive' : 'default'}
                          disabled={enrollmentLoading}
                          onClick={async () => {
                            setEnrollmentLoading(true);
                            try {
                              if (isEnrolled) {
                                // Unenroll
                                const response = await fetch('/api/trpc/studentPortal.unenrollFromClass', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    json: {
                                      studentId: student.id,
                                      classId: selectedClassForEnrollment.id
                                    }
                                  })
                                });
                                if (response.ok) {
                                  setEnrolledStudentIds(prev => prev.filter(id => id !== student.id));
                                  toast.success(`${student.firstName} unenrolled from class`);
                                  fetchClasses(); // Refresh enrollment counts
                                }
                              } else {
                                // Enroll
                                const response = await fetch('/api/trpc/studentPortal.enrollInClass', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    json: {
                                      studentId: student.id,
                                      classId: selectedClassForEnrollment.id
                                    }
                                  })
                                });
                                if (response.ok) {
                                  setEnrolledStudentIds(prev => [...prev, student.id]);
                                  toast.success(`${student.firstName} enrolled in class`);
                                  fetchClasses(); // Refresh enrollment counts
                                }
                              }
                            } catch (error) {
                              toast.error('Failed to update enrollment');
                            } finally {
                              setEnrollmentLoading(false);
                            }
                          }}
                        >
                          {isEnrolled ? 'Remove' : 'Enroll'}
                        </Button>
                      </div>
                    );
                  })}
                {allStudents.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No students found. Add students first.
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {enrolledStudentIds.length} student{enrolledStudentIds.length !== 1 ? 's' : ''} enrolled
                </p>
                <Button variant="outline" onClick={() => setIsEnrollmentModalOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BottomNavLayout>
  );
}

