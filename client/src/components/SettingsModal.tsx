import { useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Upload, X } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
}

export default function SettingsModal({ isOpen, onClose, isDarkMode }: SettingsModalProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
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

      // Reload page to show updated avatar
      window.location.reload()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md",
        isDarkMode ? "bg-[#1a1a1b] border-white/10" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
            Settings
          </DialogTitle>
          <DialogDescription className={isDarkMode ? "text-white/60" : "text-gray-600"}>
            Manage your profile and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className={cn("text-sm font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Profile
            </h3>

            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold",
                isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600"
              )}>
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>

              <div className="flex-1 space-y-2">
                <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                  {user?.name || 'User'}
                </p>
                <p className={cn("text-xs", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>

            {/* Photo Upload Button */}
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full cursor-pointer",
                  isDarkMode
                    ? "border-white/10 text-white hover:bg-white/5"
                    : "border-gray-200 text-gray-900 hover:bg-gray-50"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  input?.click()
                }}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </Button>
            </label>

            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
          </div>

          {/* Credits Section */}
          <div className="space-y-4">
            <h3 className={cn("text-sm font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Credits
            </h3>

            <div className={cn(
              "p-4 rounded-lg space-y-3",
              isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"
            )}>
              <div className="flex justify-between items-center">
                <span className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  Available Credits
                </span>
                <span className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                  {user?.credits || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                  Monthly Usage
                </span>
                <span className={cn("text-sm", isDarkMode ? "text-white/40" : "text-gray-500")}>
                  {user?.monthlyUsage || 0} credits
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full",
                  isDarkMode
                    ? "border-white/10 text-white hover:bg-white/5"
                    : "border-gray-200 text-gray-900 hover:bg-gray-50"
                )}
              >
                View Billing
              </Button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className={cn("text-sm font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Preferences
            </h3>

            <div className={cn(
              "p-4 rounded-lg",
              isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"
            )}>
              <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-600")}>
                Theme and notification settings are available in the main menu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              isDarkMode
                ? "border-white/10 text-white hover:bg-white/5"
                : "border-gray-200 text-gray-900 hover:bg-gray-50"
            )}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
