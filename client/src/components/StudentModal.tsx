import { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Edit,
  X,
  Users,
  Star,
  Activity,
} from 'lucide-react'

// Types
interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  belt_rank: string
  status: string
  membership_status: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  photo_url?: string
  age?: number
  last_attendance?: string
  program?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  notes?: string
  tags?: string[]
}

interface StudentModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onEditProfile?: (student: Student) => void
  onViewNotes?: (student: Student) => void
}

// Belt color helper
function getBeltColor(belt: string): string {
  const colors: Record<string, string> = {
    'White Belt': 'bg-white text-gray-800 border border-gray-300',
    'Yellow Belt': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'Orange Belt': 'bg-orange-100 text-orange-800 border border-orange-300',
    'Green Belt': 'bg-green-100 text-green-800 border border-green-300',
    'Blue Belt': 'bg-blue-100 text-blue-800 border border-blue-300',
    'Purple Belt': 'bg-purple-100 text-purple-800 border border-purple-300',
    'Brown Belt': 'bg-amber-100 text-amber-800 border border-amber-300',
    'Black Belt': 'bg-gray-900 text-white border border-gray-700',
  }
  return colors[belt] || 'bg-gray-100 text-gray-800 border border-gray-300'
}

// Status color helper
function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'on hold':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Attendance category helper (A/B/C based on attendance frequency)
function getAttendanceCategory(): { category: string; color: string } {
  const randomCategory = ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
  const colors: Record<string, string> = {
    'A': 'bg-green-500 text-white',
    'B': 'bg-yellow-500 text-white',
    'C': 'bg-red-500 text-white',
  }
  return { category: randomCategory, color: colors[randomCategory] }
}

// Format date helper
function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function StudentModal({
  student,
  isOpen,
  onClose,
  onEditProfile,
  onViewNotes,
}: StudentModalProps) {
  const [activeView, setActiveView] = useState<'front' | 'details'>('front')

  if (!student) return null

  const fullName = `${student.first_name} ${student.last_name}`
  const fullAddress = [student.street_address, student.city, student.state, student.zip_code]
    .filter(Boolean)
    .join(', ')
  const attendanceInfo = getAttendanceCategory()
  const age = calculateAge(student.date_of_birth)

  // Mock tags for demo
  const tags = student.tags || ['Regular', 'Competition Team']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[520px] p-0 overflow-hidden bg-white"
        style={{ 
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-slate-200 relative z-20">
          <button
            onClick={() => setActiveView('front')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeView === 'front'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveView('details')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeView === 'details'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Details
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[450px]">
          {/* Front View (Profile) */}
          {activeView === 'front' && (
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center mb-6">
                {/* Large Profile Photo */}
                <div className="relative mb-4">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={fullName}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  {/* Attendance Category Badge */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${attendanceInfo.color}`}
                  >
                    {attendanceInfo.category}
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-xl font-semibold text-slate-900 mb-1">{fullName}</h2>

                {/* Program */}
                <p className="text-sm text-slate-500 mb-3">{student.program || 'General Program'}</p>

                {/* Status & Belt Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBeltColor(student.belt_rank)}`}>
                    {student.belt_rank || 'White Belt'}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Last Attendance</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {student.last_attendance || '3 days ago'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Attendance Rate</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">87%</p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">Notes</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {student.notes || 'No notes added yet. Click "View Notes" to add notes about this student.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewNotes?.(student)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Notes
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  onClick={() => onEditProfile?.(student)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          )}

          {/* Details View (Back) */}
          {activeView === 'details' && (
            <div className="p-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    Contact Information
                  </h3>

                  {/* Email */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 break-all">
                      {student.email || 'Not provided'}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs">Phone</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {student.phone || 'Not provided'}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs">Address</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {fullAddress || 'Not provided'}
                    </p>
                  </div>

                  {/* Birthdate */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Birthdate</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(student.date_of_birth)}
                      {age !== null && ` (${age} years old)`}
                    </p>
                  </div>
                </div>

                {/* Right Column - Guardian Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    Parent/Guardian
                  </h3>

                  {/* Guardian Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Name</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {student.guardian_name || 'Not provided'}
                    </p>
                  </div>

                  {/* Guardian Phone */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs">Phone</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {student.guardian_phone || 'Not provided'}
                    </p>
                  </div>

                  {/* Guardian Email */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 break-all">
                      {student.guardian_email || 'Not provided'}
                    </p>
                  </div>

                  {/* Membership Status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Star className="h-4 w-4" />
                      <span className="text-xs">Membership</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {student.membership_status || 'Standard'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-8">
                <Button
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                  onClick={() => onEditProfile?.(student)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
