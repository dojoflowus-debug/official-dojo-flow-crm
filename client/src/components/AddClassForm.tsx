import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useToast } from '../hooks/use-toast';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AddClassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddClassForm: React.FC<AddClassFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  
  // Fetch instructors list
  const instructorsQuery = trpc.classes.getInstructors.useQuery();
  
  const [formData, setFormData] = useState({
    name: '',
    program: '',
    instructor: '',
    dayOfWeek: [] as string[],
    startTime: '',
    endTime: '',
    room: '',
    floorPlan: '',
    capacity: 20,
    level: '',
    ageRange: '',
    notes: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate duration from start/end times
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Create class for each selected day
    formData.dayOfWeek.forEach(day => {
      createMutation.mutate({
        name: formData.name,
        program: formData.program,
        instructor: formData.instructor,
        dayOfWeek: day,
        time: formData.startTime,
        room: formData.room,
        capacity: formData.capacity,
        level: formData.level,
        ageRange: formData.ageRange,
        duration: duration,
      });
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.includes(day)
        ? prev.dayOfWeek.filter(d => d !== day)
        : [...prev.dayOfWeek, day]
    }));
  };

  const adjustCapacity = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      capacity: Math.max(1, prev.capacity + delta)
    }));
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* Section 1: Program & Instructor */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program & Instructor</div>
          
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Class Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kids Karate"
              className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="program" className="text-sm font-medium text-gray-700">Program</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="Karate"
                className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <Label htmlFor="instructor" className="text-sm font-medium text-gray-700">Instructor</Label>
              {instructorsQuery.isLoading ? (
                <div className="text-sm text-gray-400 mt-2">Loading...</div>
              ) : instructorsQuery.data && instructorsQuery.data.length > 0 ? (
                <Select
                  value={formData.instructor}
                  onValueChange={(value) => setFormData({ ...formData, instructor: value })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl border-gray-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorsQuery.data.map(instructor => (
                      <SelectItem key={instructor.id} value={instructor.name}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-2 text-sm text-amber-600 bg-amber-50/50 border border-amber-200 rounded-xl p-3">
                  <p className="font-medium">No instructors</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-amber-700 hover:text-amber-800"
                    onClick={() => window.location.href = '/staff'}
                  >
                    Add staff →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle Separator */}
        <div className="border-t border-gray-100" />

        {/* Section 2: Schedule */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Schedule</div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.dayOfWeek.includes(day)
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>
        </div>

        {/* Subtle Separator */}
        <div className="border-t border-gray-100" />

        {/* Section 3: Location */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="room" className="text-sm font-medium text-gray-700">Room/Mat</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Main Dojo"
                className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <Label htmlFor="floorPlan" className="text-sm font-medium text-gray-700">Floor Plan</Label>
              <Input
                id="floorPlan"
                value={formData.floorPlan}
                onChange={(e) => setFormData({ ...formData, floorPlan: e.target.value })}
                placeholder="Optional"
                className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Subtle Separator */}
        <div className="border-t border-gray-100" />

        {/* Section 4: Capacity & Level */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacity & Level</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Capacity</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustCapacity(-1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                  {formData.capacity}
                </span>
                <button
                  type="button"
                  onClick={() => adjustCapacity(1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="level" className="text-sm font-medium text-gray-700">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger className="mt-1.5 rounded-xl border-gray-200">
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
        </div>

        {/* Advanced Options Accordion */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Advanced Options</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="p-4 space-y-4 bg-white">
              <div>
                <Label htmlFor="ageRange" className="text-sm font-medium text-gray-700">Age Range</Label>
                <Input
                  id="ageRange"
                  value={formData.ageRange}
                  onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                  placeholder="e.g., Kids 4-7, Adults 18+"
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions or requirements"
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isLoading || formData.dayOfWeek.length === 0 || !formData.startTime || !formData.endTime}
          className="rounded-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isLoading ? 'Adding...' : 'Add Class'}
        </Button>
      </div>
    </div>
  );
};
