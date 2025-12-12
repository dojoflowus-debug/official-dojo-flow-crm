import { useState, useEffect } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Clock, Users, User, MapPin, Edit, Trash2, LayoutGrid, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FloorPlanManager from '../components/FloorPlanManagerNew';

const API_URL = '/api';  // Use relative path to work from any device

// ClassForm component - moved outside to prevent re-creation on every render
const ClassForm = ({ formData, handleInputChange, handleSelectChange, instructors, onSubmit, submitText, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <Label htmlFor="name">Class Name *</Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="e.g., Kids Karate (Ages 5-8)"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Karate">Karate</SelectItem>
            <SelectItem value="Jiu-Jitsu">Jiu-Jitsu</SelectItem>
            <SelectItem value="Taekwondo">Taekwondo</SelectItem>
            <SelectItem value="Kickboxing">Kickboxing</SelectItem>
            <SelectItem value="MMA">MMA</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="level">Level *</Label>
        <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)} required>
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
    </div>

    <div>
      <Label htmlFor="instructor">Instructor *</Label>
      <Select value={formData.instructor} onValueChange={(value) => handleSelectChange('instructor', value)} required>
        <SelectTrigger>
          <SelectValue placeholder="Select instructor" />
        </SelectTrigger>
        <SelectContent>
          {instructors.length === 0 ? (
            <SelectItem value="" disabled>No instructors available</SelectItem>
          ) : (
            instructors.map((instructor) => (
              <SelectItem key={instructor.id} value={instructor.name}>
                {instructor.name} - {instructor.role}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="schedule">Schedule *</Label>
        <Input
          id="schedule"
          name="schedule"
          value={formData.schedule}
          onChange={handleInputChange}
          placeholder="e.g., Mon, Wed, Fri"
          required
        />
      </div>

      <div>
        <Label htmlFor="time">Time *</Label>
        <Input
          id="time"
          name="time"
          value={formData.time}
          onChange={handleInputChange}
          placeholder="e.g., 4:00 PM - 5:00 PM"
          required
        />
      </div>
    </div>

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
          placeholder="8"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="monthlyCost">Monthly Cost ($)</Label>
      <Input
        id="monthlyCost"
        name="monthlyCost"
        type="number"
        step="0.01"
        value={formData.monthlyCost}
        onChange={handleInputChange}
        placeholder="150.00"
      />
    </div>

    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Class description..."
        rows={3}
      />
    </div>

    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{submitText}</Button>
    </div>
  </form>
);

export default function Classes({ onLogout, theme, toggleTheme }) {
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    level: '',
    instructor: '',
    schedule: '',
    time: '',
    capacity: '',
    ageMin: '',
    ageMax: '',
    monthlyCost: '',
    description: ''
  });

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
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      level: '',
      instructor: '',
      schedule: '',
      time: '',
      capacity: '',
      ageMin: '',
      ageMax: '',
      monthlyCost: '',
      description: ''
    });
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity) || 15,
          ageMin: parseInt(formData.ageMin) || null,
          ageMax: parseInt(formData.ageMax) || null,
          monthlyCost: parseFloat(formData.monthlyCost) || null,
          enrolled: 0
        }),
      });

      if (response.ok) {
        toast.success('Class added successfully!');
        setIsAddModalOpen(false);
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

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || '',
      type: classItem.type || '',
      level: classItem.level || '',
      instructor: classItem.instructor || '',
      schedule: classItem.day_of_week || classItem.schedule || '',
      time: classItem.time || '',
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
    
    try {
      const response = await fetch(`${API_URL}/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity) || 15,
          ageMin: parseInt(formData.ageMin) || null,
          ageMax: parseInt(formData.ageMax) || null,
          monthlyCost: parseFloat(formData.monthlyCost) || null,
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
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/40 px-6 py-2">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Classes', href: '/classes' },
          ]}
        />
      </div>

      <div className="p-6 max-w-7xl mx-auto">
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
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <ClassForm 
                formData={formData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                instructors={instructors}
                onSubmit={handleAddClass}
                submitText="Add Class"
                onCancel={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-6 rounded-lg border">
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

          <div className="bg-card p-6 rounded-lg border">
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

          <div className="bg-card p-6 rounded-lg border">
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

          <div className="bg-card p-6 rounded-lg border">
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
          <div className="text-center py-12 bg-card rounded-lg border">
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
              <div key={classItem.id} className="bg-card p-6 rounded-lg border hover:border-primary transition-colors">
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
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <ClassForm 
              formData={formData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              instructors={instructors}
              onSubmit={handleUpdateClass}
              submitText="Update Class"
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingClass(null);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
        
        {/* Floor Plan Manager Modal */}
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

