import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  X,
  User,
  Camera,
  Upload,
  Loader2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  GraduationCap,
  Users,
  Tag,
  FileText,
  ChevronRight,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
// @ts-ignore - JSX component
import PhoneInput from '@/components/PhoneInput'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'

// Types
interface AddStudentFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date | undefined
  streetAddress: string
  city: string
  state: string
  zipCode: string
  program: string
  enrollmentStatus: string
  startDate: Date | undefined
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  tags: string[]
  notes: string
  photoUrl: string
}

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddStudentFormData) => Promise<void>
  onSubmitAndAddAnother?: (data: AddStudentFormData) => Promise<void>
}

// Program options
const PROGRAM_OPTIONS = [
  { value: 'martial_arts', label: 'Martial Arts' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'youth_program', label: 'Youth Program' },
  { value: 'adult_program', label: 'Adult Program' },
  { value: 'private_training', label: 'Private Training' },
  { value: 'bjj', label: 'Brazilian Jiu-Jitsu' },
  { value: 'mma', label: 'MMA' },
]

// Enrollment status options
const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'active', label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'prospect', label: 'Prospect', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'frozen', label: 'Frozen', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

// Tag options
const TAG_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'vip', label: 'VIP', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'competition_team', label: 'Competition Team', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'family_plan', label: 'Family Plan', color: 'bg-green-500/20 text-green-400' },
  { value: 'referral', label: 'Referral', color: 'bg-pink-500/20 text-pink-400' },
]

// Calculate age from date of birth
function calculateAge(dob: Date | undefined): number | null {
  if (!dob) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Get initials from name
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'ST'
}

