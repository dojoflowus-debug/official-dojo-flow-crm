import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, User } from "lucide-react";

export default function OwnerProfile() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch existing profile
  const { data: profile, isLoading } = trpc.ownerProfile.getProfile.useQuery();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    specialties: "",
    certifications: "",
    yearsExperience: 0,
    profilePhotoUrl: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        specialties: profile.specialties || "",
        certifications: profile.certifications || "",
        yearsExperience: profile.yearsExperience || 0,
        profilePhotoUrl: profile.profilePhotoUrl || "",
      });
      if (profile.profilePhotoUrl) {
        setPhotoPreview(profile.profilePhotoUrl);
      }
    }
  }, [profile]);

  // Mutation for saving profile
  const upsertMutation = trpc.ownerProfile.upsertProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile saved",
        description: "Your owner profile has been updated successfully.",
      });
      utils.ownerProfile.getProfile.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  // Upload mutation
  const uploadMutation = trpc.upload.uploadAttachment.useMutation();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      let photoUrl = formData.profilePhotoUrl;

      // Upload photo if changed
      if (photoFile) {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const result = await uploadMutation.mutateAsync({
              fileName: photoFile.name,
              fileData: reader.result as string,
              fileType: photoFile.type,
              fileSize: photoFile.size,
              context: "general",
            });
            photoUrl = result.url;

            // Save profile with new photo URL
            await upsertMutation.mutateAsync({
              ...formData,
              profilePhotoUrl: photoUrl,
            });
            setIsUploading(false);
          } catch (error) {
            setIsUploading(false);
            toast({
              title: "Upload failed",
              description: "Failed to upload profile photo",
              variant: "destructive",
            });
          }
        };
        reader.readAsDataURL(photoFile);
      } else {
        // Save profile without photo upload
        await upsertMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Owner Profile</CardTitle>
          <CardDescription>
            Manage your instructor profile that will be visible to students and parents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell students about yourself, your martial arts journey, and teaching philosophy..."
              rows={4}
            />
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Input
              id="specialties"
              value={formData.specialties}
              onChange={(e) =>
                setFormData({ ...formData, specialties: e.target.value })
              }
              placeholder="e.g., Karate, Jiu-Jitsu, Self-Defense, Competition Training"
            />
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) =>
                setFormData({ ...formData, certifications: e.target.value })
              }
              placeholder="List your certifications, black belt ranks, instructor credentials..."
              rows={3}
            />
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of Experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              min="0"
              value={formData.yearsExperience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  yearsExperience: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending || isUploading || !formData.name}
            >
              {(upsertMutation.isPending || isUploading) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
