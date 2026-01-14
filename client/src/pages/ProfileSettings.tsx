import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, Loader2 } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const utils = trpc.useUtils();
  
  const uploadMutation = trpc.auth.uploadProfilePicture.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
      utils.auth.getCurrentUser.invalidate();
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = trpc.auth.deleteProfilePicture.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture removed successfully",
      });
      utils.auth.getCurrentUser.invalidate();
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Read file and create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!previewUrl) return;

    setIsUploading(true);
    
    // Extract mime type from data URL
    const mimeMatch = previewUrl.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    uploadMutation.mutate({
      imageData: previewUrl,
      mimeType,
    });
  };

  const handleDelete = () => {
    if (!user?.photoUrl) return;
    
    if (confirm("Are you sure you want to remove your profile picture?")) {
      deleteMutation.mutate();
    }
  };

  const getUserInitials = () => {
    const displayName = user?.name || user?.email?.split("@")[0];
    if (!displayName) return "U";
    return displayName.charAt(0).toUpperCase();
  };

  const currentPhotoUrl = previewUrl || user?.photoUrl;

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile picture and personal information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-2">
                {currentPhotoUrl && (
                  <AvatarImage src={currentPhotoUrl} alt={user?.name || "Profile"} />
                )}
                <AvatarFallback className="text-2xl font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="picture">Choose a new picture</Label>
                  <Input
                    id="picture"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>

                <div className="flex gap-2">
                  {previewUrl && (
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Upload Picture
                        </>
                      )}
                    </Button>
                  )}
                  
                  {user?.photoUrl && !previewUrl && (
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Picture
                    </Button>
                  )}

                  {previewUrl && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              To update your name or email, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
