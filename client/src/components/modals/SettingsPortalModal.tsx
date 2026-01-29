import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/_core/hooks/useAuth'
import { useModal, type SettingsTab } from '@/contexts/ModalContext'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  User, Settings, BarChart3, CreditCard, Clock, Mail, Database, 
  Cloud, Palette, Zap, HelpCircle, LogOut, X, ExternalLink, Banknote, Building2, ChevronDown
} from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import AddCreditModal from '@/components/modals/AddCreditModal'
import PaymentsSettingsTab from '@/components/settings/PaymentsSettingsTab'
import { SchoolProfileSettingsTab } from '@/components/settings/SchoolProfileSettingsTab'
import PCBankCardOnboarding from '@/components/settings/PCBankCardOnboarding'

const uploadMutation = trpc.auth.uploadProfilePicture
const deleteMutation = trpc.auth.deleteProfilePicture

interface SettingsPortalModalProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'school', label: 'School Profile', icon: Building2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { 
    id: 'payments', 
    label: 'Payments', 
    icon: Banknote,
    children: [
      { id: 'payments', label: 'Providers', icon: CreditCard },
      { 
        id: 'processors',
        label: 'Processors',
        icon: Building2,
        children: [
          { id: 'pc-bank-card', label: 'PC Bank Card', icon: Building2 },
        ]
      },
    ]
  },
  { id: 'scheduled', label: 'Scheduled tasks', icon: Clock },
  { id: 'mail', label: 'Mail Manus', icon: Mail },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'cloud', label: 'Cloud browser', icon: Cloud },
  { id: 'personalization', label: 'Personalization', icon: Palette },
  { id: 'connectors', label: 'Connectors', icon: Zap },
]

