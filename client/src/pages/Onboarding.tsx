import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    preferredName: "",
    phone: "",
    bio: "",
    photoUrl: "",
  });

  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Profile completed! Welcome to DojoFlow 🎉");
      // Redirect based on user role (will be determined by backend)
      setTimeout(() => {
        navigate("/kai");
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete onboarding");
      setIsLoading(false);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setPhotoPreview(preview);
      setFormData({ ...formData, photoUrl: preview });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSkip = () => {
    setIsLoading(true);
    completeOnboarding.mutate({
      displayName: formData.displayName || "User",
      preferredName: formData.preferredName || "",
      phone: formData.phone || "",
      bio: formData.bio || "",
      photoUrl: formData.photoUrl || "",
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.displayName.trim()) {
        toast.error("Please enter your name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setIsLoading(true);
      completeOnboarding.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">DF</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to DojoFlow
          </h1>
          <p className="text-slate-400">
            Let's complete your profile to get started
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? "bg-red-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          {step === 1 ? (
            // Step 1: Basic Info
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preferred Name (Optional)
                </label>
                <input
                  type="text"
                  name="preferredName"
                  value={formData.preferredName}
                  onChange={handleInputChange}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          ) : (
            // Step 2: Photo & Bio
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Profile Photo (Optional)
                </label>
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full rounded-lg object-cover"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-32 h-32 mx-auto flex flex-col items-center justify-center bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-400 text-center px-2">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.bio.length}/160 characters
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {step === 1 ? "Next" : "Completing..."}
                </>
              ) : (
                <>
                  {step === 1 ? "Next" : "Complete"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip button */}
          {step === 1 && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full mt-3 px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors text-sm disabled:opacity-50"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-slate-500 text-xs mt-6">
          You can update your profile anytime in Settings
        </p>
      </div>
    </div>
  );
}
