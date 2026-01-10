import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc'

interface StudentNotesDrawerProps {
  studentId: number
  studentName: string
  isOpen: boolean
  onClose: () => void
}

export function StudentNotesDrawer({
  studentId,
  studentName,
  isOpen,
  onClose,
}: StudentNotesDrawerProps) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch student notes
  const { data: studentNotes } = trpc.students.getNotes.useQuery(
    { studentId },
    { enabled: isOpen && !!studentId }
  )

  // Add/update note mutation
  const addNoteMutation = trpc.students.addNote.useMutation({
    onSuccess: () => {
      setHasChanges(false)
      setIsSaving(false)
    },
    onError: (error) => {
      console.error('Failed to save notes:', error)
      setIsSaving(false)
    },
  })

  // Load notes when drawer opens or student changes
  useEffect(() => {
    if (isOpen && studentNotes) {
      // Combine all notes into a single text
      const allNotes = studentNotes
        .map(note => `[${new Date(note.createdAt).toLocaleDateString()}] ${note.content}`)
        .join('\n\n')
      setNotes(allNotes)
      setHasChanges(false)
    }
  }, [isOpen, studentNotes])

  const handleSave = async () => {
    if (!hasChanges || !notes.trim()) return
    
    setIsSaving(true)
    try {
      await addNoteMutation.mutateAsync({
        studentId,
        content: notes,
      })
    } catch (error) {
      console.error('Error saving notes:', error)
      setIsSaving(false)
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    setHasChanges(true)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Notes</h2>
            <p className="text-sm text-slate-400 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add notes about this student..."
            className="w-full h-full min-h-96 bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none focus:bg-white/10 focus:border-white/20 transition-colors duration-200"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