export function SettingsPortalModal({ isOpen: propIsOpen, onClose: propOnClose }: SettingsPortalModalProps) {
  const { user, signOut, refresh } = useAuth()
  const { settingsOpen, closeSettings, activeTab, setActiveTab } = useModal()
  const isOpen = propIsOpen !== undefined ? propIsOpen : settingsOpen
  const onClose = propOnClose || closeSettings
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [addCreditOpen, setAddCreditOpen] = useState(false)
  
  // Use tRPC mutations at component level
  const uploadProfilePictureMutation = uploadMutation.useMutation()
  const deleteProfilePictureMutation = deleteMutation.useMutation()
  const billingPortalMutation = trpc.subscription.createBillingPortalSession.useMutation()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      // Focus the modal
      setTimeout(() => modalRef.current?.focus(), 0)
    } else {
      document.body.style.overflow = ''
      // Restore focus
      previousActiveElement.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Modal Window */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        style={{
          position: 'relative',
          width: `min(1200px, 92vw)`,
          height: `min(760px, 90vh)`,
          backgroundColor: 'rgba(15, 15, 15, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 id="settings-modal-title" style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 }}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Sidebar */}
          <div style={{
            width: '320px',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <nav style={{ padding: '16px 0', flex: 1 }}>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const hasChildren = 'children' in item && item.children
                const [expanded, setExpanded] = React.useState(true)
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          setExpanded(!expanded)
                        } else {
                          setActiveTab(item.id as SettingsTab)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isActive && !hasChildren ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        border: 'none',
                        borderLeft: isActive && !hasChildren ? '3px solid #ef4444' : '3px solid transparent',
                        color: isActive && !hasChildren ? 'white' : 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: isActive && !hasChildren ? '500' : '400',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      {hasChildren && (
                        <ChevronDown 
                          size={16} 
                          style={{ 
                            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 200ms ease'
                          }} 
                        />
                      )}
                    </button>
                    
                    {/* Nested children */}
                    {hasChildren && expanded && (
                      <div style={{ paddingLeft: '16px' }}>
                        {item.children.map((child: any) => {
                          const ChildIcon = child.icon
                          const isChildActive = activeTab === child.id
                          const hasGrandChildren = 'children' in child && child.children
                          const [childExpanded, setChildExpanded] = React.useState(true)
                          
                          return (
                            <div key={child.id}>
                              <button
                                onClick={() => {
                                  if (hasGrandChildren) {
                                    setChildExpanded(!childExpanded)
                                  } else {
                                    setActiveTab(child.id as SettingsTab)
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  background: isChildActive && !hasGrandChildren ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                  border: 'none',
                                  borderLeft: isChildActive && !hasGrandChildren ? '3px solid #ef4444' : '3px solid transparent',
                                  color: isChildActive && !hasGrandChildren ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: isChildActive && !hasGrandChildren ? '500' : '400',
                                  transition: 'all 200ms ease',
                                }}
                              >
                                <ChildIcon size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{child.label}</span>
                                {hasGrandChildren && (
                                  <ChevronDown 
                                    size={14} 
                                    style={{ 
                                      transform: childExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                      transition: 'transform 200ms ease'
                                    }} 
                                  />
                                )}
                              </button>
                              
                              {/* Grand children */}
                              {hasGrandChildren && childExpanded && (
                                <div style={{ paddingLeft: '16px' }}>
                                  {child.children.map((grandChild: any) => {
                                    const GrandChildIcon = grandChild.icon
                                    const isGrandChildActive = activeTab === grandChild.id
                                    
                                    return (
                                      <button
                                        key={grandChild.id}
                                        onClick={() => setActiveTab(grandChild.id as SettingsTab)}
                                        style={{
                                          width: '100%',
                                          padding: '8px 16px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          background: isGrandChildActive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                          border: 'none',
                                          borderLeft: isGrandChildActive ? '3px solid #ef4444' : '3px solid transparent',
                                          color: isGrandChildActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          fontWeight: isGrandChildActive ? '500' : '400',
                                          transition: 'all 200ms ease',
                                        }}
                                      >
                                        <GrandChildIcon size={14} />
                                        <span>{grandChild.label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Footer - Sign Out */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <button
                onClick={async () => {
                  await signOut()
                  onClose()
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
            color: 'white',
          }}>
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Profile Photo Editor */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Profile Photo</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                      {/* Avatar Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            backgroundColor: previewUrl || user?.photoUrl ? 'transparent' : 'rgba(239, 68, 68, 0.2)',
                            border: '2px solid rgba(239, 68, 68, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundImage: previewUrl || user?.photoUrl ? `url('${previewUrl || user?.photoUrl}')` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                          }}
                          title="Click to change photo"
                        >
                          {!previewUrl && !user?.photoUrl && (user?.name?.charAt(0).toUpperCase() || 'U')}
                        </button>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                          Click to change
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Validate file size (5MB max)
                            if (file.size > 5 * 1024 * 1024) {
                              setUploadError('File size must be less than 5MB');
                              return;
                            }

                            // Validate file type
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                              setUploadError('Only JPG, PNG, and WebP files are supported');
                              return;
                            }

                            setUploadError(null);
                            setUploading(true);

                            try {
                              // Read file as base64
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const base64Data = (event.target?.result as string)?.split(',')[1];
                                if (!base64Data) {
                                  setUploadError('Failed to read file');
                                  setUploading(false);
                                  return;
                                }

                                try {
                                  // Call tRPC upload endpoint
                                  const result = await uploadProfilePictureMutation.mutateAsync({
                                    imageData: base64Data,
                                    mimeType: file.type,
                                  });

                                  if (result.success) {
                                    setPreviewUrl(result.photoUrl);
                                    // Refresh user data and invalidate tRPC cache
                                    await refresh();
                                    // Invalidate auth.me query to update all components using useAuth()
                                    await trpc.auth.me.invalidate();
                                  } else {
                                    setUploadError(result.message || 'Failed to upload photo');
                                  }
                                } catch (error) {
                                  setUploadError('Failed to upload photo');
                                  console.error('Upload error:', error);
                                  // Still try to refresh in case of partial update
                                  try {
                                    await refresh();
                                    await trpc.auth.me.invalidate();
                                  } catch (e) {
                                    // Silently fail
                                  }
                                } finally {
                                  setUploading(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            } catch (error) {
                              setUploadError('Failed to process file');
                              setUploading(false);
                            }
                          }}
                        />

                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                          <div style={{ marginBottom: '8px' }}>Supported formats: JPG, PNG, WebP</div>
                          <div style={{ marginBottom: '8px' }}>Max size: 5MB</div>
                          <div>Recommended: 256×256 or larger</div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              backgroundColor: uploading ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#ef4444',
                              cursor: uploading ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              opacity: uploading ? 0.6 : 1,
                            }}
                          >
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </button>

                          {(previewUrl || user?.photoUrl) && (
                            <button
                              onClick={async () => {
                                try {
                                  await deleteProfilePictureMutation.mutateAsync();
                                  setPreviewUrl(null);
                                  await refresh();
                                } catch (error) {
                                  setUploadError('Failed to remove photo');
                                  console.error('Delete error:', error);
                                }
                              }}
                              disabled={uploading}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                opacity: uploading ? 0.6 : 1,
                              }}
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>

                        {uploadError && (
                          <div style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            fontSize: '13px',
                          }}>
                            {uploadError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Account Information</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <UserAvatar
                        photoUrl={user?.photoUrl}
                        name={user?.name}
                        size="lg"
                      />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{user?.name || 'User'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.email || 'No email'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Card */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Plan</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                          DojoFlow Pro
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Renewal date: Feb 12, 2026
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={async () => {
                            setPortalLoading(true)
                            try {
                              const orgId = user?.activeOrgId
                              if (!orgId) {
                                toast.error('Organization not found')
                                setPortalLoading(false)
                                return
                              }
                              console.log('[Manage Button] Opening billing portal for org:', orgId)
                              const result = await billingPortalMutation.mutateAsync({ organizationId: orgId })
                              console.log('[Manage Button] Portal session created:', result)
                              if (result?.url) {
                                console.log('[Manage Button] Redirecting to:', result.url)
                                window.location.href = result.url
                              } else {
                                toast.error('Failed to get billing portal URL')
                                setPortalLoading(false)
                              }
                            } catch (error: any) {
                              console.error('[Manage Button] Full error object:', error)
                              const errorMessage = error?.message ?? error?.data?.zodError ?? "Couldn't open billing portal"
                              console.error('[Manage Button] Error message:', errorMessage)
                              
                              // In development, append Stripe error message
                              let toastMessage = "Couldn't open billing portal. Please try again."
                              if (process.env.NODE_ENV === 'development' && errorMessage) {
                                toastMessage = `${toastMessage} (${errorMessage})`
                              }
                              
                              toast.error(toastMessage)
                              setPortalLoading(false)
                            }
                          }}
                          disabled={portalLoading}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backgroundColor: 'transparent',
                            color: 'white',
                            fontSize: '14px',
                            cursor: portalLoading ? 'not-allowed' : 'pointer',
                            opacity: portalLoading ? 0.6 : 1,
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={(e) => !portalLoading && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                          onMouseLeave={(e) => !portalLoading && (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {portalLoading ? 'Opening...' : 'Manage'}
                        </button>
                        <button 
                          onClick={() => setAddCreditOpen(true)}
                          style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'white',
                          color: 'black',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Add credit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credits Card */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} color="white" />
                    Credits
                  </div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Free credits</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>87,893</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Monthly credits</span>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>87,700 / 110,000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Daily refresh credits</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>0</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
                        Refresh to 200 at 23:00 every day
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="white" />
                    API Usage
                  </div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Requests this month</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>12,450</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Requests limit</span>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>100,000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Usage percentage</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e' }}>12.45%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden',
                        marginTop: '8px',
                      }}>
                        <div style={{
                          width: '12.45%',
                          height: '100%',
                          backgroundColor: '#22c55e',
                          borderRadius: '4px',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Billing Overview</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Current plan</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>DojoFlow Pro</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Billing cycle</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>Monthly</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Next billing date</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>Feb 12, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personalization Tab */}
            {activeTab === 'personalization' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Theme</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {['Automatic', 'Light', 'Dark'].map((theme) => (
                        <label key={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                          <input type="radio" name="theme" value={theme} defaultChecked={theme === 'Automatic'} style={{ cursor: 'pointer' }} />
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connectors Tab */}
            {activeTab === 'connectors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Available Integrations</div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {['Zapier', 'Make', 'HubSpot', 'Slack'].map((connector) => (
                        <button key={connector} style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backgroundColor: 'transparent',
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 200ms ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Connect {connector}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <PaymentsSettingsTab />
            )}

            {/* School Profile Tab */}
            {activeTab === 'school' && (
              <SchoolProfileSettingsTab />
            )}

            {/* PC Bank Card Tab */}
            {activeTab === 'pc-bank-card' && (
              <PCBankCardOnboarding />
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== 'account' && activeTab !== 'usage' && activeTab !== 'billing' && activeTab !== 'personalization' && activeTab !== 'connectors' && activeTab !== 'payments' && activeTab !== 'school' && activeTab !== 'pc-bank-card' && (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
                <div style={{ fontSize: '16px' }}>
                  {navigationItems.find(item => item.id === activeTab)?.label} settings coming soon
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(modalContent, document.body)}
      <AddCreditModal isOpen={addCreditOpen} onClose={() => setAddCreditOpen(false)} />
    </>
  )
}

export default SettingsPortalModal
