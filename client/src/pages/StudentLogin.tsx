import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2, MessageCircle, Mail, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

// Carousel images for the right panel - stacked view
const carouselImages = [
  { src: "/carousel/kids-martial-arts.jpg", alt: "Kids martial arts class" },
  { src: "/carousel/teens-training.jpg", alt: "Teens training with focus" },
  { src: "/carousel/adult-martial-arts.jpg", alt: "Adult martial arts class" },
  { src: "/carousel/kickboxing-class.jpg", alt: "High energy kickboxing" },
  { src: "/carousel/yoga-wellness.jpg", alt: "Yoga and wellness session" },
];

/**
 * Student Login - Premium Cinematic Split-Screen Design
 * With Forgot Password modal popup
 */
export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Auto-rotate carousel images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Student login mutation
  const loginMutation = trpc.studentPortal.login.useMutation({
    onSuccess: (data) => {
      if (data.success && data.student) {
        localStorage.setItem("student_logged_in", "true");
        localStorage.setItem("student_id", data.student.id.toString());
        localStorage.setItem("student_email", data.student.email);
        localStorage.setItem("student_name", `${data.student.firstName} ${data.student.lastName}`);
        navigate("/student-dashboard");
      } else {
        setError("Invalid email or password");
      }
    },
    onError: () => {
      setError("Login failed. Please try again.");
    },
  });

  const findStudentMutation = trpc.studentPortal.getByEmail.useQuery(
    { email },
    { enabled: false }
  );

  // Password reset mutation
  const resetPasswordMutation = trpc.studentPortal.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      const result = await findStudentMutation.refetch();
      if (result.data?.student) {
        localStorage.setItem("student_logged_in", "true");
        localStorage.setItem("student_id", String(result.data.student.id));
        localStorage.setItem("student_email", email);
        localStorage.setItem("student_name", result.data.student.firstName || 'Student');
        navigate("/student-dashboard");
      } else {
        setError("No student found with this email. Please contact the front desk.");
      }
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  const handleSocialLogin = (provider: "google" | "apple") => {
    setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon`);
  };

  // Handle forgot password submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setIsSubmittingReset(true);
    
    // Call the backend password reset endpoint
    try {
      await resetPasswordMutation.mutateAsync({ email: resetEmail });
      setIsSubmittingReset(false);
      setResetEmailSent(true);
    } catch (err) {
      setIsSubmittingReset(false);
      setResetError("Failed to send reset email. Please try again.");
    }
  };

  // Close and reset forgot password modal
  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    // Reset state after animation
    setTimeout(() => {
      setResetEmail("");
      setResetEmailSent(false);
      setResetError("");
    }, 300);
  };

  // Get visible images for stacked carousel (current + next 2)
  const getVisibleImages = () => {
    const images = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentImageIndex + i) % carouselImages.length;
      images.push({ ...carouselImages[index], index });
    }
    return images;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form with Warm Dojo Background */}
      <div 
        className="w-full lg:w-1/2 flex flex-col justify-center relative overflow-hidden"
        style={{
          backgroundImage: `url('/login-hero-dojoflow.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/70 via-amber-800/60 to-stone-900/80" />
        
        {/* Content */}
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 xl:px-20 py-12">
          <div className="max-w-md w-full mx-auto">
            {/* Header with DojoFlow Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-xl text-white/80 font-medium mb-10 ml-[4.5rem]">
              Train. Progress. Advance.
            </p>

            {/* Login Form Card */}
            <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 px-5 text-base bg-white/20 border-white/30 rounded-2xl text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 px-5 pr-12 text-base bg-white/20 border-white/30 rounded-2xl text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                )}

                {/* Enter the Dojo Button */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending || findStudentMutation.isFetching}
                  className="w-full h-14 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-2xl shadow-lg transition-all"
                >
                  {(loginMutation.isPending || findStudentMutation.isFetching) ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Enter the Dojo"
                  )}
                </Button>

                {/* Forgot Password Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-white/40 text-sm">Or continue with</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>
              </form>

              {/* Social Login Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg"
                >
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Need help signing in? Ask Kai */}
            <button
              type="button"
              onClick={() => navigate("/kai")}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 px-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-white/80 hover:bg-white/20 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              Need help signing in? Ask Kai
            </button>

            {/* New Student Section */}
            <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
              <h3 className="text-lg font-semibold text-white mb-2">New Student?</h3>
              <p className="text-white/60 text-sm mb-4">
                Create your profile and get started in minutes.
              </p>
              <Button
                onClick={() => navigate("/student-register")}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              >
                Start Free Trial
              </Button>
              <p className="text-center text-white/40 text-xs mt-3">No experience required</p>
            </div>

            {/* Back to Home Link */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Stacked Image Carousel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col justify-between p-8 overflow-hidden">
        {/* Quote overlay */}
        <div className="text-right z-10">
          <p className="text-lg font-medium text-white/90 italic">
            "Every master was once a beginner."
          </p>
        </div>

        {/* Stacked Images */}
        <div className="flex-1 flex flex-col justify-center gap-4 py-8">
          {getVisibleImages().map((image, idx) => (
            <div
              key={image.index}
              className={`relative rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
                idx === 0 ? 'h-48 opacity-100' : idx === 1 ? 'h-40 opacity-80' : 'h-32 opacity-60'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {carouselImages.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentImageIndex(dotIdx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dotIdx === (image.index) ? 'bg-white w-4' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Yellow Belt Progress Badge */}
        <div className="z-10">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-inner" />
            <span className="text-sm font-semibold text-slate-700">Yellow Belt</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">2 classes to next rank</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
          {/* Modal Header with gradient */}
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
              // Success State
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Email Sent Successfully!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  We've sent password reset instructions to <strong className="text-slate-900 dark:text-white">{resetEmail}</strong>. 
                  Please check your inbox and follow the link to reset your password.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
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
              // Email Entry Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 px-4 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    autoFocus
                  />
                  {resetError && (
                    <p className="text-sm text-red-500 mt-2">{resetError}</p>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the email address associated with your student account and we'll send you a link to reset your password.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700"
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
