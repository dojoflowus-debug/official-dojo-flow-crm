import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/_core/hooks/useAuth'
import { useModal } from '@/contexts/ModalContext'
import { cn } from '@/lib/utils'
import { 
  User, Settings, BarChart3, CreditCard, Clock, Mail, Database, 
  Cloud, Palette, Zap, HelpCircle, LogOut, X, ExternalLink
} from 'lucide-react'

interface SettingsPortalModalProps {
  isOpen?: boolean
  onClose?: () => void
}

type SettingsTab = 'account' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'cloud' | 'personalization' | 'connectors' | 'help'

const navigationItems = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled tasks', icon: Clock },
  { id: 'mail', label: 'Mail Manus', icon: Mail },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'cloud', label: 'Cloud browser', icon: Cloud },
  { id: 'personalization', label: 'Personalization', icon: Palette },
  { id: 'connectors', label: 'Connectors', icon: Zap },
]

export function SettingsPortalModal({ isOpen: propIsOpen, onClose: propOnClose }: SettingsPortalModalProps) {
  const { user, signOut } = useAuth()
  const { settingsOpen, closeSettings } = useModal()
  const isOpen = propIsOpen !== undefined ? propIsOpen : settingsOpen
  const onClose = propOnClose || closeSettings
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

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
          width: 'min(1200px, 92vw)',
          height: 'min(760px, 90vh)',
          maxWidth: 'none',
          maxHeight: 'none',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a1b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header with version label */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f0f10',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              padding: '4px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em',
            }}>
              SETTINGS MODAL REBUILD v1
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar - Fixed 320px */}
          <div style={{
            width: '320px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f0f10',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
          }}>
            {/* Brand Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                }}>
                  D
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>dojoflow</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Account Settings</div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #ef4444' : '3px solid transparent',
                      cursor: 'pointer',
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.color = 'white'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                      }
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Footer */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                }}
              >
                <HelpCircle size={18} />
                <span>Get help</span>
                <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          </div>

          {/* Right Content Area - Scrollable */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#1a1a1b',
          }}>
            {/* Content Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: 0,
              backgroundColor: '#1a1a1b',
              zIndex: 10,
            }}>
              <h2 id="settings-modal-title" style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'white',
                margin: 0,
              }}>
                {navigationItems.find(item => item.id === activeTab)?.label || 'Account'}
              </h2>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px 32px' }}>
              {activeTab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Profile Card */}
                  <div style={{
                    padding: '24px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '600',
                        color: 'white',
                        position: 'relative',
                      }}>
                        {user?.photoUrl ? (
                          <img 
                            src={user.photoUrl} 
                            alt={user.name || 'User'} 
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          border: '3px solid #1a1a1b',
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                          {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {user?.email || 'No email'}
                        </div>
                      </div>
                      <button
                        onClick={() => signOut?.()}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Plan Card */}
                  <div style={{
                    padding: '24px',
                    borderRadius: '16px',
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
                        <button style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backgroundColor: 'transparent',
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}>
                          Manage
                        </button>
                        <button style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'white',
                          color: 'black',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}>
                          Add credit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Credits Card */}
                  <div style={{
                    padding: '24px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <CreditCard size={18} color="white" />
                      <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>Credits</span>
                    </div>
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
              )}

              {activeTab !== 'account' && (
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
    </div>
  )

  // Render to document.body using React Portal
  return createPortal(modalContent, document.body)
}

export default SettingsPortalModal
