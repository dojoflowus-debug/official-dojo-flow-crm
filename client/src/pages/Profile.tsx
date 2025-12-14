import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar, 
  Edit2, 
  Camera, 
  X, 
  Check,
  Building,
  Hash,
  Loader2
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    preferredName: '',
    phone: '',
    bio: '',
  });
  
  // Preview photo state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<{ data: string; type: string; size: number } | null>(null);
  
  // Fetch profile data
  const { data: profile, isLoading, refetch } = trpc.profile.me.useQuery();
  
  // Mutations
  const updateProfile = trpc.profile.update.useMutation();
  const uploadPhoto = trpc.profile.uploadPhoto.useMutation();
  
  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.name || '',
        preferredName: profile.preferredName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);
  
  // Get theme-based styles
  const isDark = theme === 'dark' || theme === 'cinematic';
  
  const handleOpenEdit = () => {
    setIsEditOpen(true);
    setHasUnsavedChanges(false);
    setPreviewPhoto(null);
    setPhotoFile(null);
  };
  
  const handleCloseEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setIsEditOpen(false);
    }
  };
  
  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setIsEditOpen(false);
    setHasUnsavedChanges(false);
    // Reset form data
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.name || '',
        preferredName: profile.preferredName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
    setPreviewPhoto(null);
    setPhotoFile(null);
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewPhoto(dataUrl);
      setPhotoFile({
        data: dataUrl,
        type: file.type,
        size: file.size,
      });
      setHasUnsavedChanges(true);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Upload photo if changed
      if (photoFile) {
        setIsUploadingPhoto(true);
        await uploadPhoto.mutateAsync({
          fileData: photoFile.data,
          fileType: photoFile.type,
          fileSize: photoFile.size,
        });
        setIsUploadingPhoto(false);
      }
      
      // Update profile data
      await updateProfile.mutateAsync({
        displayName: formData.displayName || undefined,
        preferredName: formData.preferredName || undefined,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
      });
      
      toast.success('Profile updated successfully');
      setHasUnsavedChanges(false);
      setIsEditOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
      setIsUploadingPhoto(false);
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'staff': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };
  
  if (isLoading) {
    return (
      <BottomNavLayout title="Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </BottomNavLayout>
    );
  }
  
  return (
    <BottomNavLayout title="Profile">
      <div className="container max-w-2xl py-8">
        {/* Profile Card */}
        <Card className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-primary/20">
                  <AvatarImage src={profile?.photoUrl || undefined} />
                  <AvatarFallback className={`text-xl font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    {getInitials(profile?.displayName || profile?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {profile?.displayName || profile?.name || 'Unknown User'}
                  </CardTitle>
                  {profile?.preferredName && (
                    <CardDescription className="text-base">
                      Goes by "{profile.preferredName}"
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={getRoleBadgeColor(profile?.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                    </Badge>
                    {profile?.staffId && (
                      <Badge variant="outline" className={`${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                        <Hash className="w-3 h-3 mr-1" />
                        {profile.staffId}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          
          <Separator className={isDark ? 'bg-slate-800' : 'bg-slate-200'} />
          
          <CardContent className="pt-6 space-y-6">
            {/* Bio */}
            {profile?.bio && (
              <div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {profile.bio}
                </p>
              </div>
            )}
            
            {/* Contact Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                  <p className="text-sm font-medium">{profile?.email || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Phone</p>
                  <p className="text-sm font-medium">{profile?.phone || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Building className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Location(s)</p>
                  <p className="text-sm font-medium">
                    {profile?.locationIds?.length ? `${profile.locationIds.length} assigned` : 'Not assigned'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Member Since</p>
                  <p className="text-sm font-medium">{formatDate(profile?.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Profile Sheet */}
      <Sheet open={isEditOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <SheetContent className={`w-full sm:max-w-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Update your profile information. Changes will be visible to other staff members.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary/20">
                  <AvatarImage src={previewPhoto || profile?.photoUrl || undefined} />
                  <AvatarFallback className={`text-2xl font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    {getInitials(formData.displayName || profile?.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`absolute bottom-0 right-0 p-2 rounded-full border-2 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  } transition-colors`}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                JPG, PNG, or WebP. Max 10MB.
              </p>
            </div>
            
            <Separator className={isDark ? 'bg-slate-800' : 'bg-slate-200'} />
            
            {/* Editable Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Your full name"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred Name (optional)</Label>
                <Input
                  id="preferredName"
                  value={formData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  placeholder="What should we call you?"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 160))}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  rows={3}
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
                <p className={`text-xs text-right ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formData.bio.length}/160
                </p>
              </div>
            </div>
            
            <Separator className={isDark ? 'bg-slate-800' : 'bg-slate-200'} />
            
            {/* View-only Fields */}
            <div className="space-y-4">
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                View-only Information
              </p>
              
              <div className="space-y-2">
                <Label className={isDark ? 'text-slate-500' : 'text-slate-400'}>Email</Label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50'} opacity-60`}
                />
              </div>
              
              <div className="space-y-2">
                <Label className={isDark ? 'text-slate-500' : 'text-slate-400'}>Role</Label>
                <Input
                  value={profile?.role?.charAt(0).toUpperCase() + (profile?.role?.slice(1) || '')}
                  disabled
                  className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50'} opacity-60`}
                />
              </div>
              
              {profile?.staffId && (
                <div className="space-y-2">
                  <Label className={isDark ? 'text-slate-500' : 'text-slate-400'}>Staff ID</Label>
                  <Input
                    value={profile.staffId}
                    disabled
                    className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50'} opacity-60`}
                  />
                </div>
              )}
            </div>
          </div>
          
          <SheetFooter className="flex gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={handleCloseEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploadingPhoto ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Unsaved Changes Warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent className={isDark ? 'bg-slate-900 border-slate-800' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BottomNavLayout>
  );
}
