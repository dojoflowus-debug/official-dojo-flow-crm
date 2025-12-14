import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, refetch } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Initialize form with user data
  useEffect(() => {
    if (user && open) {
      setDisplayName(user.name || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatarUrl || '')
      setAvatarPreview(null)
      setAvatarFile(null)
    }
  }, [user, open])
  
  // Update profile mutation
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully')
      refetch()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile')
    }
  })
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      
      setAvatarFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }
  
  // Upload photo mutation
  const uploadPhotoMutation = trpc.profile.uploadPhoto.useMutation()
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }
    
    if (bio.length > 160) {
      toast.error('Bio must be 160 characters or less')
      return
    }
    
    setIsUploading(true)
    
    try {
      let newAvatarUrl = avatarUrl
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        // Convert file to base64 data URL
        const reader = new FileReader()
        const fileDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
        
        // Use tRPC uploadPhoto mutation
        const uploadResult = await uploadPhotoMutation.mutateAsync({
          fileData: fileDataUrl,
          fileType: avatarFile.type,
          fileSize: avatarFile.size,
        })
        
        newAvatarUrl = uploadResult.url
      }
      
      // Update profile
      await updateProfileMutation.mutateAsync({
        name: displayName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: newAvatarUrl || null,
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsUploading(false)
    }
  }
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!displayName) return 'U'
    const names = displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }
  
  const isLoading = updateProfileMutation.isPending || isUploading
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Preview" className="object-cover" />
                ) : avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-[#FF4C4C] to-[#E53935] text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(null)
                    setAvatarFile(null)
                  }}
                  className="absolute top-0 right-0 p-1 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">Click the camera icon to upload a photo</p>
          </div>
          
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>
          
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed as it's used for login</p>
          </div>
          
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160 characters
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !displayName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
