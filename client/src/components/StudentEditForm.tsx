import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save, Loader2, Camera, Upload } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StudentEditFormProps {
  studentId: number;
  initialData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    program?: string;
    beltRank?: string;
    status?: string;
    photoUrl?: string | null;
    address?: string;
    dateOfBirth?: string;
  };
  onClose: () => void;
  onSave?: (updatedData: any) => void;
}

export function StudentEditForm({
  studentId,
  initialData,
  onClose,
  onSave,
}: StudentEditFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.photoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    program: initialData.program || '',
    beltRank: initialData.beltRank || '',
    status: initialData.status || 'Active',
    address: initialData.address || '',
    dateOfBirth: initialData.dateOfBirth || '',
  });

  // TRPC mutations
  const updateStudentMutation = trpc.students.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Student information updated successfully',
        duration: 3000,
      });
      setIsSaving(false);
      onSave?.(data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student',
        variant: 'destructive',
        duration: 3000,
      });
      setIsSaving(false);
    },
  });

  const uploadPhotoMutation = trpc.students.uploadPhoto.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });
      setPhotoPreview(data.url);
      setFormData((prev) => ({ ...prev }));
      setIsUploadingPhoto(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
      setIsUploadingPhoto(false);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setIsUploadingPhoto(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        await uploadPhotoMutation.mutateAsync({
          base64Data: base64String,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateStudentMutation.mutateAsync({
        id: studentId,
        ...formData,
      });
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={photoPreview || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {(formData.firstName?.[0] || 'S') + (formData.lastName?.[0] || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Choose Photo
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 w-full bg-primary hover:bg-primary/90"
                  onClick={handleSavePhoto}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Save Photo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            aria-label="Upload student photo"
          />
          <p className="text-xs text-muted-foreground">
            Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
          </p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                className="min-h-20 resize-none bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Program & Belt Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Program & Belt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program" className="text-sm font-medium">
                Program
              </Label>
              <Input
                id="program"
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                placeholder="e.g., Karate, Taekwondo"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beltRank" className="text-sm font-medium">
                Belt Rank
              </Label>
              <select
                id="beltRank"
                name="beltRank"
                value={formData.beltRank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select belt rank</option>
                <option value="White Belt">White Belt</option>
                <option value="Yellow Belt">Yellow Belt</option>
                <option value="Orange Belt">Orange Belt</option>
                <option value="Green Belt">Green Belt</option>
                <option value="Blue Belt">Blue Belt</option>
                <option value="Brown Belt">Brown Belt</option>
                <option value="Black Belt">Black Belt</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="At Risk">At Risk</option>
              <option value="On Hold">On Hold</option>
              <option value="Trial">Trial</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
