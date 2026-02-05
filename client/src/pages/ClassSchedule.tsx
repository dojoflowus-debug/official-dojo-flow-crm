/**
 * ClassSchedule - Centralized class schedule management
 * Allows viewing and managing class schedules across all locations
 * Serves as the source of truth for chatbot and other features
 */

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, MapPin, Edit, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ClassSchedule: React.FC = () => {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch classes
  const classesQuery = trpc.classes.getAll.useQuery();
  const classes = classesQuery.data || [];

  // Filter classes by selected day
  const filteredClasses = selectedDay === 'all' 
    ? classes 
    : classes.filter(c => c.dayOfWeek === selectedDay);

  // Group classes by day of week
  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = classes.filter(c => c.dayOfWeek === day && c.isActive);
    return acc;
  }, {} as Record<string, typeof classes>);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Schedule</h1>
            <p className="text-gray-600 mt-1">Manage your class schedules across all locations</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>

        {/* Day Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedDay === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedDay('all')}
            className={selectedDay === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            All Days
          </Button>
          {DAYS_OF_WEEK.map(day => (
            <Button
              key={day}
              variant={selectedDay === day ? 'default' : 'outline'}
              onClick={() => setSelectedDay(day)}
              className={selectedDay === day ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Weekly View */}
        {selectedDay === 'all' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {DAYS_OF_WEEK.map(day => (
              <Card key={day} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                    {day}
                    <Badge variant="secondary" className="ml-auto">
                      {classesByDay[day]?.length || 0} classes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {classesByDay[day]?.length > 0 ? (
                    classesByDay[day].map(classItem => (
                      <ClassCard key={classItem.id} classItem={classItem} />
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">No classes scheduled</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Single Day View */
          <div className="space-y-4">
            {filteredClasses.length > 0 ? (
              filteredClasses.map(classItem => (
                <Card key={classItem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{classItem.name}</h3>
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {classItem.program || 'General'}
                          </Badge>
                          {classItem.level && (
                            <Badge variant="secondary">{classItem.level}</Badge>
                          )}
                          {classItem.ageRange && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">{classItem.ageRange}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-red-600" />
                            <span>{classItem.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 text-red-600" />
                            <span>{classItem.enrolled}/{classItem.capacity} enrolled</span>
                          </div>
                          {classItem.instructor && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="font-medium">👤 {classItem.instructor}</span>
                            </div>
                          )}
                          {classItem.room && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-red-600" />
                              <span>{classItem.room}</span>
                            </div>
                          )}
                        </div>

                        {/* Capacity Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Capacity</span>
                            <span>{Math.round((classItem.enrolled / classItem.capacity) * 100)}% full</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                classItem.enrolled >= classItem.capacity 
                                  ? 'bg-red-600' 
                                  : classItem.enrolled / classItem.capacity > 0.8 
                                  ? 'bg-orange-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((classItem.enrolled / classItem.capacity) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No classes scheduled for {selectedDay}</p>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <AddClassForm 
            onSuccess={() => {
              setShowAddDialog(false);
              classesQuery.refetch();
              toast({
                title: "Success",
                description: "Class added successfully",
              });
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

// Compact class card for weekly vieww
const ClassCard: React.FC<{ classItem: any }> = ({ classItem }) => {
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{classItem.name}</h4>
        <Badge variant="outline" className="text-xs">
          {classItem.enrolled}/{classItem.capacity}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <Clock className="w-3 h-3" />
        <span>{classItem.time}</span>
      </div>
      {classItem.instructor && (
        <p className="text-xs text-gray-500">👤 {classItem.instructor}</p>
      )}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${
            classItem.enrolled >= classItem.capacity 
              ? 'bg-red-600' 
              : classItem.enrolled / classItem.capacity > 0.8 
              ? 'bg-orange-500' 
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min((classItem.enrolled / classItem.capacity) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Add Class Form Component
const AddClassForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  
  // Fetch instructors list
  const instructorsQuery = trpc.classes.getInstructors.useQuery();
  const [formData, setFormData] = useState({
    name: '',
    dayOfWeek: 'Monday',
    time: '',
    capacity: 20,
    instructor: '',
    program: '',
    level: '',
    room: '',
    duration: 60,
    ageRange: '',
  });

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
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
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Class Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Kids Karate"
            required
          />
        </div>

        <div>
          <Label htmlFor="dayOfWeek">Day of Week *</Label>
          <Select
            value={formData.dayOfWeek}
            onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            min="1"
            required
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            min="15"
            step="15"
          />
        </div>

        <div>
          <Label htmlFor="instructor">Instructor</Label>
          {instructorsQuery.isLoading ? (
            <div className="text-sm text-gray-500">Loading instructors...</div>
          ) : instructorsQuery.data && instructorsQuery.data.length > 0 ? (
            <Select
              value={formData.instructor}
              onValueChange={(value) => setFormData({ ...formData, instructor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructorsQuery.data.map(instructor => (
                  <SelectItem key={instructor.id} value={instructor.name}>
                    {instructor.name} ({instructor.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="font-medium mb-1">No instructors found</p>
              <p>Please add team members with instructor, coach, or trainer role before creating classes.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => window.location.href = '/staff'}
              >
                Go to Staff Management →
              </Button>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="program">Program</Label>
          <Input
            id="program"
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            placeholder="e.g., Karate, BJJ, MMA"
          />
        </div>

        <div>
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            placeholder="e.g., Beginner, Advanced"
          />
        </div>

        <div>
          <Label htmlFor="room">Room/Location</Label>
          <Input
            id="room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="e.g., Main Dojo, Studio A"
          />
        </div>

        <div>
          <Label htmlFor="ageRange">Age Range</Label>
          <Input
            id="ageRange"
            value={formData.ageRange}
            onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
            placeholder="e.g., Kids 4-7, Teens 13-17, Adults 18+"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-red-600 hover:bg-red-700"
          disabled={createMutation.isPending || !instructorsQuery.data || instructorsQuery.data.length === 0}
        >
          {createMutation.isPending ? 'Adding...' : 'Add Class'}
        </Button>
      </div>
    </form>
  );
};
