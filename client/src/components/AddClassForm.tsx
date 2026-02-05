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
      {/* Scrollable Form Content - Single Column, iOS Settings Style */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        
        {/* Class Name - Full Width */}
        <div>
          <Label htmlFor="name" className="text-base font-medium text-gray-900 mb-2 block">Class Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Kids Karate"
            className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            required
          />
        </div>

        {/* Program - Full Width */}
        <div>
          <Label htmlFor="program" className="text-base font-medium text-gray-900 mb-2 block">Program</Label>
          <Input
            id="program"
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            placeholder="Karate"
            className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        {/* Instructor - Full Width */}
        <div>
          <Label htmlFor="instructor" className="text-base font-medium text-gray-900 mb-2 block">Instructor</Label>
          {instructorsQuery.isLoading ? (
            <div className="text-base text-gray-400 py-3">Loading...</div>
          ) : instructorsQuery.data && instructorsQuery.data.length > 0 ? (
            <Select
              value={formData.instructor}
              onValueChange={(value) => setFormData({ ...formData, instructor: value })}
            >
              <SelectTrigger className="h-12 text-base rounded-xl border-gray-200">
                <SelectValue placeholder="Select instructor" />
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
            <div className="text-sm text-amber-600 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
              <p className="font-medium mb-1">No instructors found</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-amber-700 hover:text-amber-800 font-medium"
                onClick={() => window.location.href = '/staff'}
              >
                Add staff →
              </Button>
            </div>
          )}
        </div>

        {/* Days - Full Width with Pills */}
        <div>
          <Label className="text-base font-medium text-gray-900 mb-3 block">Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  formData.dayOfWeek.includes(day)
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Start Time - Full Width */}
        <div>
          <Label htmlFor="startTime" className="text-base font-medium text-gray-900 mb-2 block">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            required
          />
        </div>

        {/* End Time - Full Width */}
        <div>
          <Label htmlFor="endTime" className="text-base font-medium text-gray-900 mb-2 block">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            required
          />
        </div>

        {/* Room - Full Width */}
        <div>
          <Label htmlFor="room" className="text-base font-medium text-gray-900 mb-2 block">Room/Mat</Label>
          <Input
            id="room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="Main Dojo"
            className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        {/* Capacity - Full Width with Stepper */}
        <div>
          <Label className="text-base font-medium text-gray-900 mb-3 block">Capacity</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => adjustCapacity(-1)}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-3xl font-semibold text-gray-900 min-w-[60px] text-center">
              {formData.capacity}
            </span>
            <button
              type="button"
              onClick={() => adjustCapacity(1)}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Level - Full Width */}
        <div>
          <Label htmlFor="level" className="text-base font-medium text-gray-900 mb-2 block">Level</Label>
          <Select
            value={formData.level}
            onValueChange={(value) => setFormData({ ...formData, level: value })}
          >
            <SelectTrigger className="h-12 text-base rounded-xl border-gray-200">
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

        {/* Advanced Options Accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-base font-medium text-gray-700">Advanced Options</span>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-5 px-1">
              {/* Floor Plan */}
              <div>
                <Label htmlFor="floorPlan" className="text-base font-medium text-gray-900 mb-2 block">Floor Plan</Label>
                <Input
                  id="floorPlan"
                  value={formData.floorPlan}
                  onChange={(e) => setFormData({ ...formData, floorPlan: e.target.value })}
                  placeholder="Optional"
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Age Range */}
              <div>
                <Label htmlFor="ageRange" className="text-base font-medium text-gray-900 mb-2 block">Age Range</Label>
                <Input
                  id="ageRange"
                  value={formData.ageRange}
                  onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                  placeholder="e.g., Kids 4-7, Adults 18+"
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium text-gray-900 mb-2 block">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions or requirements"
                  rows={3}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Bottom Bar */}
      <div className="border-t border-gray-200 px-8 py-4 bg-white flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="px-6 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-full"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isLoading || formData.dayOfWeek.length === 0 || !formData.startTime || !formData.endTime}
          className="rounded-full px-8 py-2 h-auto text-base bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isLoading ? 'Adding...' : 'Add Class'}
        </Button>
      </div>
    </div>
  );
};
