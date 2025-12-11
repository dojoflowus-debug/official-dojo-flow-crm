import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
import {
  X,
  FileText,
  Clock,
  TrendingUp,
  Loader2,
  Save,
  MapPin,
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
  guardian_relationship?: string
  guardian_phone?: string
  guardian_email?: string
  notes?: string
  tags?: string[]
  latitude?: string
  longitude?: string
}

interface StudentModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onEditProfile?: (student: Student) => void
  onViewNotes?: (student: Student) => void
  onCloseNotesDrawer?: () => void
  onStudentUpdated?: () => void
  onViewOnMap?: (student: Student) => void
  isFullMapMode?: boolean
}

// Belt color helper
function getBeltBadgeStyle(belt: string): string {
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

// Attendance category helper
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
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  } catch {
    return 'Unknown'
  }
}

// Format date for display
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  try {
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  } catch {
    return null
  }
}

// ACME Logo SVG
function AcmeLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4L35.5885 13V31L20 40L4.41154 31V13L20 4Z" stroke="#E53935" strokeWidth="2.5" fill="none"/>
    </svg>
  )
}

// Belt options
const BELT_OPTIONS = [
  'White Belt', 'Yellow Belt', 'Orange Belt', 'Green Belt', 
  'Blue Belt', 'Purple Belt', 'Brown Belt', 'Black Belt'
]

// Status options
const STATUS_OPTIONS = ['Active', 'Inactive', 'On Hold']

// Membership options
const MEMBERSHIP_OPTIONS = ['Standard', 'Premium', 'Trial', 'Family', 'Student']

// Program options
const PROGRAM_OPTIONS = ['Kids Karate', 'Adult Karate', 'BJJ', 'MMA', 'Kickboxing', 'General']

// Relationship options
const RELATIONSHIP_OPTIONS = ['Parent', 'Guardian', 'Mother', 'Father', 'Grandparent', 'Other']

