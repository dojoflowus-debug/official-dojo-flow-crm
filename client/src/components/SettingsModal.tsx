import { useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { 
  Upload, X, Settings, CreditCard, BarChart3, Clock, Mail, Database, 
  Cloud, Palette, Zap, HelpCircle, User, LogOut
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
}

type SettingsTab = 'account' | 'settings' | 'usage' | 'billing'

export default function SettingsModal({ isOpen, onClose, isDarkMode }: SettingsModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      window.location.reload()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
      setIsUploading(false)
    }
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
    { id: 'help', label: 'Get help', icon: HelpCircle },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl h-[600px] p-0 gap-0",
        isDarkMode ? "bg-[#1a1a1b] border-white/10" : "bg-white border-gray-200"
      )}>
        <div className="flex h-full">
          {/* Left Sidebar Navigation */}
          <div className={cn(
            "w-64 border-r flex flex-col",
            isDarkMode ? "bg-[#0f0f10] border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            {/* Header */}
            <div className={cn(
              "px-4 py-4 border-b flex items-center justify-between",
              isDarkMode ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                  isDarkMode ? "bg-white/10 text-white" : "bg-gray-200 text-gray-900"
                )}>
                  M
                </div>
                <span className={cn("text-xs font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                  manus
                </span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? isDarkMode
                          ? "bg-white/10 text-white"
                          : "bg-gray-200 text-gray-900"
                        : isDarkMode
                          ? "text-white/60 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Get Help Footer */}
            <div className={cn(
              "px-2 py-4 border-t",
              isDarkMode ? "border-white/10" : "border-gray-200"
            )}>
              <button className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                isDarkMode
                  ? "text-white/60 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}>
                <HelpCircle className="h-4 w-4" />
                <span>Get help</span>
              </button>
            </div>
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'account' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                    Account
                  </h2>

                  {/* Profile Card */}
                  <div className={cn(
                    "p-4 rounded-lg border mb-6",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold",
                            isDarkMode ? "bg-white/10 text-white" : "bg-gray-200 text-gray-600"
                          )}>
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                          </div>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            isDarkMode ? "bg-green-500 border-[#1a1a1b]" : "bg-green-500 border-white"
                          )}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                        </div>

                        <div>
                          <p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                            {user?.name || 'User'}
                          </p>
                          <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                            {user?.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className={cn(
                          "p-2 rounded-lg",
                          isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
                        )}>
                          <User className="h-4 w-4" />
                        </button>
                        <button className={cn(
                          "p-2 rounded-lg text-red-500",
                          isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
                        )}>
                          <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className={cn(
                    "p-4 rounded-lg border mb-6",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                          DojoFlow Pro
                        </p>
                        <p className={cn("text-xs mt-1", isDarkMode ? "text-white/60" : "text-gray-600")}>
                          Renewal date: Feb 12, 2026
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            isDarkMode
                              ? "border-white/10 text-white hover:bg-white/5"
                              : "border-gray-200 text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          Add credit
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Credits Section */}
                  <div className={cn(
                    "p-4 rounded-lg border",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-4 w-4" />
                      <p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                        Credits
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                          Free credits
                        </span>
                        <span className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                          87,893
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                          Monthly credits
                        </span>
                        <span className={cn("text-sm", isDarkMode ? "text-white/40" : "text-gray-500")}>
                          87,700 / 110,000
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                          Daily refresh credits
                        </span>
                        <span className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                          0
                        </span>
                      </div>
                      <p className={cn("text-xs mt-2", isDarkMode ? "text-white/40" : "text-gray-500")}>
                        Refresh to 200 at 23:00 every day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6">
                <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                  Settings
                </h2>
                <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  Settings panel content coming soon
                </p>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="p-6">
                <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                  Usage
                </h2>
                <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  Usage analytics coming soon
                </p>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="p-6">
                <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                  Billing
                </h2>
                <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  Billing information coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
