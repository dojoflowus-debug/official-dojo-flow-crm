import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, ChevronRight, ChevronLeft, User, Users, GraduationCap, MapPin, ClipboardCheck, Camera, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import AddressAutocomplete from './AddressAutocomplete'
import PhoneInput from './PhoneInput'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc'

interface AddStudentWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStudentCreated?: (student: any) => void
}

interface FormData {
  // Step 1: Basic Info
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  
  // Step 2: Guardian Info
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  guardianEmail: string
  
  // Step 3: Program & Enrollment
  program: string
  status: string
  beltRank: string
  startDate: string
  
  // Step 4: Address & Location
  streetAddress: string
  city: string
  state: string
  zipCode: string
  latitude: string
  longitude: string
  
  // Photo
  photoUrl: string
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianEmail: '',
  program: '',
  status: 'Trial',
  beltRank: 'White',
  startDate: new Date().toISOString().split('T')[0],
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: '',
  longitude: '',
  photoUrl: ''
}

const PROGRAMS = [
  'Little Dragons (4-6)',
  'Kids Karate (7-12)',
  'Teen Martial Arts (13-17)',
  'Adult Martial Arts (18+)',
  'Brazilian Jiu-Jitsu',
  'Kickboxing',
  'MMA',
  'Self-Defense',
  'Private Lessons'
]

const BELT_RANKS = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Blue',
  'Purple',
  'Brown',
  'Red',
  'Black'
]

const STATUSES = ['Trial', 'Active', 'Inactive', 'On Hold']

const RELATIONSHIPS = ['Parent', 'Guardian', 'Grandparent', 'Sibling', 'Other']

