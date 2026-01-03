import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { BrandLogo } from '@/components/BrandLogo'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Settings,
  BarChart3,
  CreditCard,
  Calendar,
  Mail,
  Database,
  Puzzle,
  HelpCircle,
  ExternalLink,
  X,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Shield,
  Bell,
  Building2,
  Users,
  LogOut,
  Cloud,
  Loader2,
  Camera,
  Trash2,
} from 'lucide-react'
interface AccountCommandPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

type SectionId = 'account' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'cloud' | 'connectors' | 'integrations'

interface NavItem {
  id: SectionId
  label: string
  icon: typeof User
}

const navItems: NavItem[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled tasks', icon: Calendar },
  { id: 'mail', label: 'Mail Dojo', icon: Mail },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'cloud', label: 'Cloud browser', icon: Cloud },
  { id: 'connectors', label: 'Connectors', icon: Puzzle },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
]

const themeOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinema', icon: Sparkles },
]

export function AccountCommandPanel({ isOpen, onClose, anchorRef }: AccountCommandPanelProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('usage')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const { toast } = useToast()
  
  // Edit profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })
  
  // Profile picture state
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.photoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
      setProfilePicturePreview(user.photoUrl || null)
    }
  }, [user])
  
  // Update profile mutation
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
      setIsEditingProfile(false)
      // Refresh user data
      window.location.reload()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })
  
  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm)
  }
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = trpc.auth.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been successfully updated.',
      })
      setProfilePicturePreview(data.photoUrl)
      // Refresh user data
      window.location.reload()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      })
    },
  })
  
  // Delete profile picture mutation
  const deleteProfilePictureMutation = trpc.auth.deleteProfilePicture.useMutation({
    onSuccess: () => {
      toast({
        title: 'Profile picture removed',
        description: 'Your profile picture has been removed.',
      })
      setProfilePicturePreview(null)
      // Refresh user data
      window.location.reload()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove profile picture',
        variant: 'destructive',
      })
    },
  })
  
  // Handle profile picture file selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }
    
    // Read file and convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      setProfilePicturePreview(base64Data)
      
      // Upload to server
      uploadProfilePictureMutation.mutate({
        imageData: base64Data,
        mimeType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }
  
  // Handle delete profile picture
  const handleDeleteProfilePicture = () => {
    deleteProfilePictureMutation.mutate()
  }
  
  // Fetch credit balance
  const { data: creditBalance } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isOpen,
    refetchInterval: 60000,
  })
  
  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = user?.name || user?.email?.split('@')[0]
    if (!displayName) return 'U'
    const names = displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }
  
  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }
  
  // Get user role
  const getUserRole = () => {
    if (user?.globalRole === 'platform_admin') return 'Platform Admin'
    if (user?.role === 'admin') return 'Admin'
    if (user?.role === 'owner') return 'Owner'
    return 'School Owner'
  }
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])
  
  // Animation control
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])
  
  // Handle logout
  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/owner')
  }
  
  // Navigation handlers
  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }
  
  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }, [])
  
  if (!isOpen && !isAnimating) return null

  // Sample usage data for the Usage section
  const usageData = [
    { details: 'DOJO FLOW', date: '2026-01-02 17:33', credits: -361002 },
    { details: 'Upgrade plan', date: '2026-01-02 11:50', credits: 85000 },
    { details: 'Understanding Uploaded Files and Their Contents', date: '2026-01-02 11:39', credits: -491 },
    { details: 'This task has been deleted', date: '2025-12-31 21:11', credits: -763 },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'usage':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Usage</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            {/* Plan Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">DojoFlow Pro</h3>
                  <p className="text-sm text-zinc-500">Renewal date: Feb 2, 2026</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                    Manage
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                    Add credits
                  </button>
                </div>
              </div>
            </div>
            
            {/* Credits Stats */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">Credits</span>
                  <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">?</span>
                </div>
                <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">
                  {creditBalance?.balance?.toLocaleString() ?? '72,913'}
                </span>
              </div>
              
              <div className="pl-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Free credits</span>
                  <span className="text-zinc-700 dark:text-zinc-300">74</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Monthly credits</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{creditBalance?.balance?.toLocaleString() ?? '72,839'} / 85,000</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">Daily refresh credits</span>
                  <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">?</span>
                </div>
                <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">115</span>
              </div>
              <p className="pl-6 text-xs text-zinc-500">Refresh to 300 at 23:00 every day</p>
            </div>
            
            {/* Website Usage & Billing */}
            <div className="flex-1">
              <button 
                onClick={() => handleNavigate('/billing/credits')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Website usage & billing</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
              
              {/* Usage Table */}
              <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Credits change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900">
                    {usageData.map((item, index) => (
                      <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">{item.details}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{item.date}</td>
                        <td className={`px-4 py-3 text-sm text-right tabular-nums ${item.credits > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                          {item.credits > 0 ? '+' : ''}{item.credits.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                <button className="px-2 py-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">&lt; Previous</button>
                <button className="px-2 py-1 text-zinc-800 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 rounded">1</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">2</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">3</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">4</button>
                <span className="text-zinc-400">...</span>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">21</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">22</button>
                <button className="px-3 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Next &gt;</button>
              </div>
            </div>
          </div>
        )
      
      case 'account':
        return (
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Account</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            {/* Profile Section */}
            <div className="space-y-6">
              {!isEditingProfile ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <Avatar className="h-16 w-16 rounded-xl">
                    <AvatarImage src={user?.avatar} className="rounded-xl" />
                    <AvatarFallback className="rounded-xl text-lg font-bold bg-gradient-to-br from-red-500 to-orange-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">{getDisplayName()}</h3>
                    <p className="text-sm text-zinc-500">{user?.email || 'owner@dojoflow.com'}</p>
                    {user?.phone && <p className="text-sm text-zinc-500">{user.phone}</p>}
                    {user?.bio && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{user.bio}</p>}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Shield className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{getUserRole()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Edit Profile</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Profile Picture */}
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profilePicturePreview || undefined} alt={user?.name || 'User'} />
                          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadProfilePictureMutation.isPending}
                          >
                            {uploadProfilePictureMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4 mr-2" />
                            )}
                            Upload
                          </Button>
                          {profilePicturePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteProfilePicture}
                              disabled={deleteProfilePictureMutation.isPending}
                            >
                              {deleteProfilePictureMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200px, max 5MB
                      </p>
                    </div>
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Tell us about yourself (max 160 characters)"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {profileForm.bio.length}/160 characters
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false)
                        // Reset form to current user data
                        if (user) {
                          setProfileForm({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            bio: user.bio || '',
                          })
                        }
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleNavigate('/settings/school')}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
                >
                  <Building2 className="w-5 h-5 text-amber-500 mb-2" />
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">School Profile</h4>
                  <p className="text-xs text-zinc-500">Manage dojo details</p>
                </button>
                <button 
                  onClick={() => handleNavigate('/staff')}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
                >
                  <Users className="w-5 h-5 text-blue-500 mb-2" />
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Staff & Roles</h4>
                  <p className="text-xs text-zinc-500">Team management</p>
                </button>
              </div>
              
              {/* Theme Selector */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    {theme === 'light' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme</span>
                </div>
                
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200 dark:bg-zinc-700">
                  {themeOptions.map((t) => {
                    const isActive = theme === t.id
                    const Icon = t.icon
                    
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                          text-xs font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-white dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }
                        `}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">Sign Out</span>
              </button>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleNavigate('/settings/notifications')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/settings/integrations')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Puzzle className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Integrations</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/security')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Security & Privacy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
            </div>
          </div>
        )
      
      case 'billing':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Billing</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-500">Current Plan</span>
                  <span className="px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">Active</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">DojoFlow Pro</h3>
                <p className="text-sm text-zinc-500">Next billing: Feb 2, 2026</p>
              </div>
              
              <button 
                onClick={() => handleNavigate('/billing')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Manage subscription</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/billing/credits')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">AI Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {creditBalance?.balance?.toLocaleString() ?? '72,913'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">Coming Soon</h3>
            <p className="text-sm text-zinc-500 max-w-[200px]">This section is under development and will be available soon.</p>
          </div>
        )
    }
  }
  
  return (
    <>
      {/* Fog/Blur Overlay Background */}
      <div 
        className={`
          fixed inset-0 z-[9998] transition-all duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ 
          background: 'rgba(0, 0, 0, 0.65)', // 65% opacity for fog effect
          backdropFilter: 'blur(12px)', // 12px blur for cinematic look
          WebkitBackdropFilter: 'blur(12px)', // Safari support
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onKeyDown={handleKeyDown}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false)
        }}
        className={`
          fixed z-[9999] 
          top-6 left-1/2 -translate-x-1/2
          w-[800px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-48px)]
          rounded-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        style={{
          background: 'var(--modal-bg, #ffffff)',
          border: '1px solid var(--modal-border, rgba(255, 255, 255, 0.1))',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 0 40px rgba(0, 0, 0, 0.3)
          `, // Strong shadow + subtle glow for focus effect
        }}
      >
        <div className="flex h-full bg-white dark:bg-zinc-900">
          {/* Left Sidebar */}
          <div className="w-[220px] h-full flex flex-col border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            {/* Logo/Brand - Using official DojoFlow branding */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-700">
              <BrandLogo size="md" />
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 py-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                      ${isActive 
                        ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            
            {/* Footer Links */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
              <button 
                onClick={() => handleNavigate('/help')}
                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Get help</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </button>
            </div>
          </div>
          
          {/* Right Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
            {renderContent()}
          </div>
        </div>
      </div>
      

    </>
  )
}

export default AccountCommandPanel