export default function StudentModal({ 
  student, 
  isOpen, 
  onClose, 
  onEditProfile, 
  onViewNotes,
  onCloseNotesDrawer,
  onStudentUpdated,
  onViewOnMap,
  isFullMapMode = false,
}: StudentModalProps) {
  const [activeView, setActiveView] = useState<'profile' | 'details'>('profile')
  const [isFlipping, setIsFlipping] = useState(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<{ dataUrl: string; fileName: string; fileSize: number } | null>(null)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    guardianEmail: '',
    program: '',
    membershipStatus: '',
    beltRank: '',
    status: '',
  })
  
  // Memoize attendance info to prevent re-renders
  const attendanceInfo = useMemo(() => getAttendanceCategory(), [student?.id])
  
  // Fetch school logo from global settings
  const utils = trpc.useUtils()
  const { data: brandData, refetch: refetchBrand } = trpc.setupWizard.getBrand.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: true,
  })
  const schoolLogo = brandData?.logoSquare || null
  
  // Upload logo mutation
  const uploadLogoMutation = trpc.setupWizard.uploadLogo.useMutation({
    onSuccess: () => {
      setIsUploading(false)
      setLogoUploadSuccess(true)
      utils.setupWizard.getBrand.invalidate()
      refetchBrand()
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setLogoUploadSuccess(false)
      }, 3000)
    },
    onError: () => {
      setIsUploading(false)
    }
  })
  
  // Update student mutation
  const updateStudentMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      setIsSaving(false)
      setSaveError(null)
      onStudentUpdated?.()
    },
    onError: (error) => {
      setIsSaving(false)
      setSaveError(error.message || 'Failed to save changes')
    }
  })
  
  // Initialize form data when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        phone: student.phone || '',
        email: student.email || '',
        streetAddress: student.street_address || '',
        city: student.city || '',
        state: student.state || '',
        zipCode: student.zip_code || '',
        dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
        guardianName: student.guardian_name || '',
        guardianRelationship: student.guardian_relationship || '',
        guardianPhone: student.guardian_phone || '',
        guardianEmail: student.guardian_email || '',
        program: student.program || '',
        membershipStatus: student.membership_status || '',
        beltRank: student.belt_rank || '',
        status: student.status || 'Active',
      })
    }
  }, [student])

  // Animation on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true)
      setActiveView('profile')
      const timer = setTimeout(() => setIsAnimatingIn(false), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  
  // Handle close with reset
  const handleClose = useCallback(() => {
    setActiveView('profile')
    onCloseNotesDrawer?.()
    onClose()
  }, [onClose, onCloseNotesDrawer])
  
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  // Handle view switch with flip animation
  const handleViewSwitch = useCallback((view: 'profile' | 'details') => {
    if (view === activeView || isFlipping) return
    setIsFlipping(true)
    setTimeout(() => {
      setActiveView(view)
      setTimeout(() => {
        setIsFlipping(false)
      }, 50)
    }, 200)
  }, [activeView, isFlipping])

  // Maximum file size for logo (2MB)
  const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB in bytes
  
  // Handle logo file selection - show preview first
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setLogoPreview({ dataUrl, fileName: file.name, fileSize: file.size })
        setShowLogoPreview(true)
      }
      reader.readAsDataURL(file)
    }
    // Reset input so same file can be selected again
    if (e.target) e.target.value = ''
  }
  
  // Check if file size exceeds limit
  const isFileTooLarge = logoPreview ? logoPreview.fileSize > MAX_LOGO_SIZE : false
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  
  // Confirm logo upload after preview
  const handleConfirmLogoUpload = () => {
    if (!logoPreview) return
    setIsUploading(true)
    setShowLogoPreview(false)
    uploadLogoMutation.mutate({
      mode: 'light',
      fileData: logoPreview.dataUrl,
      fileName: logoPreview.fileName,
    })
    setLogoPreview(null)
  }
  
  // Cancel logo preview
  const handleCancelLogoPreview = () => {
    setShowLogoPreview(false)
    setLogoPreview(null)
  }
  
  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveError(null)
  }
  
  // Handle save
  const handleSave = async () => {
    if (!student) return
    
    // Validation
    if (!formData.program) {
      setSaveError('Program is required')
      return
    }
    
    if (!formData.phone && !formData.email) {
      setSaveError('At least one contact method (phone or email) is required')
      return
    }
    
    // Check if under 18 and require guardian
    const age = calculateAge(formData.dateOfBirth)
    if (age !== null && age < 18 && !formData.guardianName) {
      setSaveError('Parent/Guardian name is required for students under 18')
      return
    }
    
    setIsSaving(true)
    
    // Prepare update data
    const updateData: any = {
      id: student.id,
      phone: formData.phone || null,
      email: formData.email || null,
      streetAddress: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      zipCode: formData.zipCode || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      guardianName: formData.guardianName || null,
      guardianRelationship: formData.guardianRelationship || null,
      guardianPhone: formData.guardianPhone || null,
      guardianEmail: formData.guardianEmail || null,
      program: formData.program || null,
      membershipStatus: formData.membershipStatus || null,
      beltRank: formData.beltRank || null,
      status: formData.status,
    }
    
    // If address changed, we'll need to geocode (handled by map component)
    updateStudentMutation.mutate(updateData)
  }

  if (!isOpen || !student) return null

  const fullName = `${student.first_name} ${student.last_name}`
  const beltDisplay = student.belt_rank || 'White Belt'
  const age = calculateAge(formData.dateOfBirth)
  const isMinor = age !== null && age < 18

  return (
    <>
      {/* Backdrop - Hidden in full map mode */}
      {!isFullMapMode && (
        <div 
          className={`
            fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990]
            transition-opacity duration-300
            ${isAnimatingIn ? 'opacity-0' : 'opacity-100'}
          `}
          onClick={handleClose}
        />
      )}
      
      {/* Modal Container - Different positioning for full map mode */}
      <div className={`
        ${isFullMapMode 
          ? 'relative w-full h-full' 
          : 'fixed inset-0 flex items-center justify-center z-[9995] p-4 pointer-events-none'
        }
      `}>
        <div 
          className={`
            ${isFullMapMode 
              ? 'w-full h-full pointer-events-auto' 
              : 'relative w-full max-w-[480px] pointer-events-auto'
            }
            transition-all duration-[280ms] ease-out
            ${isAnimatingIn && !isFullMapMode ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            ${isFlipping ? 'scale-95 opacity-90' : ''}
          `}
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`
              bg-white rounded-[26px] shadow-2xl overflow-hidden
              transition-transform duration-[400ms] ease-in-out
              ${isFlipping ? (activeView === 'profile' ? 'rotate-y-90' : '-rotate-y-90') : 'rotate-y-0'}
              ${isFullMapMode ? 'h-full' : ''}
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
              transformStyle: 'preserve-3d',
              maxHeight: isFullMapMode ? '100%' : '90vh',
            }}
          >
            {/* Header with Tabs */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain" />
                ) : import.meta.env.VITE_APP_LOGO ? (
                  <img src={import.meta.env.VITE_APP_LOGO} alt="School Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <AcmeLogo />
                )}
                <span className="font-bold text-lg text-gray-900">
                  {brandData?.businessName || brandData?.dbaName || import.meta.env.VITE_APP_TITLE || 'DojoFlow'}
                </span>
                {/* Logo Upload Success Message */}
                {logoUploadSuccess && (
                  <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium animate-fade-in">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Logo updated!
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleViewSwitch('profile')}
                  className={`relative text-base font-medium pb-1 transition-colors ${
                    activeView === 'profile' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Profile
                  {activeView === 'profile' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                  )}
                </button>
                
                <button
                  onClick={() => handleViewSwitch('details')}
                  className={`relative text-base font-medium pb-1 transition-colors ${
                    activeView === 'details' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Details
                  {activeView === 'details' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                  )}
                </button>
                
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {activeView === 'profile' ? (
                /* ========== PROFILE VIEW ========== */
                <div className="space-y-5">
                  <div className="flex gap-5">
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-50 shadow-md">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${attendanceInfo.color}`}>
                        {attendanceInfo.category}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 truncate">{fullName}</h2>
                      <p className="text-gray-500 text-base mt-0.5">{student.program || 'General'}</p>
                      
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
                  
                  <div className="flex flex-wrap gap-2">
                    {(student.tags || ['Regular', 'Competition Team']).map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Last Attendance</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatRelativeTime(student.last_attendance)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Attendance Rate</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">87%</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Progress to Next Belt</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {student.notes || "No notes added yet. Click 'View Notes' to add notes about this student."}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    {/* View on Map button - only show when not in full map mode */}
                    {!isFullMapMode && onViewOnMap && (
                      <Button
                        variant="outline"
                        onClick={() => onViewOnMap(student)}
                        className="w-full h-12 rounded-full border-blue-300 text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-400"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                    )}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => onViewNotes?.(student)}
                        className="flex-1 h-12 rounded-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Notes
                      </Button>
                      <Button
                        onClick={() => handleViewSwitch('details')}
                        className="flex-1 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========== DETAILS VIEW (EDITABLE) ========== */
                <div className="space-y-5">
                  {/* Change Logo Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
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
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Student Name (read-only header) */}
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
                    {age !== null && (
                      <p className="text-sm text-gray-500 mt-1">
                        Age: {age} {isMinor && <span className="text-orange-500">(Minor)</span>}
                      </p>
                    )}
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Phone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="email@example.com"
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Address</h3>
                    <div>
                      <Label className="text-xs text-gray-500">Street Address</Label>
                      <Input
                        value={formData.streetAddress}
                        onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                        placeholder="123 Main St"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">City</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          placeholder="City"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">State</Label>
                        <Input
                          value={formData.state}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          placeholder="State"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Zip Code</Label>
                        <Input
                          value={formData.zipCode}
                          onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                          placeholder="12345"
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Parent/Guardian (shown if minor or has guardian info) */}
                  {(isMinor || formData.guardianName) && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Parent / Guardian {isMinor && <span className="text-red-500">*</span>}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Name {isMinor && '*'}</Label>
                          <Input
                            value={formData.guardianName}
                            onChange={(e) => handleFieldChange('guardianName', e.target.value)}
                            placeholder="Guardian name"
                            className="mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Relationship</Label>
                          <Select
                            value={formData.guardianRelationship}
                            onValueChange={(value) => handleFieldChange('guardianRelationship', value)}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Phone</Label>
                          <Input
                            value={formData.guardianPhone}
                            onChange={(e) => handleFieldChange('guardianPhone', e.target.value)}
                            placeholder="(555) 123-4567"
                            className="mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Email</Label>
                          <Input
                            type="email"
                            value={formData.guardianEmail}
                            onChange={(e) => handleFieldChange('guardianEmail', e.target.value)}
                            placeholder="email@example.com"
                            className="mt-1 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Program & Enrollment */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Program & Enrollment</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Program *</Label>
                        <Select
                          value={formData.program}
                          onValueChange={(value) => handleFieldChange('program', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Select program..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PROGRAM_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Membership</Label>
                        <Select
                          value={formData.membershipStatus}
                          onValueChange={(value) => handleFieldChange('membershipStatus', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {MEMBERSHIP_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Belt Rank</Label>
                        <Select
                          value={formData.beltRank}
                          onValueChange={(value) => handleFieldChange('beltRank', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Select belt..." />
                          </SelectTrigger>
                          <SelectContent>
                            {BELT_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleFieldChange('status', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {saveError && (
                    <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                      {saveError}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewSwitch('profile')}
                      className="flex-1 h-12 rounded-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Logo Preview Modal */}
      {showLogoPreview && logoPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={handleCancelLogoPreview}
          />
          
          {/* Preview Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Preview Logo</h3>
            
            {/* Logo Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={logoPreview.dataUrl} 
                  alt="Logo preview" 
                  className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
                />
              </div>
            </div>
            
            {/* File name and size */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 truncate">
                {logoPreview.fileName}
              </p>
              <p className={`text-xs mt-1 ${isFileTooLarge ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {formatFileSize(logoPreview.fileSize)}
              </p>
            </div>
            
            {/* File size warning */}
            {isFileTooLarge && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">File too large</p>
                    <p className="text-xs text-red-600 mt-0.5">Please select an image under 2MB</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Preview in context */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-2 text-center">How it will appear:</p>
              <div className="flex items-center gap-2 justify-center">
                <img 
                  src={logoPreview.dataUrl} 
                  alt="Logo preview small" 
                  className="w-10 h-10 object-contain rounded"
                />
                <span className="font-semibold text-gray-900">
                  {brandData?.businessName || import.meta.env.VITE_APP_TITLE || 'Your Dojo'}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelLogoPreview}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 text-white ${isFileTooLarge ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                onClick={handleConfirmLogoUpload}
                disabled={isUploading || isFileTooLarge}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Confirm Upload'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
