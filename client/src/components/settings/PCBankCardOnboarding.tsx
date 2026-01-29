import React, { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  CheckCircle2, Circle, ChevronRight, Save, Send, Upload, X, FileText
} from 'lucide-react'

interface PCBankCardOnboardingProps {
  onBack?: () => void
}

const STEPS = [
  { id: 1, label: 'Business Identity' },
  { id: 2, label: 'Location Info' },
  { id: 3, label: 'Corporate / Tax' },
  { id: 4, label: 'Owner / Principal' },
  { id: 5, label: 'Banking & Processing' },
  { id: 6, label: 'Uploads & Compliance' },
  { id: 7, label: 'Review & Submit' },
]

type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'NEEDS_CHANGES'

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.6)' },
  SUBMITTED: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  UNDER_REVIEW: { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
  APPROVED: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
  NEEDS_CHANGES: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
}

export default function PCBankCardOnboarding({ onBack }: PCBankCardOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<ApplicationStatus>('DRAFT')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Fetch application
  const applicationQuery = trpc.pcBankCard.getApplication.useQuery(undefined, {
    onSuccess: (data) => {
      if (data) {
        setCurrentStep(data.currentStep)
        setFormData(data.dataJson || {})
        setStatus(data.status as ApplicationStatus)
      }
    }
  })

  // Save draft mutation
  const saveDraftMutation = trpc.pcBankCard.saveDraft.useMutation()

  // Upload file mutation
  const uploadFileMutation = trpc.pcBankCard.uploadFile.useMutation()

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await saveDraftMutation.mutateAsync({
        currentStep,
        dataJson: formData,
      })
      toast.success('Draft saved')
      applicationQuery.refetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 1: // Business Identity
        if (!formData.legalBusinessName?.trim()) newErrors.legalBusinessName = 'Legal Business Name is required'
        if (!formData.businessEmail?.trim()) newErrors.businessEmail = 'Business Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) newErrors.businessEmail = 'Invalid email format'
        if (!formData.businessPhone?.trim()) newErrors.businessPhone = 'Business Phone is required'
        break
        
      case 2: // Location Info
        if (!formData.locationAddressStreet?.trim()) newErrors.locationAddressStreet = 'Street Address is required'
        if (!formData.locationCity?.trim()) newErrors.locationCity = 'City is required'
        if (!formData.locationState?.trim()) newErrors.locationState = 'State is required'
        if (!formData.locationZip?.trim()) newErrors.locationZip = 'ZIP Code is required'
        else if (!/^\d{5}(-\d{4})?$/.test(formData.locationZip)) newErrors.locationZip = 'Invalid ZIP code format'
        if (!formData.locationPhone?.trim()) newErrors.locationPhone = 'Location Phone is required'
        break
        
      case 3: // Corporate / Tax
        if (!formData.corporateLegalName?.trim()) newErrors.corporateLegalName = 'Corporate Legal Name is required'
        if (!formData.einOrTaxId?.trim()) newErrors.einOrTaxId = 'EIN / Tax ID is required'
        else if (!/^\d{2}-?\d{7}$/.test(formData.einOrTaxId)) newErrors.einOrTaxId = 'Invalid EIN format (XX-XXXXXXX)'
        break
        
      case 4: // Owner / Principal
        if (!formData.ownerFullName?.trim()) newErrors.ownerFullName = 'Owner Full Name is required'
        if (!formData.ownerTitle?.trim()) newErrors.ownerTitle = 'Owner Title is required'
        if (!formData.ownershipPercent) newErrors.ownershipPercent = 'Ownership Percent is required'
        else if (formData.ownershipPercent < 0 || formData.ownershipPercent > 100) newErrors.ownershipPercent = 'Must be between 0 and 100'
        if (!formData.ownerEmail?.trim()) newErrors.ownerEmail = 'Owner Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) newErrors.ownerEmail = 'Invalid email format'
        if (!formData.ownerPhone?.trim()) newErrors.ownerPhone = 'Owner Phone is required'
        if (!formData.ownerDob) newErrors.ownerDob = 'Owner Date of Birth is required'
        if (!formData.ownerSsn?.trim()) newErrors.ownerSsn = 'Owner SSN (last 4 digits) is required'
        else if (!/^\d{4}$/.test(formData.ownerSsn)) newErrors.ownerSsn = 'Must be exactly 4 digits'
        if (!uploadedFiles.OWNER_ID) newErrors.ownerIdUpload = 'Owner ID document is required'
        break
        
      case 5: // Banking & Processing
        if (!formData.bankName?.trim()) newErrors.bankName = 'Bank Name is required'
        if (!formData.routingNumber?.trim()) newErrors.routingNumber = 'Routing Number is required'
        else if (!/^\d{9}$/.test(formData.routingNumber)) newErrors.routingNumber = 'Must be exactly 9 digits'
        if (!formData.accountNumber?.trim()) newErrors.accountNumber = 'Account Number is required'
        if (!formData.monthlyVolume) newErrors.monthlyVolume = 'Monthly Processing Volume is required'
        if (!formData.averageTicket) newErrors.averageTicket = 'Average Transaction Size is required'
        break
        
      case 6: // Uploads & Compliance
        if (!formData.businessDescription?.trim()) newErrors.businessDescription = 'Business Description is required'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    // Validate current step
    if (!validateCurrentStep()) {
      toast.error('Please fix validation errors before continuing')
      return
    }
    
    // Save current step before moving forward
    await handleSaveDraft()
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      setErrors({}) // Clear errors when moving to next step
      setTouched({}) // Clear touched fields
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileUpload = async (fileType: string, file: File) => {
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const result = await uploadFileMutation.mutateAsync({
          fileType,
          fileName: file.name,
          fileData: base64.split(',')[1], // Remove data:image/png;base64, prefix
          mimeType: file.type,
          size: file.size,
        })
        setUploadedFiles(prev => ({ ...prev, [fileType]: result }))
        toast.success('File uploaded')
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Business Identity
            </h3>
            <InputField
              label="Legal Business Name"
              value={formData.legalBusinessName || ''}
              onChange={(value) => setFormData({ ...formData, legalBusinessName: value })}
              required
              error={errors.legalBusinessName}
              name="legalBusinessName"
              onBlur={() => setTouched({ ...touched, legalBusinessName: true })}
            />
            <InputField
              label="DBA Name (if different)"
              value={formData.dbaName || ''}
              onChange={(value) => setFormData({ ...formData, dbaName: value })}
            />
            <InputField
              label="Business Email"
              value={formData.businessEmail || ''}
              onChange={(value) => setFormData({ ...formData, businessEmail: value })}
              required
              error={errors.businessEmail}
              name="businessEmail"
              onBlur={() => setTouched({ ...touched, businessEmail: true })}
            />
            <InputField
              label="Business Phone"
              value={formData.businessPhone || ''}
              onChange={(value) => setFormData({ ...formData, businessPhone: value })}
              required
              error={errors.businessPhone}
              name="businessPhone"
              onBlur={() => setTouched({ ...touched, businessPhone: true })}
            />
            <InputField
              label="Website"
              value={formData.website || ''}
              onChange={(value) => setFormData({ ...formData, website: value })}
            />
            <InputField
              label="Date Business Started"
              value={formData.dateBusinessStarted || ''}
              onChange={(value) => setFormData({ ...formData, dateBusinessStarted: value })}
              type="date"
            />
          </div>
        )

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Location Info
            </h3>
            <InputField
              label="Street Address"
              value={formData.locationAddressStreet || ''}
              onChange={(value) => setFormData({ ...formData, locationAddressStreet: value })}
              required
            />
            <InputField
              label="City"
              value={formData.locationCity || ''}
              onChange={(value) => setFormData({ ...formData, locationCity: value })}
              required
            />
            <InputField
              label="State"
              value={formData.locationState || ''}
              onChange={(value) => setFormData({ ...formData, locationState: value })}
              required
            />
            <InputField
              label="ZIP Code"
              value={formData.locationZip || ''}
              onChange={(value) => setFormData({ ...formData, locationZip: value })}
              required
            />
            <InputField
              label="Country"
              value={formData.locationCountry || 'US'}
              onChange={(value) => setFormData({ ...formData, locationCountry: value })}
            />
            <InputField
              label="Location Phone"
              value={formData.locationPhone || ''}
              onChange={(value) => setFormData({ ...formData, locationPhone: value })}
              required
            />
          </div>
        )

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Corporate / Tax
            </h3>
            <InputField
              label="Corporate Legal Name"
              value={formData.corporateLegalName || ''}
              onChange={(value) => setFormData({ ...formData, corporateLegalName: value })}
              required
            />
            <InputField
              label="EIN / Tax ID"
              value={formData.einOrTaxId || ''}
              onChange={(value) => setFormData({ ...formData, einOrTaxId: value })}
              required
            />
            <InputField
              label="Tax Filing Name"
              value={formData.taxFilingName || ''}
              onChange={(value) => setFormData({ ...formData, taxFilingName: value })}
            />
            <InputField
              label="Years in Business"
              value={formData.yearsInBusiness || ''}
              onChange={(value) => setFormData({ ...formData, yearsInBusiness: value })}
              type="number"
            />
          </div>
        )

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Owner / Principal
            </h3>
            <InputField
              label="Owner Full Name"
              value={formData.ownerFullName || ''}
              onChange={(value) => setFormData({ ...formData, ownerFullName: value })}
              required
            />
            <InputField
              label="Owner Title"
              value={formData.ownerTitle || ''}
              onChange={(value) => setFormData({ ...formData, ownerTitle: value })}
              required
            />
            <InputField
              label="Ownership Percent"
              value={formData.ownershipPercent || ''}
              onChange={(value) => setFormData({ ...formData, ownershipPercent: value })}
              type="number"
              required
            />
            <InputField
              label="Owner Email"
              value={formData.ownerEmail || ''}
              onChange={(value) => setFormData({ ...formData, ownerEmail: value })}
              required
            />
            <InputField
              label="Owner Phone"
              value={formData.ownerPhone || ''}
              onChange={(value) => setFormData({ ...formData, ownerPhone: value })}
              required
            />
            <InputField
              label="Owner Date of Birth"
              value={formData.ownerDob || ''}
              onChange={(value) => setFormData({ ...formData, ownerDob: value })}
              type="date"
              required
            />
            <InputField
              label="Owner SSN (last 4 digits)"
              value={formData.ownerSsn || ''}
              onChange={(value) => setFormData({ ...formData, ownerSsn: value })}
              type="password"
              required
            />
            
            {/* Owner ID Upload */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '8px' 
              }}>
                Owner ID Upload <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('OWNER_ID', file)
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              {uploadedFiles.OWNER_ID && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span style={{ fontSize: '13px', color: '#22c55e' }}>
                    {uploadedFiles.OWNER_ID.fileName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Banking & Processing
            </h3>
            <InputField
              label="Bank Name"
              value={formData.bankName || ''}
              onChange={(value) => setFormData({ ...formData, bankName: value })}
            />
            <InputField
              label="Bank Account Last 4 Digits"
              value={formData.bankAccountLast4 || ''}
              onChange={(value) => setFormData({ ...formData, bankAccountLast4: value })}
            />
            <InputField
              label="Monthly Volume Estimate"
              value={formData.monthlyVolumeEstimate || ''}
              onChange={(value) => setFormData({ ...formData, monthlyVolumeEstimate: value })}
              type="number"
            />
            <InputField
              label="Average Ticket Estimate"
              value={formData.avgTicketEstimate || ''}
              onChange={(value) => setFormData({ ...formData, avgTicketEstimate: value })}
              type="number"
            />
          </div>
        )

      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Uploads & Compliance
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Upload required documents for verification.
            </p>
            <div style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Document uploads will be implemented in the next phase.
              </p>
            </div>
          </div>
        )

      case 7:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
              Review & Submit
            </h3>
            <div style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                Application Summary
              </h4>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                <p><strong>Business:</strong> {formData.legalBusinessName || 'N/A'}</p>
                <p><strong>Email:</strong> {formData.businessEmail || 'N/A'}</p>
                <p><strong>Owner:</strong> {formData.ownerFullName || 'N/A'}</p>
                <p><strong>Location:</strong> {formData.locationCity}, {formData.locationState}</p>
              </div>
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '8px',
              cursor: 'pointer',
            }}>
              <input type="checkbox" style={{ marginTop: '4px' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                I confirm this information is accurate and I am authorized to submit on behalf of this business.
              </span>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  const statusColor = STATUS_COLORS[status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>
            PC Bank Card
          </h2>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
          }}>
            {status.replace('_', ' ')}
          </div>
        </div>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
          Complete your processor onboarding to accept payments.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '32px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              onClick={() => setCurrentStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: currentStep === step.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                border: currentStep === step.id ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                transition: 'all 200ms ease',
              }}
            >
              {step.id < currentStep ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : (
                <Circle 
                  size={20} 
                  color={currentStep === step.id ? '#ef4444' : 'rgba(255, 255, 255, 0.3)'} 
                />
              )}
              <span style={{ 
                fontSize: '13px', 
                color: currentStep === step.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: currentStep === step.id ? '500' : '400',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.3)" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px', 
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px',
      }}>
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 1 ? 0.4 : 1,
          }}
        >
          Back
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => toast.info('Submit functionality will be implemented in Phase 3')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#22c55e',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={16} />
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Input field component
const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  required,
  error,
  name,
  onBlur,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password' | 'number' | 'date'
  required?: boolean
  error?: string
  name?: string
  onBlur?: () => void
}) => (
  <div>
    <label style={{ 
      display: 'block', 
      fontSize: '14px', 
      color: 'rgba(255, 255, 255, 0.7)', 
      marginBottom: '6px' 
    }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: `1px solid ${error ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = error ? '#ef4444' : '#ef4444'}
    />
    {error && (
      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#ef4444',
      }}>
        {error}
      </div>
    )}
  </div>
)
