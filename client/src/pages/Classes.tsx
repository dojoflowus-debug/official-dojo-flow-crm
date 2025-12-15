import { useState, useEffect } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Clock, Users, User, MapPin, Edit, Trash2, LayoutGrid, Eye, CheckCircle, DollarSign, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FloorPlanManager from '../components/FloorPlanManagerNew';

const API_URL = '/api';  // Use relative path to work from any device

// Dark mode hook wrapper
const useDarkMode = () => {
  const { theme } = useTheme()
  return theme === 'dark' || theme === 'cinematic'
}

// ClassForm component - moved outside to prevent re-creation on every render
// Day selector chips component
const DayChip = ({ day, selected, onClick, isDark }: { day: string; selected: boolean; onClick: () => void; isDark: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      selected
        ? 'bg-primary text-primary-foreground shadow-sm'
        : isDark
          ? 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
    }`}
  >
    {day}
  </button>
);

// Section header component
const SectionHeader = ({ icon: Icon, title, isDark }: { icon: any; title: string; isDark: boolean }) => (
  <div className={`flex items-center gap-2 pb-3 mb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
    <Icon className={`w-4 h-4 ${isDark ? 'text-primary' : 'text-primary'}`} />
    <span className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
      {title}
    </span>
  </div>
);

const ClassForm = ({ 
  formData, 
  handleInputChange, 
  handleSelectChange, 
  handleDayToggle,
  instructors, 
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
  onSubmit: (e: any) => void;
  submitText: string;
  onCancel: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  timeError: string;
  isDark: boolean;
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* SECTION A: Program */}
      <div>
        <SectionHeader icon={Calendar} title="Program" isDark={isDark} />
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="program">Program *</Label>
            <Select value={formData.program} onValueChange={(value) => handleSelectChange('program', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Little Ninjas">Little Ninjas</SelectItem>
                <SelectItem value="Kids Martial Arts">Kids Martial Arts</SelectItem>
                <SelectItem value="Teens">Teens</SelectItem>
                <SelectItem value="Adults">Adults</SelectItem>
                <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                <SelectItem value="Jiu-Jitsu">Jiu-Jitsu</SelectItem>
                <SelectItem value="MMA">MMA</SelectItem>
                <SelectItem value="Private Lessons">Private Lessons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
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
              <Label htmlFor="instructor">Instructor *</Label>
              <Select value={formData.instructor} onValueChange={(value) => handleSelectChange('instructor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.length === 0 ? (
                    <SelectItem value="__no_instructors__" disabled>No instructors available</SelectItem>
                  ) : (
                    instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.name}>
                        {instructor.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Class Display Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Kids Beginner – Mon/Wed"
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Optional label shown on schedules
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: Schedule */}
      <div>
        <SectionHeader icon={Clock} title="Schedule" isDark={isDark} />
        
        <div className="space-y-4">
          <div>
            <Label>Days *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          {timeError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {timeError}
            </div>
          )}

          <div>
            <Label htmlFor="room">Room / Mat</Label>
            <Input
              id="room"
              name="room"
              value={formData.room}
              onChange={handleInputChange}
              placeholder="e.g., Mat A, Room 2"
            />
          </div>
        </div>
      </div>

      {/* SECTION C: Enrollment Rules */}
      <div>
        <SectionHeader icon={Users} title="Enrollment Rules" isDark={isDark} />
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              placeholder="15"
              required
            />
          </div>

          <div>
            <Label htmlFor="ageMin">Min Age</Label>
            <Input
              id="ageMin"
              name="ageMin"
              type="number"
              value={formData.ageMin}
              onChange={handleInputChange}
              placeholder="5"
            />
          </div>

          <div>
            <Label htmlFor="ageMax">Max Age</Label>
            <Input
              id="ageMax"
              name="ageMax"
              type="number"
              value={formData.ageMax}
              onChange={handleInputChange}
              placeholder="12"
            />
          </div>
        </div>
      </div>

      {/* Advanced Section (Collapsed by default) */}
      <div className={`rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full flex items-center justify-between p-3 text-sm font-medium ${
            isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showAdvanced && (
          <div className={`px-3 pb-3 pt-0 space-y-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="pt-3">
              <Label htmlFor="monthlyCost">Pricing Override ($)</Label>
              <Input
                id="monthlyCost"
                name="monthlyCost"
                type="number"
                step="0.01"
                value={formData.monthlyCost}
                onChange={handleInputChange}
                placeholder="Override program pricing"
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Leave empty to use program default pricing
              </p>
            </div>

            <div>
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Internal notes about this class time..."
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={formData.days.length === 0}>
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default function Classes({ onLogout, theme, toggleTheme }) {
  const isDarkMode = useDarkMode()
  const [classes, setClasses] = useState([]);
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
  const [instructors, setInstructors] = useState([]);
  
  // Floor plan modal state
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [selectedClassForFloorPlan, setSelectedClassForFloorPlan] = useState(null);
  
  // Success confirmation modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdClass, setCreatedClass] = useState<{
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

  // Fetch classes and instructors on component mount
  useEffect(() => {
    fetchClasses();
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await fetch(`${API_URL}/staff/instructors`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setInstructors(data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

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
        // Store the created class details for the success modal
        setCreatedClass({ ...formData });
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
    
    setFormData({
      name: classItem.name || '',
      program: classItem.type || '',
      level: classItem.level || '',
      instructor: classItem.instructor || '',
      days: daysArray,
      startTime: startTime,
      endTime: endTime,
      room: classItem.room || '',
      capacity: classItem.capacity?.toString() || '',
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Schedule</h1>
            <p className="text-muted-foreground">Manage your dojo's class schedule and enrollment</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Class Time</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a recurring class time under an existing program.
                </p>
              </DialogHeader>
              <ClassForm 
                formData={formData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                handleDayToggle={handleDayToggle}
                instructors={instructors}
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
            </DialogContent>
          </Dialog>
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
            {classes.map((classItem) => (
              <div key={classItem.id} className={`p-6 rounded-lg border hover:border-primary transition-colors ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-card'}`}>
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
                </div>

                {classItem.monthly_cost && (
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-primary">
                      ${classItem.monthly_cost}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Class Time</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update the class time details.
              </p>
            </DialogHeader>
            <ClassForm 
              formData={formData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              handleDayToggle={handleDayToggle}
              instructors={instructors}
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
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setIsSuccessModalOpen(false);
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Class
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
      </div>
    </BottomNavLayout>
  );
}

