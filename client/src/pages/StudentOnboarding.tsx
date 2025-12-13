import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  User,
  Calendar,
  Phone,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  Key
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { formatPhoneNumber, getPhoneValidationMessage, extractDigits } from "@/lib/phoneUtils";

// School type for search results
interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  logoUrl?: string;
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`
            h-2 rounded-full transition-all duration-300
            ${index + 1 === currentStep ? 'w-8 bg-red-500' : 'w-2'}
            ${index + 1 < currentStep ? 'bg-green-500' : ''}
            ${index + 1 > currentStep ? 'bg-gray-200' : ''}
          `}
        />
      ))}
    </div>
  );
}

// School search result card
function SchoolResultCard({ 
  school, 
  onSelect,
  isSelected
}: { 
  school: School; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div 
      className={`
        p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/10' 
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        {/* School Logo */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* School Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{school.name}</h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{school.address}, {school.city}, {school.state}</span>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <CheckCircle2 className="h-6 w-6 text-red-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

/**
 * Student Onboarding - 3-step flow for new students
 * Step 1: Find School
 * Step 2: Student Profile
 * Step 3: Confirmation
 */
export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Step 1: Find School
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Step 2: Student Profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [program, setProgram] = useState<"kids" | "teens" | "adults">("adults");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPC mutations
  const uploadPhotoMutation = trpc.studentPortal.uploadProfilePhoto.useMutation();
  const requestToJoinMutation = trpc.studentPortal.requestToJoin.useMutation();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // Demo schools for search
  const demoSchools: School[] = [
    { id: 1, name: "Dragon's Den Martial Arts", address: "123 Main St", city: "Austin", state: "TX" },
    { id: 2, name: "Tiger Academy", address: "456 Oak Ave", city: "Houston", state: "TX" },
    { id: 3, name: "Phoenix Dojo", address: "789 Elm Blvd", city: "Dallas", state: "TX" },
    { id: 4, name: "Warrior's Path", address: "321 Pine Rd", city: "San Antonio", state: "TX" },
    { id: 5, name: "Iron Fist Academy", address: "654 Cedar Ln", city: "Fort Worth", state: "TX" },
  ];

  // Filter schools based on search
  const filteredSchools = searchQuery.length >= 2
    ? demoSchools.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle photo upload with S3 integration
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      setIsUploadingPhoto(true);
      
      // Read file as base64 for preview and upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setPhotoPreview(base64Data);
        
        // Upload to S3
        try {
          const result = await uploadPhotoMutation.mutateAsync({
            imageData: base64Data,
            mimeType: file.type,
          });
          
          if (result.success && result.url) {
            setUploadedPhotoUrl(result.url);
            console.log('Photo uploaded successfully:', result.url);
          } else {
            console.error('Photo upload failed:', result.error);
          }
        } catch (error) {
          console.error('Photo upload error:', error);
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle invite code
  const handleInviteCode = () => {
    if (inviteCode.length >= 6) {
      // In production, this would validate the code and auto-select the school
      const school = demoSchools[0];
      setSelectedSchool(school);
    }
  };

  // Handle form submission with real API call
  const handleSubmit = async () => {
    if (!selectedSchool) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await requestToJoinMutation.mutateAsync({
        schoolId: selectedSchool.id,
        firstName,
        lastName,
        email: '', // Will be set during account creation
        dateOfBirth,
        program,
        emergencyContactName: emergencyContact,
        emergencyContactPhone: emergencyPhone,
        photoUrl: uploadedPhotoUrl || undefined,
      });
      
      if (result.success && result.studentId) {
        // Store student info and navigate to confirmation
        localStorage.setItem("student_logged_in", "true");
        localStorage.setItem("student_name", `${firstName} ${lastName}`);
        localStorage.setItem("student_id", result.studentId.toString());
        
        setStep(3);
      } else {
        alert(result.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step validation
  const canProceedStep1 = selectedSchool !== null;
  const isPhoneValid = extractDigits(emergencyPhone).length === 10;
  const canProceedStep2 = firstName.trim() && lastName.trim() && dateOfBirth && emergencyContact.trim() && emergencyPhone.trim() && isPhoneValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
            )}
            <span className="text-lg font-semibold text-gray-900">{APP_TITLE}</span>
          </div>
          {step < 3 && (
            <Button
              variant="ghost"
              onClick={() => navigate("/student-login")}
              className="text-gray-500 hover:text-gray-900"
            >
              Cancel
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Step Indicator */}
          {step < 3 && <StepIndicator currentStep={step} totalSteps={3} />}

          {/* Step 1: Find School */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Find Your School
                </h1>
                <p className="text-gray-500">
                  Search by school name or ZIP code
                </p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-base bg-white border-gray-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20"
                />
              </div>

              {/* Search Results */}
              {filteredSchools.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 font-medium">
                    {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''} found
                  </p>
                  {filteredSchools.map(school => (
                    <SchoolResultCard
                      key={school.id}
                      school={school}
                      onSelect={() => setSelectedSchool(school)}
                      isSelected={selectedSchool?.id === school.id}
                    />
                  ))}
                </div>
              )}

              {/* Invite Code Section */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-400">
                    Or use an invite code
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="h-14 pl-12 pr-4 text-base bg-white border-gray-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 uppercase tracking-wider"
                  />
                </div>
                <Button
                  onClick={handleInviteCode}
                  disabled={inviteCode.length < 6}
                  className="h-14 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl"
                >
                  Apply
                </Button>
              </div>

              {/* Continue Button */}
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full h-14 text-base font-semibold bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request to Join
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Student Profile */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Create Your Profile
                </h1>
                <p className="text-gray-500">
                  Tell us a bit about yourself
                </p>
              </div>

              {/* Selected School Badge */}
              {selectedSchool && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Joining {selectedSchool.name}
                  </span>
                </div>
              )}

              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-3">
                <label className="relative cursor-pointer group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg transition-all group-hover:shadow-xl">
                    {isUploadingPhoto ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                      </div>
                    ) : photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  {/* Upload/Success Indicator */}
                  <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    uploadedPhotoUrl 
                      ? 'bg-green-500' 
                      : isUploadingPhoto 
                        ? 'bg-gray-400' 
                        : 'bg-red-500 group-hover:bg-red-600'
                  }`}>
                    {uploadedPhotoUrl ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </label>
                {/* Status Text */}
                <p className="text-sm text-gray-500">
                  {isUploadingPhoto 
                    ? 'Uploading photo...' 
                    : uploadedPhotoUrl 
                      ? 'Photo uploaded successfully!' 
                      : 'Tap to add your photo'
                  }
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 px-4 bg-white border-gray-200 rounded-xl focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 px-4 bg-white border-gray-200 rounded-xl focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-12 pl-12 pr-4 bg-white border-gray-200 rounded-xl focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["kids", "teens", "adults"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProgram(p)}
                        className={`
                          h-12 rounded-xl font-medium transition-all capitalize
                          ${program === p 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="Parent or Guardian name"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="h-12 px-4 bg-white border-gray-200 rounded-xl focus:border-red-500 focus:ring-red-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={emergencyPhone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setEmergencyPhone(formatted);
                            setEmergencyPhoneError(getPhoneValidationMessage(formatted));
                          }}
                          className={`h-12 pl-12 pr-4 bg-white rounded-xl focus:ring-red-500/20 ${emergencyPhoneError ? 'border-amber-400 focus:border-amber-500' : 'border-gray-200 focus:border-red-500'}`}
                        />
                      </div>
                      {emergencyPhoneError && (
                        <p className="mt-1 text-xs text-amber-600">{emergencyPhoneError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 text-base font-semibold rounded-2xl border-gray-200"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedStep2 || isSubmitting}
                  className="flex-1 h-14 text-base font-semibold bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Complete
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center space-y-8 py-12">
              {/* Success Animation */}
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
                </div>
              </div>

              {/* Success Message */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Welcome to the Team!
                </h1>
                <p className="text-xl text-gray-500">
                  You're officially part of <span className="font-semibold text-gray-900">{selectedSchool?.name}</span>
                </p>
              </div>

              {/* Profile Summary */}
              <div className="bg-white rounded-3xl p-6 shadow-lg max-w-sm mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {uploadedPhotoUrl ? (
                      <img src={uploadedPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">{firstName} {lastName}</h3>
                    <p className="text-gray-500 capitalize">{program} Program</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
                      <span className="text-xs text-gray-400">White Belt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => navigate("/student-dashboard")}
                className="h-14 px-12 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-lg shadow-gray-900/25"
              >
                Go to My Dashboard
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