// Section Header Component
function SectionHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  badge,
}: { 
  icon: React.ElementType
  title: string
  subtitle?: string
  badge?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {badge && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// Field Error Component
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
      <AlertCircle className="h-3 w-3" />
      <span className="text-xs">{message}</span>
    </div>
  )
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitAndAddAnother,
}: AddStudentModalProps) {
  // Form state
  const [formData, setFormData] = useState<AddStudentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: undefined,
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    program: '',
    enrollmentStatus: 'trial',
    startDate: new Date(),
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    tags: ['new'],
    notes: '',
    photoUrl: '',
  })

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dobCalendarOpen, setDobCalendarOpen] = useState(false)
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Computed values
  const age = useMemo(() => calculateAge(formData.dateOfBirth), [formData.dateOfBirth])
  const isMinor = age !== null && age < 18
  const initials = useMemo(() => getInitials(formData.firstName, formData.lastName), [formData.firstName, formData.lastName])

  // Smart defaults based on age
  useEffect(() => {
    if (age !== null) {
      // Auto-suggest program based on age
      if (age < 13 && !formData.program) {
        setFormData(prev => ({ ...prev, program: 'youth_program' }))
      } else if (age >= 18 && !formData.program) {
        setFormData(prev => ({ ...prev, program: 'adult_program' }))
      }
    }
  }, [age])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: undefined,
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        program: '',
        enrollmentStatus: 'trial',
        startDate: new Date(),
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        tags: ['new'],
        notes: '',
        photoUrl: '',
      })
      setErrors({})
    }
  }, [isOpen])

  // Handle input changes
  const handleChange = (field: keyof AddStudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Upload photo mutation
  const uploadPhotoMutation = trpc.students.uploadPhoto.useMutation({
    onSuccess: (data) => {
      handleChange('photoUrl', data.url)
      setIsUploading(false)
      toast.success('Photo uploaded successfully')
    },
    onError: (error) => {
      console.error('Photo upload error:', error)
      setIsUploading(false)
      toast.error('Failed to upload photo. Please try again.')
    },
  })

  // Handle photo upload - uploads to S3 and stores URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        // Extract the base64 data without the data:image/xxx;base64, prefix
        const base64Data = base64String.split(',')[1]
        
        // Upload to S3
        uploadPhotoMutation.mutate({
          base64Data,
          mimeType: file.type,
          fileName: file.name,
        })
      }
      reader.onerror = () => {
        setIsUploading(false)
        toast.error('Failed to read photo file')
      }
      reader.readAsDataURL(file)
    }
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (isMinor && !formData.guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required for minors'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (addAnother: boolean = false) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (addAnother && onSubmitAndAddAnother) {
        await onSubmitAndAddAnother(formData)
        // Reset form for next entry
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: undefined,
          streetAddress: '',
          city: '',
          state: '',
          zipCode: '',
          program: '',
          enrollmentStatus: 'trial',
          startDate: new Date(),
          guardianName: '',
          guardianEmail: '',
          guardianPhone: '',
          tags: ['new'],
          notes: '',
          photoUrl: '',
        })
      } else {
        await onSubmit(formData)
        onClose()
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast.error(error?.message || 'Failed to add student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if required fields are filled (including guardian for minors)
  const isFormValid = formData.firstName.trim() && formData.lastName.trim() && formData.dateOfBirth && (!isMinor || formData.guardianName.trim())

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-full h-full sm:w-auto sm:h-auto sm:max-w-[800px] sm:max-h-[90vh] max-h-full p-0 gap-0 overflow-hidden !bg-[#1a1a1c] dark:!bg-[#1a1a1c] border-0 sm:border sm:border-border/50 rounded-none sm:rounded-2xl shadow-2xl backdrop-blur-none"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        {/* Header with Live Preview */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50 bg-[#1f1f22]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Live Preview */}
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-border shadow-lg">
                {formData.photoUrl ? (
                  <AvatarImage src={formData.photoUrl} alt="Student" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name Preview */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {formData.firstName || formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : 'New Student'}
                </h2>
                {age !== null && (
                  <Badge variant="outline" className="text-xs">
                    {age} years old
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.program 
                  ? PROGRAM_OPTIONS.find(p => p.value === formData.program)?.label 
                  : 'Select a program'}
                {formData.enrollmentStatus && (
                  <span className="mx-2">•</span>
                )}
                {formData.enrollmentStatus && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    STATUS_OPTIONS.find(s => s.value === formData.enrollmentStatus)?.color
                  )}>
                    {STATUS_OPTIONS.find(s => s.value === formData.enrollmentStatus)?.label}
                  </span>
                )}
              </p>
            </div>

            {/* Smart Suggestions Indicator */}
            {age !== null && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs">
                <Sparkles className="h-3 w-3" />
                <span>Smart defaults applied</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Form Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Section 1: Student Identity */}
            <section>
              <SectionHeader 
                icon={User} 
                title="Student Profile" 
                subtitle="Basic information about the student"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={cn(
                      "h-11 bg-[#252528] border-border focus:border-primary",
                      errors.firstName && "border-destructive"
                    )}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={cn(
                      "h-11 bg-[#252528] border-border focus:border-primary",
                      errors.lastName && "border-destructive"
                    )}
                  />
                  <FieldError message={errors.lastName} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={dobCalendarOpen} onOpenChange={setDobCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal bg-[#252528] border-border hover:bg-[#2a2a2d]",
                          !formData.dateOfBirth && "text-muted-foreground",
                          errors.dateOfBirth && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : 'Select date of birth'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth}
                        onSelect={(date) => {
                          handleChange('dateOfBirth', date)
                          setDobCalendarOpen(false)
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        captionLayout="dropdown"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError message={errors.dateOfBirth} />
                </div>
              </div>
            </section>

            <Separator className="bg-border/30" />

            {/* Section 2: Contact Information */}
            <section>
              <SectionHeader 
                icon={Mail} 
                title="Contact Details" 
                subtitle="How to reach the student"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={cn(
                        "h-11 pl-10 bg-[#252528] border-border focus:border-primary",
                        errors.email && "border-destructive"
                      )}
                    />
                  </div>
                  <FieldError message={errors.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value: string) => handleChange('phone', value)}
                      country="United States"
                      className="h-11 pl-10 bg-[#252528] border border-border rounded-md focus:border-primary w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="streetAddress" className="text-sm font-medium">
                    Street Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="streetAddress"
                      placeholder="123 Main Street"
                      value={formData.streetAddress}
                      onChange={(e) => handleChange('streetAddress', e.target.value)}
                      className="h-11 pl-10 bg-[#252528] border-border focus:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="h-11 bg-[#252528] border-border focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State
                    </Label>
                    <Input
                      id="state"
                      placeholder="TX"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      maxLength={2}
                      className="h-11 bg-[#252528] border-border focus:border-primary uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-medium">
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      placeholder="77001"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      maxLength={10}
                      className="h-11 bg-[#252528] border-border focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-border/30" />

            {/* Section 3: Enrollment Details */}
            <section>
              <SectionHeader 
                icon={GraduationCap} 
                title="Program & Status" 
                subtitle="Enrollment information"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Program / Track</Label>
                  <Select
                    value={formData.program}
                    onValueChange={(value) => handleChange('program', value)}
                  >
                    <SelectTrigger className="h-11 bg-[#252528] border-border">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Enrollment Status</Label>
                  <Select
                    value={formData.enrollmentStatus}
                    onValueChange={(value) => handleChange('enrollmentStatus', value)}
                  >
                    <SelectTrigger className="h-11 bg-[#252528] border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", option.color.split(' ')[0])} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Popover open={startDateCalendarOpen} onOpenChange={setStartDateCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal bg-[#252528] border-border hover:bg-[#2a2a2d]",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, 'PP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => {
                          handleChange('startDate', date)
                          setStartDateCalendarOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>

            {/* Section 4: Guardian Info (Conditional) */}
            {isMinor && (
              <>
                <Separator className="bg-border/30" />
                <section>
                  <SectionHeader 
                    icon={Users} 
                    title="Guardian Information" 
                    subtitle="Required for students under 18"
                    badge="Required"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName" className="text-sm font-medium">
                        Guardian Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="guardianName"
                        placeholder="Parent/Guardian name"
                        value={formData.guardianName}
                        onChange={(e) => handleChange('guardianName', e.target.value)}
                        className={cn(
                          "h-11 bg-[#252528] border-border focus:border-primary",
                          errors.guardianName && "border-destructive"
                        )}
                      />
                      <FieldError message={errors.guardianName} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianEmail" className="text-sm font-medium">
                        Guardian Email
                      </Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        placeholder="guardian@email.com"
                        value={formData.guardianEmail}
                        onChange={(e) => handleChange('guardianEmail', e.target.value)}
                        className="h-11 bg-[#252528] border-border focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone" className="text-sm font-medium">
                        Guardian Phone
                      </Label>
                      <PhoneInput
                        value={formData.guardianPhone}
                        onChange={(value: string) => handleChange('guardianPhone', value)}
                        country="United States"
                        className="h-11 bg-[#252528] border border-border rounded-md focus:border-primary w-full"
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            <Separator className="bg-border/30" />

            {/* Section 5: Tags & Notes */}
            <section>
              <SectionHeader 
                icon={Tag} 
                title="Tags & Notes" 
                subtitle="Additional categorization and internal notes"
              />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleTag(tag.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                          formData.tags.includes(tag.value)
                            ? cn(tag.color, "border-current")
                            : "bg-[#252528] text-muted-foreground border-border hover:bg-[#2a2a2d]"
                        )}
                      >
                        {formData.tags.includes(tag.value) && (
                          <Check className="inline-block h-3 w-3 mr-1" />
                        )}
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Internal Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any internal notes about this student..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="min-h-[100px] bg-[#252528] border-border focus:border-primary resize-none"
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-[#1a1a1c]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              {onSubmitAndAddAnother && (
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || !isFormValid}
                  className="flex-1 sm:flex-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Save & Add Another
                </Button>
              )}
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !isFormValid}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
