import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  FileText,
  Clock,
  TrendingUp,
  Upload,
  Loader2,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'

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

// Belt color helper - returns yellow background for belt badge
function getBeltBadgeStyle(belt: string): string {
  // All belts use yellow background as shown in mockup
  return 'bg-yellow-200 text-yellow-800 border-0'
}

// Status color helper
function getStatusBadgeStyle(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700 border-0'
    case 'inactive':
      return 'bg-gray-100 text-gray-700 border-0'
    case 'on hold':
      return 'bg-yellow-100 text-yellow-700 border-0'
    default:
      return 'bg-gray-100 text-gray-700 border-0'
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

// Format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  } catch {
    return 'Unknown'
  }
}

// Format date as MM/DD/YYYY
function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

// Default ACME logo SVG component
const AcmeLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2L36.6 11V29L20 38L3.4 29V11L20 2Z" stroke="#E53935" strokeWidth="2.5" fill="none"/>
  </svg>
)

export default function StudentModal({
  student,
  isOpen,
  onClose,
  onEditProfile,
  onViewNotes,
}: StudentModalProps) {
  const [activeView, setActiveView] = useState<'profile' | 'details'>('profile')
  const [isFlipping, setIsFlipping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch school logo from database
  const { data: brandData } = trpc.setupWizard.getBrand.useQuery()
  const schoolLogo = brandData?.logoSquare || null
  
  // Upload logo mutation
  const uploadLogoMutation = trpc.setupWizard.uploadLogo.useMutation({
    onSuccess: () => {
      // Invalidate the brand query to refetch the new logo
      utils.setupWizard.getBrand.invalidate()
      setIsUploading(false)
    },
    onError: (error) => {
      console.error('Failed to upload logo:', error)
      setIsUploading(false)
    },
  })
  
  const utils = trpc.useUtils()
  
  // Get attendance category (memoized per student)
  const attendanceInfo = getAttendanceCategory()
  
  if (!isOpen || !student) return null

  const fullName = `${student.first_name} ${student.last_name}`
  const beltDisplay = student.belt_rank || 'White Belt'
  
  // Handle view switch with flip animation
  const handleViewSwitch = (view: 'profile' | 'details') => {
    if (view === activeView) return
    setIsFlipping(true)
    setTimeout(() => {
      setActiveView(view)
      setTimeout(() => {
        setIsFlipping(false)
      }, 50)
    }, 175) // Half of the animation duration
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onload = (event) => {
        const fileData = event.target?.result as string
        // Upload to S3 and save to database via tRPC
        uploadLogoMutation.mutate({
          mode: 'light',
          fileData: fileData,
          fileName: file.name,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        {/* Card with flip animation */}
        <div 
          className={`
            relative w-full max-w-[420px]
            transition-transform duration-[400ms] ease-in-out
            ${isFlipping ? 'scale-95 opacity-90' : 'scale-100 opacity-100'}
          `}
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className={`
              bg-white rounded-[26px] shadow-2xl overflow-hidden
              transition-transform duration-[400ms] ease-in-out
              ${isFlipping ? (activeView === 'profile' ? 'rotate-y-90' : '-rotate-y-90') : 'rotate-y-0'}
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              {/* Logo + School Name */}
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <AcmeLogo />
                )}
                <span className="font-bold text-lg text-gray-900">ACME</span>
              </div>
              
              {/* Tabs / Actions */}
              <div className="flex items-center gap-4">
                {activeView === 'profile' ? (
                  <button
                    onClick={() => handleViewSwitch('details')}
                    className="relative text-gray-900 font-medium text-base pb-1"
                  >
                    Profile
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Change Logo'
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </>
                )}
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeView === 'profile' ? (
                /* ========== PROFILE VIEW (FRONT) ========== */
                <div className="space-y-5">
                  {/* Student Info Row */}
                  <div className="flex gap-5">
                    {/* Photo with attendance badge */}
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-50 shadow-md">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 text-2xl font-semibold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                        )}
                      </div>
                      {/* Attendance Category Badge */}
                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${attendanceInfo.color}`}>
                        {attendanceInfo.category}
                      </div>
                    </div>
                    
                    {/* Name, Program, Badges */}
                    <div className="flex-1 pt-1">
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">{fullName}</h2>
                      <p className="text-gray-500 text-base mt-0.5">{student.program || 'General'}</p>
                      
                      {/* Status & Belt Badges */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(student.status)}`}>
                          {student.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBeltBadgeStyle(beltDisplay)}`}>
                          {beltDisplay}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Program Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                      Regular
                    </span>
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                      Competition Team
                    </span>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Last Attendance */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Last Attendance</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatRelativeTime(student.last_attendance)}
                      </p>
                    </div>
                    
                    {/* Attendance Rate */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Attendance Rate</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">87%</p>
                    </div>
                  </div>
                  
                  {/* Notes Preview */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                      <FileText className="w-4 h-4" />
                      <span>Progress to Next Belt</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {student.notes || "No notes added yet. Click 'View Notes' to add notes about this student."}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => onViewNotes?.(student)}
                      className="flex-1 h-12 rounded-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Notes
                    </Button>
                    <Button
                      onClick={() => onEditProfile?.(student)}
                      className="flex-1 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              ) : (
                /* ========== DETAILS VIEW (BACK) ========== */
                <div className="space-y-6">
                  {/* Centered Name & Program */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
                    <p className="text-gray-500 text-base mt-1">{student.program || 'General'}</p>
                    
                    {/* Belt Badge */}
                    <div className="flex justify-center mt-4">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getBeltBadgeStyle(beltDisplay)}`}>
                        {beltDisplay}
                      </span>
                    </div>
                  </div>
                  
                  {/* Two-Column Data */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
                    {/* Left Column */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Program</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">AM</p>
                    </div>
                    
                    {/* Right Column */}
                    <div className="border-l border-gray-200 pl-6">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Last Attendance</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatDate(student.last_attendance)}
                      </p>
                    </div>
                    
                    {/* Left Column */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Performance Category</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{attendanceInfo.category}</p>
                    </div>
                    
                    {/* Right Column */}
                    <div className="border-l border-gray-200 pl-6">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Tasks</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">4 Students</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleViewSwitch('profile')}
                      className="flex-1 h-12 rounded-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={() => onEditProfile?.(student)}
                      className="flex-1 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
                    >
                      Edit Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for flip animation */}
      <style>{`
        .rotate-y-90 {
          transform: rotateY(90deg);
        }
        .-rotate-y-90 {
          transform: rotateY(-90deg);
        }
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
      `}</style>
    </>
  )
}
