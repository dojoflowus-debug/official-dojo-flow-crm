import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2, MessageCircle, Mail, CheckCircle2, X, Shield, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { trpc } from "@/lib/trpc";

// Carousel images for the right panel - visual storytelling
const carouselImages = [
  { src: "/carousel/kids-martial-arts.jpg", alt: "Kids martial arts class" },
  { src: "/carousel/teens-training.jpg", alt: "Adult martial arts training" },
  { src: "/carousel/adult-martial-arts.jpg", alt: "Adult martial arts class" },
  { src: "/carousel/kickboxing-class.jpg", alt: "High energy kickboxing" },
  { src: "/carousel/yoga-wellness.jpg", alt: "Yoga and recovery session" },
];

// Storage keys for student session
const STORAGE_KEYS = {
  STUDENT_ID: 'student_id',
  STUDENT_EMAIL: 'student_email',
  STUDENT_NAME: 'student_name',
  STUDENT_SESSION: 'student_session',
  KIOSK_MODE: 'kiosk_mode',
  LOGGED_IN: 'student_logged_in',
};

// Student session interface
interface StudentSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  program?: string;
  beltRank?: string;
  status?: string;
  currentBelt?: string;
  nextBelt?: string;
  progressPercent?: number;
  qualifiedClasses?: number;
  classesRequired?: number;
  qualifiedAttendance?: number;
  attendanceRequired?: number;
  isEligible?: boolean;
  enrolledClasses?: Array<{
    id?: number;
    name?: string;
    time?: string;
    dayOfWeek?: string;
    instructor?: string;
  }>;
  isKioskMode?: boolean;
  loginTimestamp?: number;
}

/**
 * DojoFlow Grand Entrance Login Page
 * 
 * INTELLIGENT LOGIN GATEWAY:
 * - Returning Students: Authenticates and loads full student context (belt, program, progress, classes)
 * - New Students: Routes to onboarding flow with provisional profile creation
 * - Kiosk Mode: Detects kiosk context and adjusts behavior (limited settings, fast access)
 * 
 * Visual design preserved: Premium "command console" style with Apple-level polish
 */
