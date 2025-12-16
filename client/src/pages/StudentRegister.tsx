import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, Loader2, User, Mail, Phone, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

// Registration steps
const STEPS = [
  { id: 1, title: "Personal Info", description: "Tell us about yourself" },
  { id: 2, title: "Contact Details", description: "How can we reach you?" },
  { id: 3, title: "Program Selection", description: "Choose your training path" },
];

// Available programs
const PROGRAMS = [
  { id: "kids-karate", name: "Kids Karate", description: "Ages 4-7", icon: "🥋" },
  { id: "little-dragons", name: "Little Dragons", description: "Ages 8-12", icon: "🐉" },
  { id: "teen-martial-arts", name: "Teen Martial Arts", description: "Ages 13-17", icon: "⚔️" },
  { id: "adult-martial-arts", name: "Adult Martial Arts", description: "Ages 18+", icon: "🥷" },
  { id: "kickboxing", name: "Cardio Kickboxing", description: "All ages", icon: "🥊" },
  { id: "jiu-jitsu", name: "Jiu Jitsu", description: "Ages 13+", icon: "🤼" },
];

/**
 * DojoFlow Student Registration Page
 * Premium multi-step registration form matching the Grand Entrance design
 */
export default function StudentRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    // Step 2: Contact Details
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    // Step 3: Program Selection
    selectedPrograms: [] as string[],
    experienceLevel: "",
    howDidYouHear: "",
    agreeToTerms: false,
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Student registration mutation
  const registerMutation = trpc.studentPortal.register.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      setRegistrationComplete(true);
    },
    onError: (err) => {
      setIsSubmitting(false);
      setError(err.message || "Registration failed. Please try again.");
    },
  });

  const updateFormData = (field: string, value: string | string[] | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleProgram = (programId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.includes(programId)
        ? prev.selectedPrograms.filter((p) => p !== programId)
        : [...prev.selectedPrograms, programId],
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = "First name is required";
      if (!formData.lastName.trim()) errors.lastName = "Last name is required";
      if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    }

    if (step === 2) {
      if (!formData.email.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email";
      }
      if (!formData.phone.trim()) errors.phone = "Phone number is required";
    }

    if (step === 3) {
      if (formData.selectedPrograms.length === 0) {
        errors.selectedPrograms = "Please select at least one program";
      }
      if (!formData.agreeToTerms) {
        errors.agreeToTerms = "You must agree to the terms";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError("");

    try {
      await registerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        programs: formData.selectedPrograms,
        experienceLevel: formData.experienceLevel,
        howDidYouHear: formData.howDidYouHear,
      });
    } catch {
      // Error handled in mutation onError
    }
  };

  // Success screen
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex bg-slate-950">
        <div className="w-full flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to DojoFlow!</h1>
            <p className="text-slate-400 mb-8">
              Your registration is complete. We'll contact you shortly to schedule your first class.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => navigate("/student-login")}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg font-semibold"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full h-14 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* LEFT PANEL - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-6 sm:px-12 lg:px-16 xl:px-20 py-8 relative overflow-y-auto">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-auto flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/student-login")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>

            <div className="flex items-center gap-3 mb-3">
              <img src="/dojoflow-icon.png" alt="DojoFlow" className="w-12 h-12 flex-shrink-0" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Start Your Journey
              </h1>
            </div>
            <p className="text-lg text-slate-400 font-medium">
              Create your profile and begin training
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-green-500 text-white"
                        : currentStep === step.id
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className="text-xs text-slate-500 mt-2 hidden sm:block">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-1 mx-2 rounded transition-all ${
                      currentStep > step.id ? "bg-green-500" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-800/50 shadow-2xl shadow-black/50 flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                    <p className="text-sm text-slate-400">Tell us about yourself</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={(e) => updateFormData("firstName", e.target.value)}
                      className={`h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 ${
                        validationErrors.firstName ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={(e) => updateFormData("lastName", e.target.value)}
                      className={`h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 ${
                        validationErrors.lastName ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Date of Birth *</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                    className={`h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 ${
                      validationErrors.dateOfBirth ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <Select value={formData.gender} onValueChange={(v) => updateFormData("gender", v)}>
                    <SelectTrigger className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white focus:border-red-500/50 focus:ring-red-500/20">
                      <SelectValue placeholder="Gender (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Contact Details</h2>
                    <p className="text-sm text-slate-400">How can we reach you?</p>
                  </div>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className={`h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 ${
                      validationErrors.email ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Input
                    type="tel"
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className={`h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 ${
                      validationErrors.phone ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Input
                    placeholder="Street Address (optional)"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20"
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData("zipCode", e.target.value)}
                    className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Program Selection */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Program Selection</h2>
                    <p className="text-sm text-slate-400">Choose your training path</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PROGRAMS.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => toggleProgram(program.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.selectedPrograms.includes(program.id)
                          ? "bg-red-500/20 border-red-500/50"
                          : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{program.icon}</span>
                      <span className="text-white font-medium block">{program.name}</span>
                      <span className="text-slate-400 text-xs">{program.description}</span>
                    </button>
                  ))}
                </div>
                {validationErrors.selectedPrograms && (
                  <p className="text-red-400 text-xs">{validationErrors.selectedPrograms}</p>
                )}

                <div>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(v) => updateFormData("experienceLevel", v)}
                  >
                    <SelectTrigger className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white focus:border-red-500/50 focus:ring-red-500/20">
                      <SelectValue placeholder="Experience Level (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="beginner">Beginner - No experience</SelectItem>
                      <SelectItem value="some">Some Experience - Less than 1 year</SelectItem>
                      <SelectItem value="intermediate">Intermediate - 1-3 years</SelectItem>
                      <SelectItem value="advanced">Advanced - 3+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={formData.howDidYouHear}
                    onValueChange={(v) => updateFormData("howDidYouHear", v)}
                  >
                    <SelectTrigger className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white focus:border-red-500/50 focus:ring-red-500/20">
                      <SelectValue placeholder="How did you hear about us? (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="friend">Friend/Family Referral</SelectItem>
                      <SelectItem value="drive-by">Drove/Walked By</SelectItem>
                      <SelectItem value="event">Community Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3 pt-4">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => updateFormData("agreeToTerms", checked === true)}
                    className="mt-1 border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer">
                    I agree to the{" "}
                    <span className="text-red-400 hover:underline">Terms of Service</span> and{" "}
                    <span className="text-red-400 hover:underline">Privacy Policy</span>. I understand
                    that my information will be used to contact me about training opportunities.
                  </label>
                </div>
                {validationErrors.agreeToTerms && (
                  <p className="text-red-400 text-xs">{validationErrors.agreeToTerms}</p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-14 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Your information is secure and encrypted</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Visual */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/carousel/adult-martial-arts.jpg')`,
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

        {/* Quote */}
        <div className="absolute top-8 right-8 text-right">
          <p className="text-white/80 text-lg italic font-light">
            "The journey of a thousand miles
            <br />
            begins with a single step."
          </p>
        </div>

        {/* Bottom Badge */}
        <div className="absolute bottom-8 right-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white font-medium">No Experience Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
