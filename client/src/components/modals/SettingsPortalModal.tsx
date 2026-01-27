import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/_core/hooks/useAuth'
import { useModal, type SettingsTab } from '@/contexts/ModalContext'
import { cn } from '@/lib/utils'
import { 
  User, Settings, BarChart3, CreditCard, Clock, Mail, Database, 
  Cloud, Palette, Zap, HelpCircle, LogOut, X, ExternalLink
} from 'lucide-react'

interface SettingsPortalModalProps {
  isOpen?: boolean
  onClose?: () => void
}

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
  const { settingsOpen, closeSettings, activeTab, setActiveTab } = useModal()
  const isOpen = propIsOpen !== undefined ? propIsOpen : settingsOpen
  const onClose = propOnClose || closeSettings
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
          }}>
            <nav style={{ padding: '16px 0' }}>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #ef4444' : '3px solid transparent',
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? '500' : '400',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
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
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Account Information</div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{user?.name || 'User'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.email || 'No email'}</div>
                      </div>
                    </div>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}>
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>General Settings</div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      General application settings and preferences
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>API Usage</div>
                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>API Calls This Month</div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>12,543</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>Usage Limit</div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>100,000</div>
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: '12.5%',
                        backgroundColor: '#ef4444',
                      }} />
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
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>Current Plan</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>Professional</div>
                      </div>
                      <button style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}>
                        Upgrade
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Next billing date: Feb 1, 2026
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
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Automatic', 'Light', 'Dark'].map((theme) => (
                      <button key={theme} style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: theme === 'Dark' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}>
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>View Mode</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Kai View', 'Classic View'].map((view) => (
                      <button key={view} style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: view === 'Kai View' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}>
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Connectors Tab */}
            {activeTab === 'connectors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>Available Connectors</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>Connect with third-party services</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['Zapier', 'Make', 'HubSpot', 'Slack'].map((connector) => (
                      <div key={connector} style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ fontSize: '14px', color: 'white' }}>{connector}</div>
                        <button style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}>
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab (new) */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Profile Settings</div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{user?.name || 'User'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.email || 'No email'}</div>
                      </div>
                    </div>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}>
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== 'account' && activeTab !== 'usage' && activeTab !== 'billing' && activeTab !== 'personalization' && activeTab !== 'connectors' && activeTab !== 'profile' && activeTab !== 'settings' && (
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

  return createPortal(modalContent, document.body)
}

export default SettingsPortalModal
