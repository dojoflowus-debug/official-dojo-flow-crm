import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, Loader2, Volume2, Check } from "lucide-react";

// ElevenLabs voice options
const VOICES = {
  female: {
    id: "kdmDKE6EkgrWrrykO9Qt",
    label: "Alexandra",
    description: "Conversational & warm female voice",
    sampleText: "Hi! I'm Alexandra, your Kai assistant. I'm here to help you manage your dojo.",
  },
  male: {
    id: "pNInz6obpgDQGcFmaJgB",
    label: "Adam",
    description: "Deep, authoritative male voice",
    sampleText: "Hello! I'm Adam, your Kai assistant. Let me help you run your martial arts school.",
  },
};

function WavePath({ active }: { active: boolean }) {
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300"
    >
      <path
        d="M0 12 Q5 4 10 12 Q15 20 20 12 Q25 4 30 12 Q35 20 40 12 Q45 4 50 12 Q55 20 60 12"
        stroke={active ? "#ef4444" : "#6b7280"}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className="transition-all duration-300"
      />
    </svg>
  );
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState<"male" | "female" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const utils = trpc.useUtils();

  // Voice preference
  const { data: kaiVoiceData, isLoading: voiceLoading } = trpc.settings.getKaiVoice.useQuery(undefined, {
    retry: false,
  });
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");

  useEffect(() => {
    if (kaiVoiceData?.voiceGender) {
      setSelectedVoice(kaiVoiceData.voiceGender as "male" | "female");
    }
  }, [kaiVoiceData]);

  const setKaiVoiceMutation = trpc.settings.setKaiVoice.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Voice Updated",
        description: `Kai will now speak with ${VOICES[data.voiceGender].label}'s voice.`,
      });
      utils.settings.getKaiVoice.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update voice setting",
        variant: "destructive",
      });
    },
  });

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

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

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
    const mimeMatch = previewUrl.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    uploadMutation.mutate({ imageData: previewUrl, mimeType });
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

  const handlePreviewVoice = async (gender: "male" | "female") => {
    // Stop any currently playing preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPreviewingVoice(gender);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: VOICES[gender].sampleText,
          voiceGender: gender,
        }),
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPreviewingVoice(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPreviewingVoice(null);
        URL.revokeObjectURL(url);
        toast({ title: "Preview failed", description: "Could not play voice sample", variant: "destructive" });
      };

      await audio.play();
    } catch (err) {
      setIsPreviewingVoice(null);
      toast({ title: "Preview failed", description: "Could not generate voice sample", variant: "destructive" });
    }
  };

  const handleSelectVoice = (gender: "male" | "female") => {
    setSelectedVoice(gender);
    // Auto-preview when selecting
    handlePreviewVoice(gender);
  };

  const handleSaveVoice = () => {
    setKaiVoiceMutation.mutate({ voiceGender: selectedVoice });
  };

  const currentPhotoUrl = previewUrl || user?.photoUrl;
  const savedVoice = kaiVoiceData?.voiceGender || "female";
  const hasVoiceChanged = selectedVoice !== savedVoice;

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile picture, personal information, and Kai voice preferences
          </p>
        </div>

        {/* Profile Picture */}
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
                    <Button onClick={handleUpload} disabled={isUploading}>
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
                        if (fileInputRef.current) fileInputRef.current.value = "";
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

        {/* Kai Voice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-red-500" />
              Kai Voice Settings
            </CardTitle>
            <CardDescription>
              Choose the voice Kai uses when speaking to you. Click a voice to hear a sample — you can change this at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {voiceLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading voice settings...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["female", "male"] as const).map((gender) => {
                    const voice = VOICES[gender];
                    const isSelected = selectedVoice === gender;
                    const isPreviewing = isPreviewingVoice === gender;

                    return (
                      <button
                        key={gender}
                        onClick={() => handleSelectVoice(gender)}
                        disabled={isPreviewing}
                        className={`
                          relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 text-left
                          ${isSelected
                            ? "border-red-500 bg-red-500/5 shadow-md shadow-red-500/10"
                            : "border-border hover:border-red-500/40 hover:bg-muted/50"
                          }
                        `}
                      >
                        {/* Selected badge */}
                        {isSelected && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-red-500">
                            <Check className="h-3 w-3" />
                            {savedVoice === gender ? "Active" : "Selected"}
                          </span>
                        )}

                        {/* Wave path visualization */}
                        <WavePath active={isSelected} />

                        {/* Voice info */}
                        <div className="text-center">
                          <p className={`font-semibold text-base ${isSelected ? "text-red-500" : "text-foreground"}`}>
                            {voice.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{voice.description}</p>
                        </div>

                        {/* Preview indicator */}
                        {isPreviewing && (
                          <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Playing sample...
                          </div>
                        )}

                        {!isPreviewing && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Volume2 className="h-3 w-3" />
                            Click to preview
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {hasVoiceChanged
                      ? `Click "Save Voice" to apply ${VOICES[selectedVoice].label}'s voice to Kai`
                      : `Kai is currently using ${VOICES[savedVoice as "male" | "female"]?.label || "Alexandra"}'s voice`}
                  </p>
                  <Button
                    onClick={handleSaveVoice}
                    disabled={!hasVoiceChanged || setKaiVoiceMutation.isPending}
                    className={hasVoiceChanged ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                  >
                    {setKaiVoiceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Voice
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
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
