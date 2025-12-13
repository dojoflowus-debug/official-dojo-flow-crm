import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  X,
  Search,
  Plus,
  User,
  Clock,
  FileText,
  Tag,
  Send,
} from 'lucide-react'

// Types
interface Student {
  id: number
  first_name: string
  last_name: string
}

interface Note {
  id: number
  content: string
  category: string
  instructor_name: string
  created_at: string
}

interface NotesDrawerProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onAddNote?: (studentId: number, content: string, category: string) => void
}

// Note categories
const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-slate-100 text-slate-700' },
  { value: 'progress', label: 'Progress', color: 'bg-green-100 text-green-700' },
  { value: 'incident', label: 'Incident', color: 'bg-red-100 text-red-700' },
  { value: 'attendance', label: 'Attendance', color: 'bg-blue-100 text-blue-700' },
  { value: 'behavior', label: 'Behavior', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'achievement', label: 'Achievement', color: 'bg-purple-100 text-purple-700' },
  { value: 'parent-contact', label: 'Parent Contact', color: 'bg-orange-100 text-orange-700' },
  { value: 'message', label: 'Messages', color: 'bg-red-100 text-red-700' },
]

// Mock notes data for demo
const MOCK_NOTES: Note[] = [
  {
    id: 1,
    content: 'Excellent progress in sparring class today. Showed great improvement in footwork and defensive techniques.',
    category: 'progress',
    instructor_name: 'Sensei Mike',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    content: 'Missed last two classes. Parent mentioned family vacation. Will return next week.',
    category: 'attendance',
    instructor_name: 'Sensei Sarah',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    content: 'Earned yellow stripe on belt! Very proud moment - worked hard for this.',
    category: 'achievement',
    instructor_name: 'Sensei Mike',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    content: 'Had a minor disagreement with another student during partner drills. Resolved quickly after discussion.',
    category: 'incident',
    instructor_name: 'Sensei David',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get category info
function getCategoryInfo(categoryValue: string) {
  return NOTE_CATEGORIES.find(c => c.value === categoryValue) || NOTE_CATEGORIES[0]
}

export default function NotesDrawer({
  student,
  isOpen,
  onClose,
  onAddNote,
}: NotesDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES)
  const [isAdding, setIsAdding] = useState(false)

  // Reset state when drawer opens with new student
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setNewNoteContent('')
      setSelectedCategory('general')
      setIsAdding(false)
    }
  }, [isOpen, student?.id])

  if (!student) return null

  const fullName = `${student.first_name} ${student.last_name}`

  // Filter notes by search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      note.content.toLowerCase().includes(query) ||
      note.instructor_name.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query)
    )
  })

  // Handle adding a new note
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return

    const newNote: Note = {
      id: Date.now(),
      content: newNoteContent,
      category: selectedCategory,
      instructor_name: 'You',
      created_at: new Date().toISOString(),
    }

    setNotes([newNote, ...notes])
    setNewNoteContent('')
    setSelectedCategory('general')
    setIsAdding(false)

    // Call external handler if provided
    onAddNote?.(student.id, newNoteContent, selectedCategory)
  }

  return (
    <>
      {/* Backdrop - z-index higher than modal backdrop (9990) but lower than drawer */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer - z-index highest (above modal at 9995) */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-[10000] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              <p className="text-sm text-slate-500">{fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Add Note Section */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          {!isAdding ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-slate-600 border-dashed"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add a new note
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Write your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[100px] resize-none bg-white"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px] bg-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${category.color.split(' ')[0]}`} />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false)
                    setNewNoteContent('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">
                {searchQuery
                  ? 'No notes match your search'
                  : 'No notes yet. Add your first note above.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotes.map((note) => {
                const categoryInfo = getCategoryInfo(note.category)
                return (
                  <div key={note.id} className="p-4 hover:bg-slate-50 transition-colors">
                    {/* Note Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {note.instructor_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(note.created_at)}
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="mb-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${categoryInfo.color}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                    </div>

                    {/* Note Content */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} for this student
          </p>
        </div>
      </div>
    </>
  )
}
