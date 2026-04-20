import { useState, useEffect, useMemo } from 'react';
import ManagementLayout from '@/components/ManagementLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Clock, Users, User, MapPin, Edit, Trash2, LayoutGrid, Eye, CheckCircle, DollarSign, ChevronDown, ChevronUp, AlertCircle, GraduationCap, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FloorPlanManager from '../components/FloorPlanManagerNew';
import OverallSchedule from '@/components/OverallSchedule';
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
  isDark,
  floorPlansData
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
  floorPlansData?: any[];
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
      <div className="space-y-5">
        <div>
          <Label htmlFor="program" className="text-base font-medium mb-2 block">Program</Label>
          <CustomSelect
            id="program"
            value={formData.program}
            onChange={(value) => onProgramChange(value)}
            options={[
              ...(programs.length === 0 ? [{ value: '', label: 'No programs yet', disabled: true }] : []),
              ...programs.map((program) => ({
                value: program.name,
                label: `${program.name} ${program.price ? `($${(program.price / 100).toFixed(0)}/mo)` : ''}`
              }))
            ]}
            placeholder="Select program"
            isDark={isDark}
          />
        </div>

        <div>
          <Label htmlFor="instructor" className="text-base font-medium mb-2 block">Instructor</Label>
          <CustomSelect
            id="instructor"
            value={formData.instructorId?.toString() || ''}
            onChange={(value) => {
              const id = parseInt(value);
              const instructor = instructors.find(i => i.id === id);
              handleSelectChange('instructorId', value);
              handleSelectChange('instructor', instructor?.name || '');
            }}
            options={[
              ...(instructors.length === 0 ? [{ value: '', label: 'No instructors available', disabled: true }] : []),
              ...instructors.map((instructor) => ({
                value: instructor.id.toString(),
                label: `${instructor.name} (${instructor.role})`
              }))
            ]}
            placeholder="Select instructor"
            isDark={isDark}
            error={instructorConflict}
          />
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
      <div className="space-y-5">
        <div>
          <Label htmlFor="level" className="text-base font-medium mb-2 block">Level</Label>
          <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)}>
            <SelectTrigger className="!h-12 text-base rounded-xl">
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
          <Label htmlFor="room" className="text-base font-medium mb-2 block">Room / Mat</Label>
          <Input
            id="room"
            name="room"
            value={formData.room}
            onChange={handleInputChange}
            placeholder="Mat A"
            className="h-12 text-base rounded-xl"
          />
        </div>
      </div>

      {/* Days - Prominent */}
      <div>
        <Label className="text-base font-medium mb-3 block">Days</Label>
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
      <div className="space-y-5">
        <div>
          <Label htmlFor="startTime" className="text-base font-medium mb-2 block">Start</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleInputChange}
            className="h-12 text-base rounded-xl"
            required
          />
        </div>

        <div>
          <Label htmlFor="endTime" className="text-base font-medium mb-2 block">End</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleInputChange}
            className="h-12 text-base rounded-xl"
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

      {/* Floor Plan - Optional */}
      <div>
        <Label htmlFor="floorPlan" className="text-base font-medium mb-2 block">Floor Plan (Optional)</Label>
        <CustomSelect
          id="floorPlan"
          value={formData.floorPlanId?.toString() || "none"}
          onChange={(value) => {
            const floorPlanId = value === "none" ? null : parseInt(value);
            const selectedPlan = floorPlansData?.find(p => p.id === floorPlanId);
            setFormData(prev => ({
              ...prev,
              floorPlanId,
              capacity: selectedPlan ? selectedPlan.maxCapacity.toString() : prev.capacity
            }));
          }}
          options={[
            { value: 'none', label: 'No floor plan' },
            ...(floorPlansData?.map((plan) => ({
              value: plan.id.toString(),
              label: `${plan.roomName} (${plan.maxCapacity} spots)`
            })) || [])
          ]}
          placeholder="Select floor plan"
          isDark={isDark}
        />
      </div>

      {/* Capacity - Always visible */}
      <div>
        <Label htmlFor="capacity" className="text-base font-medium mb-2 block">Capacity</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleInputChange}
          placeholder="15"
          className="h-12 text-base rounded-xl w-full"
          required
        />
        {formData.floorPlanId && (
          <p className="text-xs text-muted-foreground mt-1">
            Floor plan capacity: {floorPlansData?.find(p => p.id === formData.floorPlanId)?.maxCapacity}
          </p>
        )}
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
              <Label htmlFor="ageMin" className="text-base font-medium mb-2 block">Min Age</Label>
              <Input
                id="ageMin"
                name="ageMin"
                type="number"
                value={formData.ageMin}
                onChange={handleInputChange}
                placeholder="5"
                className="h-12 text-base rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="ageMax" className="text-base font-medium mb-2 block">Max Age</Label>
              <Input
                id="ageMax"
                name="ageMax"
                type="number"
                value={formData.ageMax}
                onChange={handleInputChange}
                placeholder="12"
                className="h-12 text-base rounded-xl"
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
              <Label htmlFor="name" className="text-base font-medium mb-2 block">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Custom name for schedule"
                className="h-12 text-base rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="monthlyCost" className="text-base font-medium mb-2 block">Price Override</Label>
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
              <Label htmlFor="description" className="text-base font-medium mb-2 block">Notes</Label>
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
        <Button type="submit" disabled={formData.days.length === 0} className="h-9 px-5">
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default function Classes({ onLogout, theme, toggleTheme }) {
  const isDarkMode = useDarkMode()
  // Fetch classes from database
  const { data: classes = [], refetch: refetchClasses, isLoading: classesLoading } = trpc.classes.getAll.useQuery();
  
  // Fetch programs from database
  const { data: programs = [] } = trpc.kai.programs.list.useQuery({});
  
  // Fetch floor plans
  const { data: floorPlansData } = trpc.floorPlans.list.useQuery({});
  
  // Fetch dojo settings for schedule branding
  const { data: dojoSettings } = trpc.kai.settings.getSettings.useQuery({});
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
  
  // Bulk selection state
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
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
    floorPlanId: null as number | null,
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

  // Set loading to false once tRPC query completes (even if empty)
  useEffect(() => {
    if (!classesLoading) {
      setLoading(false);
    }
  }, [classesLoading]);

   // Recalculate stats when classes data changes (from tRPC)
  useEffect(() => {
    if (classes.length > 0) {
      calculateStats(classes);
    }
  }, [classes]);

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
  const { data: instructorsData } = trpc.classes.getInstructors.useQuery();
  
  // Update instructors state when data changes
  useEffect(() => {
    if (instructorsData) {
      setInstructors(instructorsData);
    }
  }, [instructorsData]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Refetch via tRPC so the classes list updates after create/edit/delete
      await refetchClasses();
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
          startTime: formData.startTime,  // 24h format for schedule grid
          endTime: formData.endTime,
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
    
    // Parse schedule string into days array (dayOfWeek is the DB field name)
    const scheduleStr = classItem.dayOfWeek || classItem.day_of_week || classItem.schedule || '';
    // Normalize full day names to abbreviations for the form
    const dayFullToAbbrev: Record<string, string> = {
      'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 'thursday': 'Thu',
      'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'
    };
    const daysArray = scheduleStr.split(/[,\/]/).map(d => {
      const trimmed = d.trim();
      return dayFullToAbbrev[trimmed.toLowerCase()] || trimmed;
    }).filter(d => d);
    
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
    // If still no program found, use the class name itself as the program (class name IS the program)
    if (!programName && classItem.name) {
      programName = classItem.name;
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
      ageMin: (classItem.ageMin || classItem.age_min)?.toString() || '',
      ageMax: (classItem.ageMax || classItem.age_max)?.toString() || '',
      monthlyCost: (classItem.monthlyCost || classItem.monthly_cost)?.toString() || '',
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

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.classes.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully deleted ${data.deletedCount} class${data.deletedCount > 1 ? 'es' : ''}`);
      fetchClasses();
      setSelectedClassIds([]);
      setIsSelectionMode(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete classes: ${error.message}`);
    }
  });

  const handleBulkDelete = () => {
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedClassIds.length} class${selectedClassIds.length > 1 ? 'es' : ''}?`)) {
      bulkDeleteMutation.mutate({ ids: selectedClassIds });
    }
  };

  const toggleClassSelection = (classId: number) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map(c => c.id));
    }
  };

  const handleDeleteClass = async (classId: number) => {  if (!confirm('Are you sure you want to delete this class?')) {
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

  // ── Program detail panel state ──────────────────────────────────────────
  const [selectedProgramPanel, setSelectedProgramPanel] = useState<string | null>(null);
  const [isProgramPanelOpen, setIsProgramPanelOpen] = useState(false);

  // ── New UI state for redesigned layout ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterInstructor, setFilterInstructor] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedWeekDay, setSelectedWeekDay] = useState<string | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Week days for the week selector
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map full day names to abbreviations (dayOfWeek in DB can be 'Monday', 'Tuesday', etc.)
  const dayAbbrevMap: Record<string, string> = {
    'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 'thursday': 'Thu',
    'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun',
    'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu',
    'fri': 'Fri', 'sat': 'Sat', 'sun': 'Sun'
  };

  // Normalize a dayOfWeek string to abbreviation
  const normDay = (d: string) => dayAbbrevMap[d.toLowerCase().trim()] || d.trim();

  // Get normalized days array from a class
  const getClassDays = (c: any): string[] => {
    const raw = c.dayOfWeek || c.day_of_week || c.schedule || '';
    return raw.split(/[,\/]/).map((d: string) => normDay(d)).filter(Boolean);
  };

  // Get count of classes per day (dayOfWeek field is the primary field from DB schema)
  const classesPerDay = weekDays.reduce((acc, day) => {
    acc[day] = classes.filter(c => getClassDays(c).includes(day)).length;
    return acc;
  }, {} as Record<string, number>);

  // Format time from 24h to 12h (reuse existing formatTime)
  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '';
    // If already in 12h format (contains AM/PM), return as-is
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr.split(' - ')[0];
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Get program name for a class: use program field if set, otherwise use name (class name IS the program)
  const getProgram = (c: any): string => c.program || c.type || c.name || 'Uncategorized';

  // Get unique programs from classes
  const programNames = Array.from(new Set(classes.map(c => getProgram(c)).filter(Boolean)));

  // Filter classes based on search + filters
  const filteredClasses = classes.filter(c => {
    const name = (c.name || '').toLowerCase();
    const program = getProgram(c).toLowerCase();
    const instructor = (c.instructor || '').toLowerCase();
    const classDays = getClassDays(c);

    if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !program.includes(searchQuery.toLowerCase())) return false;
    if (filterProgram !== 'all' && getProgram(c) !== filterProgram) return false;
    if (filterInstructor !== 'all' && instructor !== filterInstructor.toLowerCase()) return false;
    if (filterDay !== 'all' && !classDays.includes(filterDay)) return false;
    if (selectedWeekDay && !classDays.includes(selectedWeekDay)) return false;
    return true;
  });

  // Group filtered classes by program name
  const groupedByProgram = filteredClasses.reduce((acc, c) => {
    const prog = getProgram(c);
    if (!acc[prog]) acc[prog] = [];
    acc[prog].push(c);
    return acc;
  }, {} as Record<string, typeof classes>);

  // Toggle expanded state for a program
  const toggleProgramExpand = (prog: string) => {
    setExpandedPrograms(prev => ({ ...prev, [prog]: !prev[prog] }));
  };

  // Helper: get duration in minutes from a class
  const getDuration = (c: any): string => {
    // Use the duration field from DB if available
    if (c.duration && c.duration > 0) return `${c.duration} min`;
    if (c.startTime && c.endTime) {
      const [sh, sm] = c.startTime.split(':').map(Number);
      const [eh, em] = c.endTime.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) return `${mins} min`;
    }
    // Try to parse from time string like "4:00 PM - 5:00 PM"
    if (c.time) {
      const parts = c.time.split(' - ');
      if (parts.length === 2) {
        const parseMin = (t: string) => {
          const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!m) return 0;
          let h = parseInt(m[1]); const min = parseInt(m[2]); const ap = m[3].toUpperCase();
          if (ap === 'PM' && h !== 12) h += 12;
          if (ap === 'AM' && h === 12) h = 0;
          return h * 60 + min;
        };
        const diff = parseMin(parts[1]) - parseMin(parts[0]);
        if (diff > 0) return `${diff} min`;
      }
    }
    return '';
  };

  // Helper: get age range display (ageMin/ageMax are the camelCase fields from DB)
  const getAgeRange = (c: any): string => {
    const min = c.ageMin || c.age_min;
    const max = c.ageMax || c.age_max;
    if (min && max) return `Ages ${min}–${max}`;
    if (min) return `Ages ${min}+`;
    if (max) return `Up to ${max}`;
    return '';
  };

  // Helper: get start time display for a class (time field is 'HH:MM AM - HH:MM PM' format in DB)
  const getStartTimeDisplay = (c: any): string => {
    if (c.time) {
      const parts = c.time.split(' - ');
      return parts[0]?.trim() || '';
    }
    if (c.startTime) return formatTime(c.startTime);
    return '';
  };

  // Get program icon letter
  const getProgramInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <ManagementLayout>
      {/* Breadcrumb Navigation */}
      <div className={`backdrop-blur-sm border-b px-6 py-2 ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-background/80 border-border/40'}`}>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Classes', href: '/classes' },
          ]}
        />
      </div>

      <div className={`p-6 pb-24 min-h-[calc(100vh-120px)] ${isDarkMode ? 'bg-[#0F1115]' : 'bg-[#F8F8FA]'}`}>
        <div className="max-w-7xl mx-auto">

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Class Schedule
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                Explore classes and find the perfect time to train
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk selection controls */}
              {classes.length > 0 && (
                <>
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedClassIds([]);
                    }}
                    className="h-9 text-sm"
                  >
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </Button>
                  {isSelectionMode && (
                    <>
                      <Button variant="outline" size="sm" onClick={toggleSelectAll} className="h-9 text-sm">
                        {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={selectedClassIds.length === 0 || bulkDeleteMutation.isLoading}
                        className="h-9 text-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete ({selectedClassIds.length})
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Add New Class button — triggers Dialog */}
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="h-9 text-sm font-medium bg-red-500 hover:bg-red-600 text-white border-0"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add New Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Add Class Time</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a recurring class time under an existing program.
                    </p>
                  </DialogHeader>
                  <div className="px-2 overflow-y-auto flex-1 min-h-0">
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
                      onCancel={() => { setIsAddModalOpen(false); resetForm(); }}
                      floorPlansData={floorPlansData}
                      showAdvanced={showAdvanced}
                      setShowAdvanced={setShowAdvanced}
                      timeError={timeError}
                      isDark={isDarkMode}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── KPI STRIP ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Total Classes */}
            <div className={`rounded-xl border p-4 flex items-center justify-between ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
              <div>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>Total Classes</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalClasses}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10">
                <Calendar className="h-4.5 w-4.5 text-red-500" style={{ width: 18, height: 18 }} />
              </div>
            </div>
            {/* Active Students */}
            <div className={`rounded-xl border p-4 flex items-center justify-between ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
              <div>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>Active Students</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalStudents}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500/10">
                <Users className="h-4.5 w-4.5 text-green-500" style={{ width: 18, height: 18 }} />
              </div>
            </div>
            {/* Open Spots */}
            <div className={`rounded-xl border p-4 flex items-center justify-between ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
              <div>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>Open Spots</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {classes.reduce((sum, c) => sum + Math.max(0, (c.capacity || 0) - (c.enrolled || 0)), 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10">
                <User className="h-4.5 w-4.5 text-blue-500" style={{ width: 18, height: 18 }} />
              </div>
            </div>
            {/* Active Instructors */}
            <div className={`rounded-xl border p-4 flex items-center justify-between ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
              <div>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>Active Instructors</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeInstructors || instructors.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/10">
                <User className="h-4.5 w-4.5 text-purple-500" style={{ width: 18, height: 18 }} />
              </div>
            </div>
          </div>

          {/* ── FILTER BAR ────────────────────────────────────────────────── */}
          <div className={`rounded-xl border p-3 mb-5 flex flex-wrap items-center gap-2 ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 h-9 text-sm rounded-lg border outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-white/20'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300'
                }`}
              />
            </div>

            {/* Program filter */}
            <select
              value={filterProgram}
              onChange={e => setFilterProgram(e.target.value)}
              className={`h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">All Programs</option>
              {programNames.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Instructor filter */}
            <select
              value={filterInstructor}
              onChange={e => setFilterInstructor(e.target.value)}
              className={`h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">All Instructors</option>
              {instructors.map(i => <option key={i.id} value={i.name.toLowerCase()}>{i.name}</option>)}
            </select>

            {/* Day filter */}
            <select
              value={filterDay}
              onChange={e => setFilterDay(e.target.value)}
              className={`h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">All Days</option>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* View toggle */}
            <div className={`flex items-center rounded-lg border overflow-hidden ml-auto ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 h-9 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                    : isDarkMode ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 h-9 text-sm font-medium transition-colors border-l ${
                  viewMode === 'calendar'
                    ? isDarkMode ? 'bg-red-500/20 text-red-400 border-white/10' : 'bg-red-50 text-red-600 border-gray-200'
                    : isDarkMode ? 'text-white/50 hover:text-white border-white/10' : 'text-gray-500 hover:text-gray-700 border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar View
              </button>
            </div>
          </div>

          {/* ── WEEK SELECTOR ─────────────────────────────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>This Week</h2>
              {selectedWeekDay && (
                <button
                  onClick={() => setSelectedWeekDay(null)}
                  className={`text-xs font-medium ${isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Show all days
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const count = classesPerDay[day] || 0;
                const isSelected = selectedWeekDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedWeekDay(isSelected ? null : day)}
                    className={`rounded-xl border py-3 px-1 text-center transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10'
                        : isDarkMode
                          ? 'border-white/10 bg-[#18181A] hover:border-white/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${
                      isSelected ? 'text-red-500' : isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>{day}</p>
                    <p className={`text-base font-bold ${
                      isSelected ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{count}</p>
                    <p className={`text-[10px] ${
                      isSelected ? 'text-red-400' : isDarkMode ? 'text-white/30' : 'text-gray-400'
                    }`}>{count === 1 ? 'class' : 'classes'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CALENDAR VIEW (OverallSchedule) ───────────────────────────── */}
          {viewMode === 'calendar' && !loading && classes.length > 0 && (
            <div className="mb-6">
              <OverallSchedule
                classes={classes}
                isDark={isDarkMode}
                onClassClick={handleEditClass}
                dojoSettings={dojoSettings}
              />
            </div>
          )}

          {/* ── PROGRAM-GROUPED LIST ──────────────────────────────────────── */}
          {viewMode === 'list' && (
            <>
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filterProgram !== 'all' ? filterProgram : 'All Programs'}
                </h2>
                <span className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                  {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'} available
                </span>
              </div>

              {loading ? (
                <div className={`rounded-xl border p-12 text-center ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Loading classes...</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className={`rounded-xl border p-12 text-center ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
                  <Calendar className={`h-10 w-10 mx-auto mb-3 ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`} />
                  <h3 className={`text-base font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {classes.length === 0 ? 'No Classes Yet' : 'No classes match your filters'}
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                    {classes.length === 0 ? 'Get started by adding your first class' : 'Try adjusting your search or filters'}
                  </p>
                  {classes.length === 0 && (
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Class
                    </Button>
                  )}
                </div>
              ) : (
                <div className={`rounded-xl border overflow-hidden divide-y ${isDarkMode ? 'bg-[#18181A] border-white/10 divide-white/[0.06]' : 'bg-white border-gray-200 divide-gray-100'}`}>
                  {Object.entries(groupedByProgram).map(([programName, programClasses]) => {
                    const isExpanded = expandedPrograms[programName];
                    const visibleSlots = isExpanded ? programClasses : programClasses.slice(0, 3);
                    const hasMore = programClasses.length > 3;
                    // Use first class for program-level info
                    const firstClass = programClasses[0];
                    const ageRange = getAgeRange(firstClass);
                    const duration = getDuration(firstClass);
                    const instructorName = firstClass.instructor || firstClass.instructorName || '';

                    return (
                      <div
                        key={programName}
                        className={`flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer ${
                          isSelectionMode ? '' : 'hover:bg-opacity-50'
                        } ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'}`}
                        onClick={() => {
                          if (!isSelectionMode) {
                            setSelectedProgramPanel(programName);
                            setIsProgramPanelOpen(true);
                          }
                        }}
                      >
                        {/* Program icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${
                          ['bg-gray-700', 'bg-gray-600', 'bg-gray-800', 'bg-gray-500', 'bg-gray-700', 'bg-gray-600', 'bg-gray-800'][
                            programName.charCodeAt(0) % 7
                          ]
                        }`}>
                          {getProgramInitial(programName)}
                        </div>

                        {/* Program info */}
                        <div className="w-36 flex-shrink-0">
                          <p className={`text-sm font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {programName}
                          </p>
                          {ageRange && (
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{ageRange}</p>
                          )}
                        </div>

                        {/* Instructor */}
                        <div className="w-40 flex-shrink-0 hidden md:flex items-center gap-1.5">
                          <User className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} />
                          <span className={`text-xs truncate ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                            {instructorName || '—'}
                          </span>
                        </div>

                        {/* Duration */}
                        {duration && (
                          <div className="w-14 flex-shrink-0 hidden lg:block">
                            <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{duration}</span>
                          </div>
                        )}

                        {/* Time slot buttons */}
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          {visibleSlots.map((cls) => {
                            const timeDisplay = getStartTimeDisplay(cls);
                            const isFull = !cls.is_unlimited_capacity && cls.enrolled >= cls.capacity;
                            const isSelected = isSelectionMode && selectedClassIds.includes(cls.id);
                            return (
                              <button
                                key={cls.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelectionMode) {
                                    toggleClassSelection(cls.id);
                                  } else {
                                    setSelectedProgramPanel(programName);
                                    setIsProgramPanelOpen(true);
                                  }
                                }}
                                className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected
                                    ? 'bg-red-500 text-white border-red-500'
                                    : isFull
                                      ? isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                                      : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                                }`}
                              >
                                {timeDisplay || cls.time?.split(' - ')[0] || 'TBD'}
                              </button>
                            );
                          })}

                          {hasMore && !isExpanded && (
                            <button
                              onClick={() => toggleProgramExpand(programName)}
                              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                                isDarkMode
                                  ? 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                                  : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              +{programClasses.length - 3} more
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              onClick={() => toggleProgramExpand(programName)}
                              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                                isDarkMode
                                  ? 'border-white/10 text-white/40 hover:text-white/70'
                                  : 'border-gray-200 text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              Show less
                            </button>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
                          {/* Floor plan / instructor view for Kickboxing */}
                          {programName === 'Kickboxing' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedClassForFloorPlan(firstClass);
                                  setIsFloorPlanModalOpen(true);
                                }}
                                title="Configure Floor Plan"
                              >
                                <LayoutGrid className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(`/instructor-view/${firstClass.id}`, '_blank')}
                                title="Instructor View"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {/* Manage enrollments */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Manage Enrollments"
                            onClick={() => {
                              setSelectedClassForEnrollment(firstClass);
                              setIsEnrollmentModalOpen(true);
                            }}
                          >
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                          {/* Chevron */}
                          <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── EDIT MODAL ────────────────────────────────────────────────── */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Edit Class Time</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Update the class time details.</p>
              </DialogHeader>
              <div className="flex gap-6 overflow-y-auto flex-1 min-h-0">
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
                    onCancel={() => { setIsEditModalOpen(false); setEditingClass(null); resetForm(); }}
                    floorPlansData={floorPlansData}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    timeError={timeError}
                    isDark={isDarkMode}
                  />
                </div>
                <div className="hidden md:block flex-[2] min-w-0">
                  <LandscapePreviewCard formData={formData} programs={programs} instructors={instructors} isDark={isDarkMode} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── SUCCESS MODAL ─────────────────────────────────────────────── */}
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
                            : 'Not set'}
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
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setIsSuccessModalOpen(false)}>Close</Button>
                    <Button className="flex-1" onClick={() => { setIsSuccessModalOpen(false); setIsAddModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />Add Another
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── FLOOR PLAN MODAL ──────────────────────────────────────────── */}
          {selectedClassForFloorPlan && (
            <FloorPlanManager
              classId={selectedClassForFloorPlan.id}
              className={selectedClassForFloorPlan.name}
              isOpen={isFloorPlanModalOpen}
              onClose={() => { setIsFloorPlanModalOpen(false); setSelectedClassForFloorPlan(null); }}
            />
          )}

          {/* ── ENROLLMENT MODAL ──────────────────────────────────────────── */}
          <Dialog open={isEnrollmentModalOpen} onOpenChange={(open) => {
            setIsEnrollmentModalOpen(open);
            if (!open) { setSelectedClassForEnrollment(null); setEnrollmentSearchQuery(''); }
          }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-visible flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manage Enrollments - {selectedClassForEnrollment?.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedClassForEnrollment?.day_of_week} • {selectedClassForEnrollment?.time}
                </p>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                <Input
                  placeholder="Search students..."
                  value={enrollmentSearchQuery}
                  onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                />
                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {allStudents
                    .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(enrollmentSearchQuery.toLowerCase()))
                    .sort((a, b) => {
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
                              <img src={student.photoUrl} alt={student.firstName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{student.firstName} {student.lastName}</p>
                                {isSuggested && !isEnrolled && (
                                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-medium">Suggested</span>
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
                                  const response = await fetch('/api/trpc/studentPortal.unenrollFromClass', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ json: { studentId: student.id, classId: selectedClassForEnrollment.id } })
                                  });
                                  if (response.ok) { setEnrolledStudentIds(prev => prev.filter(id => id !== student.id)); toast.success(`${student.firstName} unenrolled from class`); fetchClasses(); }
                                } else {
                                  const response = await fetch('/api/trpc/studentPortal.enrollInClass', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ json: { studentId: student.id, classId: selectedClassForEnrollment.id } })
                                  });
                                  if (response.ok) { setEnrolledStudentIds(prev => [...prev, student.id]); toast.success(`${student.firstName} enrolled in class`); fetchClasses(); }
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
                    <div className="p-8 text-center text-muted-foreground">No students found. Add students first.</div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {enrolledStudentIds.length} student{enrolledStudentIds.length !== 1 ? 's' : ''} enrolled
                  </p>
                  <Button variant="outline" onClick={() => setIsEnrollmentModalOpen(false)}>Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* ── PROGRAM DETAIL SIDE PANEL ──────────────────────────────────────── */}
      <Sheet open={isProgramPanelOpen} onOpenChange={setIsProgramPanelOpen}>
        <SheetContent side="right" className={`w-full sm:max-w-xl p-0 flex flex-col ${isDarkMode ? 'bg-[#111113] border-white/10' : 'bg-white border-gray-200'}`} style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
          {(() => {
            const panelClasses = selectedProgramPanel
              ? classes.filter(c => getProgram(c) === selectedProgramPanel)
              : [];
            const firstClass = panelClasses[0];
            const ageRange = firstClass ? getAgeRange(firstClass) : '';
            const instructorName = firstClass ? (firstClass.instructor || firstClass.instructorName || '') : '';
            return (
              <>
                {/* Panel Header - sticky so always visible */}
                <div className={`px-6 py-5 border-b flex items-start justify-between flex-shrink-0 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                      ['bg-red-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-600', 'bg-gray-700', 'bg-gray-600', 'bg-gray-800'][
                        (selectedProgramPanel?.charCodeAt(0) || 0) % 7
                      ]
                    }`}>
                      {selectedProgramPanel?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProgramPanel}
                      </h2>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                        {[ageRange, instructorName].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProgramPanelOpen(false);
                        // Pre-fill program name and open Add modal
                        setFormData(prev => ({ ...prev, program: selectedProgramPanel || '', name: selectedProgramPanel || '' }));
                        setIsAddModalOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Time Slot
                    </Button>
                    <SheetClose asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Close</span>
                        ✕
                      </Button>
                    </SheetClose>
                  </div>
                </div>

                {/* Stats bar */}
                <div className={`px-6 py-3 border-b flex items-center gap-6 flex-shrink-0 ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/60'}`}>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Time Slots</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{panelClasses.length}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Total Capacity</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {panelClasses.reduce((s, c) => s + (c.capacity || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Enrolled</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {panelClasses.reduce((s, c) => s + (c.enrolled || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Open Spots</p>
                    <p className={`text-lg font-bold text-green-500`}>
                      {panelClasses.reduce((s, c) => s + Math.max(0, (c.capacity || 0) - (c.enrolled || 0)), 0)}
                    </p>
                  </div>
                </div>

                {/* Class instances list */}
                <div className="flex-1 overflow-y-auto">
                  {panelClasses.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-40 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                      <Calendar className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No class instances yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {panelClasses.map((cls) => {
                        const timeStr = cls.time || '';
                        const dayStr = cls.dayOfWeek || cls.day_of_week || cls.schedule || '';
                        const enrolled = cls.enrolled || 0;
                        const capacity = cls.capacity || 0;
                        const isFull = !cls.is_unlimited_capacity && enrolled >= capacity;
                        const fillPct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
                        return (
                          <div
                            key={cls.id}
                            className={`px-6 py-4 ${isDarkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50/60'} transition-colors`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {/* Day & Time */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {dayStr}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isDarkMode ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {timeStr}
                                  </span>
                                  {isFull && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-500">Full</span>
                                  )}
                                </div>
                                {/* Instructor */}
                                {(cls.instructor || cls.instructorName) && (
                                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                                    {cls.instructor || cls.instructorName}
                                  </p>
                                )}
                                {/* Capacity bar */}
                                <div className="mt-2 flex items-center gap-2">
                                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        fillPct >= 90 ? 'bg-red-500' : fillPct >= 60 ? 'bg-amber-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${fillPct}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                                    {enrolled}/{capacity}
                                  </span>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  title="Edit this time slot"
                                  onClick={() => {
                                    setIsProgramPanelOpen(false);
                                    handleEditClass(cls);
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Delete this time slot"
                                  onClick={() => handleDeleteClass(cls.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  title="Manage Enrollments"
                                  onClick={() => {
                                    setSelectedClassForEnrollment(cls);
                                    setIsEnrollmentModalOpen(true);
                                  }}
                                >
                                  <Users className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

    </ManagementLayout>
  );
}
