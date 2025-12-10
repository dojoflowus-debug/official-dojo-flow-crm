import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Calendar, Clock, Users } from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const CLASS_TYPES = [
  'Karate',
  'Jiu-Jitsu',
  'Taekwondo',
  'Kung Fu',
  'Muay Thai',
  'Boxing',
  'MMA',
  'Kickboxing',
  'Other'
]

const BELT_LEVELS = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Kids',
  'Adults'
]

export default function Step3Classes({ data, updateData }) {
  const [classes, setClasses] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClass, setNewClass] = useState({
    class_name: '',
    class_type: 'Karate',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '19:00',
    instructor_name: '',
    belt_level: 'All Levels',
    max_capacity: 20
  })

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/settings/class-schedules')
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const handleAddClass = async () => {
    try {
      const response = await fetch('/api/settings/class-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass)
      })

      if (response.ok) {
        await loadClasses()
        setShowAddForm(false)
        setNewClass({
          class_name: '',
          class_type: 'Karate',
          day_of_week: 1,
          start_time: '18:00',
          end_time: '19:00',
          instructor_name: '',
          belt_level: 'All Levels',
          max_capacity: 20
        })
      } else {
        alert('Failed to add class')
      }
    } catch (error) {
      console.error('Error adding class:', error)
      alert('Failed to add class')
    }
  }

  const handleDeleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const response = await fetch(`/api/settings/class-schedules/${classId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadClasses()
      } else {
        alert('Failed to delete class')
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Failed to delete class')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Class Schedule</h2>
        <p className="text-muted-foreground">
          Set up your class schedule. You can add, edit, or remove classes at any time.
        </p>
      </div>

      {/* Existing Classes */}
      {classes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Current Classes</h3>
          {classes.map((cls) => (
            <Card key={cls.id} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{cls.class_name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
                        {cls.class_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {DAYS_OF_WEEK.find(d => d.value === cls.day_of_week)?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {cls.start_time} - {cls.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cls.belt_level}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClass(cls.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Class Button */}
      {!showAddForm && (
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Class
        </Button>
      )}

      {/* Add Class Form */}
      {showAddForm && (
        <Card className="border-border/40 bg-muted/20">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Add New Class</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input
                  placeholder="Beginner Karate"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Class Type</Label>
                <Select
                  value={newClass.class_type}
                  onValueChange={(value) => setNewClass({ ...newClass, class_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={newClass.day_of_week.toString()}
                  onValueChange={(value) => setNewClass({ ...newClass, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Belt Level</Label>
                <Select
                  value={newClass.belt_level}
                  onValueChange={(value) => setNewClass({ ...newClass, belt_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BELT_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newClass.start_time}
                  onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newClass.end_time}
                  onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Instructor Name (optional)</Label>
                <Input
                  placeholder="Sensei John"
                  value={newClass.instructor_name}
                  onChange={(e) => setNewClass({ ...newClass, instructor_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newClass.max_capacity}
                  onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddClass}
                disabled={!newClass.class_name}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Add Class
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {classes.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No classes added yet. Click "Add New Class" to get started.</p>
        </div>
      )}
    </div>
  )
}