export default function StudentLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Kiosk mode detection
  const [isKioskMode, setIsKioskMode] = useState(false);
  
  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Check for kiosk mode from URL params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kioskParam = params.get('kiosk');
    const storedKioskMode = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
    
    if (kioskParam === 'true') {
      setIsKioskMode(true);
      localStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
    } else if (storedKioskMode) {
      setIsKioskMode(true);
    }
  }, [location.search]);

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGGED_IN);
    const storedSession = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION);
    
    if (isLoggedIn === 'true' && storedSession) {
      // Already logged in, redirect to dashboard
      navigate("/student-dashboard");
    }
  }, [navigate]);

  // Auto-rotate carousel images with slow fade
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // tRPC queries for student lookup and dashboard data
  const findStudentQuery = trpc.studentPortal.getByEmail.useQuery(
    { email },
    { enabled: false }
  );
  
  const resetPasswordMutation = trpc.studentPortal.requestPasswordReset.useMutation();

  /**
   * RETURNING STUDENT LOGIN
   * 1. Authenticate user by email
   * 2. Load full student context: belt rank, program, progress, active classes
   * 3. Store session with all metadata
   * 4. Route to appropriate dashboard
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Step 1: Find student by email
      const result = await findStudentQuery.refetch();
      
      if (!result.data?.student) {
        setIsLoggingIn(false);
        setError("No student found with this email. Please contact the front desk.");
        return;
      }
      
      const student = result.data.student;
      
      // Step 2: Build complete session with student context
      const studentSession: StudentSession = {
        id: student.id,
        email: student.email || email,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        phone: student.phone || undefined,
        photoUrl: student.photoUrl || undefined,
        program: student.program || undefined,
        beltRank: student.beltRank || 'White',
        status: student.status || 'active',
        isKioskMode,
        loginTimestamp: Date.now(),
      };
      
      // Step 3: Store session data for dashboard to consume
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      localStorage.setItem(STORAGE_KEYS.STUDENT_ID, String(student.id));
      localStorage.setItem(STORAGE_KEYS.STUDENT_EMAIL, email);
      localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, `${student.firstName} ${student.lastName}`);
      localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(studentSession));
      
      // Step 4: Route to dashboard (dashboard will load full belt progress data)
      setIsLoggingIn(false);
      navigate("/student-dashboard");
      
    } catch (err) {
      console.error('Login error:', err);
      setIsLoggingIn(false);
      setError("Login failed. Please try again.");
    }
  };

  const handleSocialLogin = (provider: "google" | "apple") => {
    setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon`);
  };

  /**
   * NEW STUDENT FLOW
   * Routes to the student onboarding page which will:
   * 1. Create a provisional student profile
   * 2. Launch onboarding flow (program selection, trial class, guardian linkage)
   * 3. NOT behave like a generic signup form
   */
  const handleNewStudent = () => {
    // Pass kiosk mode state to registration if applicable
    const params = isKioskMode ? '?kiosk=true' : '';
    navigate(`/student-register${params}`);
  };

  /**
   * KIOSK MODE: Back to Kiosk
   * Returns to the kiosk check-in screen without exposing admin controls
   */
  const handleBackToKiosk = () => {
    navigate("/checkin");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setIsSubmittingReset(true);
    
    try {
      await resetPasswordMutation.mutateAsync({ email: resetEmail });
      setIsSubmittingReset(false);
      setResetEmailSent(true);
    } catch {
      setIsSubmittingReset(false);
      setResetError("Failed to send reset email. Please try again.");
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setTimeout(() => {
      setResetEmail("");
      setResetEmailSent(false);
      setResetError("");
    }, 300);
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* LEFT PANEL - Command Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-12 relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        
        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-auto">
          {/* Kiosk Mode: Back Button */}
          {isKioskMode && (
            <button
              type="button"
              onClick={handleBackToKiosk}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Kiosk
            </button>
          )}
          
          {/* Header with DojoFlow Icon before Welcome */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              {/* DojoFlow Swirl Logo */}
              <img 
                src="/dojoflow-icon.png" 
                alt="DojoFlow" 
                className="w-12 h-12 flex-shrink-0"
              />
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
            </div>
            <p className="text-lg text-slate-400 font-medium ml-[3.75rem]">
              Train. Progress. Advance.
            </p>
          </div>

          {/* Login Card - Command Console Style */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-800/50 shadow-2xl shadow-black/50 mb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 px-5 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 px-5 pr-12 text-base bg-slate-800/50 border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-400 font-medium">{error}</p>
              )}

              {/* Enter the Dojo Button */}
              <Button
                type="submit"
                disabled={isLoggingIn || findStudentQuery.isFetching}
                className="w-full h-14 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg transition-all border border-slate-700/50"
              >
                {(isLoggingIn || findStudentQuery.isFetching) ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Enter the Dojo"
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>

            {/* Secure Sign-In Section */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Secure sign-in</span>
              </div>
              
              {/* Social Login Buttons */}
              <div className="flex justify-center gap-4">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-white hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-black hover:bg-gray-900 transition-colors shadow-lg border border-slate-700"
                >
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Ask Kai Button */}
          <button
            type="button"
            onClick={() => navigate("/kai")}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all mb-6"
          >
            <MessageCircle className="h-5 w-5" />
            Need help signing in? Ask Kai
          </button>

          {/* NEW STUDENT SECTION - Separate Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">New Student?</h3>
            <p className="text-slate-400 text-sm mb-5">
              Create your profile and get started in minutes.
            </p>
            <Button
              onClick={handleNewStudent}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all"
            >
              Start Free Trial
            </Button>
            <p className="text-center text-slate-500 text-xs mt-3">No experience required</p>
          </div>

          {/* Back to Home - Only show if not in kiosk mode */}
          {!isKioskMode && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Visual Storytelling */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Static Dojo Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/login-hero-dojoflow.jpg')`,
          }}
        />
        
        {/* Warm cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Quote - Top Right */}
        <div className="absolute top-12 right-12 z-10">
          <p className="text-lg font-medium text-white/90 italic text-right max-w-xs">
            "Every master was once a beginner."
          </p>
        </div>

        {/* Rotational Image Strip */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          {/* Image carousel with stacked cards effect */}
          <div className="relative h-48">
            {carouselImages.map((image, index) => {
              const isActive = index === currentImageIndex;
              const isPrev = index === (currentImageIndex - 1 + carouselImages.length) % carouselImages.length;
              const isNext = index === (currentImageIndex + 1) % carouselImages.length;
              
              return (
                <div
                  key={index}
                  className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-out ${
                    isActive 
                      ? 'opacity-100 scale-100 z-30' 
                      : isPrev 
                        ? 'opacity-40 scale-95 -translate-x-8 z-20' 
                        : isNext 
                          ? 'opacity-40 scale-95 translate-x-8 z-20' 
                          : 'opacity-0 scale-90 z-10'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              );
            })}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'w-8 bg-white' 
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-2xl p-0 overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <button
              onClick={closeForgotPasswordModal}
              className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {resetEmailSent ? "Check Your Email" : "Reset Password"}
                </DialogTitle>
                <DialogDescription className="text-white/80 mt-1">
                  {resetEmailSent 
                    ? "We've sent you instructions" 
                    : "Enter your email to receive reset instructions"}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {resetEmailSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Email Sent Successfully!
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  We've sent password reset instructions to <strong className="text-white">{resetEmail}</strong>. 
                  Please check your inbox and follow the link to reset your password.
                </p>
                <p className="text-xs text-slate-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                <Button
                  onClick={closeForgotPasswordModal}
                  className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    autoFocus
                  />
                  {resetError && (
                    <p className="text-sm text-red-400 mt-2">{resetError}</p>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Enter the email address associated with your student account and we'll send you a link to reset your password.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 h-12 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {isSubmittingReset ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