export default function AddStudentWizard({ open, onOpenChange, onStudentCreated }: AddStudentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [isMinor, setIsMinor] = useState(false)
  const { toast } = useToast()

  // Calculate if student is a minor based on DOB
  useEffect(() => {
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--
      }
      setIsMinor(age < 18)
    } else {
      setIsMinor(false)
    }
  }, [formData.dateOfBirth])

  // Determine total steps (skip guardian step if adult)
  const totalSteps = isMinor ? 5 : 4
  
  // Adjust step numbers for display
  const getDisplayStep = (step: number) => {
    if (!isMinor && step > 1) {
      return step // Steps are: 1-Basic, 2-Program, 3-Address, 4-Review
    }
    return step // Steps are: 1-Basic, 2-Guardian, 3-Program, 4-Address, 5-Review
  }

  const steps = isMinor 
    ? [
        { id: 1, title: 'Basic Info', icon: User },
        { id: 2, title: 'Guardian', icon: Users },
        { id: 3, title: 'Program', icon: GraduationCap },
        { id: 4, title: 'Address', icon: MapPin },
        { id: 5, title: 'Review', icon: ClipboardCheck }
      ]
    : [
        { id: 1, title: 'Basic Info', icon: User },
        { id: 2, title: 'Program', icon: GraduationCap },
        { id: 3, title: 'Address', icon: MapPin },
        { id: 4, title: 'Review', icon: ClipboardCheck }
      ]

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setFormData(initialFormData)
      setErrors({})
    }
  }, [open])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }



  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    // Map logical step to actual step based on isMinor
    const actualStep = !isMinor && step > 1 ? step + 1 : step

    switch (actualStep) {
      case 1: // Basic Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        // Email and phone are optional but validate format if provided
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format'
        }
        break
        
      case 2: // Guardian Info (only for minors)
        if (isMinor) {
          if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required'
          if (!formData.guardianPhone.trim()) newErrors.guardianPhone = 'Guardian phone is required'
          if (!formData.guardianRelationship) newErrors.guardianRelationship = 'Relationship is required'
        }
        break
        
      case 3: // Program & Enrollment
        if (!formData.program) newErrors.program = 'Please select a program'
        if (!formData.status) newErrors.status = 'Please select a status'
        break
        
      case 4: // Address (optional, no validation required)
        break
        
      case 5: // Review (no validation needed)
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // tRPC mutation for creating students
  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Student Created',
        description: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      })

      // Call the callback with the new student data
      if (onStudentCreated) {
        onStudentCreated({
          id: result.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          program: formData.program || null,
          status: formData.status || 'Trial',
          belt_rank: formData.beltRank || 'White',
          membership_status: formData.status === 'Trial' ? 'Trial' : 'Paid',
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          photo_url: formData.photoUrl || null,
          street_address: formData.streetAddress || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zipCode || null
        })
      }

      // Close the dialog
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error creating student:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      // Prepare student data for tRPC mutation
      // Note: DB status enum is Active/Inactive/On Hold
      // membershipStatus is used for Trial/Active/Paid tracking
      const studentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        program: formData.program || null,
        status: 'Active', // DB enum: Active, Inactive, On Hold
        beltRank: formData.beltRank || 'White',
        membershipStatus: formData.status || 'Trial', // Trial, Active, Paid, etc.
        streetAddress: formData.streetAddress.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zipCode: formData.zipCode.trim() || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        photoUrl: formData.photoUrl || null,
        guardianName: isMinor ? formData.guardianName.trim() || null : null,
        guardianPhone: isMinor ? formData.guardianPhone.trim() || null : null,
        guardianEmail: isMinor ? formData.guardianEmail.trim() || null : null,
      }

      await createStudentMutation.mutateAsync(studentData)
      
    } catch (error) {
      // Error is handled in onError callback
    } finally {
      setSubmitting(false)
    }
  }

  const renderStepContent = () => {
    // Map current step to actual content based on isMinor
    const actualStep = !isMinor && currentStep > 1 ? currentStep + 1 : currentStep

    switch (actualStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth}</p>}
              {formData.dateOfBirth && (
                <p className="text-xs text-muted-foreground">
                  {isMinor ? 'Student is under 18 - guardian info required' : 'Student is 18 or older'}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john.doe@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="(555) 123-4567"
              />
            </div>
            
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Student Photo</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Student" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    id="photo-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          handleInputChange('photoUrl', reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Or paste an image URL:</p>
                  <Input
                    id="photo-url"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.photoUrl && !formData.photoUrl.startsWith('data:') ? formData.photoUrl : ''}
                    onChange={(e) => handleInputChange('photoUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Guardian Info (only shown for minors)
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Since this student is under 18, please provide guardian/parent information.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name *</Label>
              <Input
                id="guardianName"
                value={formData.guardianName}
                onChange={(e) => handleInputChange('guardianName', e.target.value)}
                placeholder="Jane Doe"
                className={errors.guardianName ? 'border-red-500' : ''}
              />
              {errors.guardianName && <p className="text-xs text-red-500">{errors.guardianName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianRelationship">Relationship *</Label>
              <Select
                value={formData.guardianRelationship}
                onValueChange={(value) => handleInputChange('guardianRelationship', value)}
              >
                <SelectTrigger className={errors.guardianRelationship ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(rel => (
                    <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.guardianRelationship && <p className="text-xs text-red-500">{errors.guardianRelationship}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone *</Label>
              <PhoneInput
                value={formData.guardianPhone}
                onChange={(value) => handleInputChange('guardianPhone', value)}
                placeholder="(555) 123-4567"
              />
              {errors.guardianPhone && <p className="text-xs text-red-500">{errors.guardianPhone}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianEmail">Guardian Email</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={formData.guardianEmail}
                onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                placeholder="jane.doe@example.com"
              />
            </div>
          </div>
        )

      case 3: // Program & Enrollment
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <Select
                value={formData.program}
                onValueChange={(value) => {
                  handleInputChange('program', value)
                  // Auto-set status based on program selection
                  if (!formData.status || formData.status === 'Trial') {
                    // Keep as Trial for new students
                  }
                }}
              >
                <SelectTrigger className={errors.program ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map(program => (
                    <SelectItem key={program} value={program}>{program}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.program && <p className="text-xs text-red-500">{errors.program}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Enrollment Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
              <p className="text-xs text-muted-foreground">
                {formData.status === 'Trial' && 'New students typically start with a trial period'}
                {formData.status === 'Active' && 'Active students have full membership access'}
                {formData.status === 'Inactive' && 'Inactive students are not currently enrolled'}
                {formData.status === 'On Hold' && 'On Hold students have temporarily paused membership'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="beltRank">Belt Rank</Label>
              <Select
                value={formData.beltRank}
                onValueChange={(value) => handleInputChange('beltRank', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select belt rank" />
                </SelectTrigger>
                <SelectContent>
                  {BELT_RANKS.map(belt => (
                    <SelectItem key={belt} value={belt}>{belt} Belt</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
          </div>
        )

      case 4: // Address & Location
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the student's address for location-based features and communication.
            </p>
            
            <div className="space-y-2">
              <AddressAutocomplete
                value={formData.streetAddress}
                onChange={(value) => handleInputChange('streetAddress', value)}
                onAddressSelect={(address) => {
                  setFormData(prev => ({
                    ...prev,
                    streetAddress: address.street_address,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zip_code,
                    latitude: address.latitude?.toString() || '',
                    longitude: address.longitude?.toString() || ''
                  }))
                }}
                placeholder="Start typing an address..."
                label="Address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="12345"
              />
            </div>
            
            {formData.latitude && formData.longitude && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Location coordinates captured
                </p>
              </div>
            )}
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              {/* Photo Preview */}
              {formData.photoUrl && (
                <div className="flex justify-center">
                  <img 
                    src={formData.photoUrl} 
                    alt="Student" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Basic Information</h4>
                <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
                {formData.dateOfBirth && (
                  <p className="text-sm text-muted-foreground">
                    DOB: {new Date(formData.dateOfBirth).toLocaleDateString()}
                    {isMinor && ' (Minor)'}
                  </p>
                )}
                {formData.email && <p className="text-sm">{formData.email}</p>}
                {formData.phone && <p className="text-sm">{formData.phone}</p>}
              </div>
              
              {isMinor && formData.guardianName && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Guardian</h4>
                  <p className="text-sm">{formData.guardianName} ({formData.guardianRelationship})</p>
                  {formData.guardianPhone && <p className="text-sm">{formData.guardianPhone}</p>}
                  {formData.guardianEmail && <p className="text-sm">{formData.guardianEmail}</p>}
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Enrollment</h4>
                <p className="text-sm">Program: {formData.program || 'Not selected'}</p>
                <p className="text-sm">Status: {formData.status}</p>
                <p className="text-sm">Belt: {formData.beltRank}</p>
              </div>
              
              {(formData.streetAddress || formData.city) && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Address</h4>
                  <p className="text-sm">
                    {[formData.streetAddress, formData.city, formData.state, formData.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isActive && 'border-primary bg-primary text-primary-foreground',
                        isCompleted && 'border-primary bg-primary text-primary-foreground',
                        !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={cn(
                      'text-xs mt-1 hidden sm:block',
                      isActive && 'text-primary font-medium',
                      !isActive && 'text-muted-foreground'
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-2',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                    )} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create Student
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
