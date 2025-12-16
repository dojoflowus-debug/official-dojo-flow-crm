import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Eye, EyeOff, Loader2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

// Carousel images for the right panel
const carouselImages = [
  { src: "/carousel/kids-martial-arts.jpg", alt: "Kids martial arts class" },
  { src: "/carousel/teens-training.jpg", alt: "Teens training with focus" },
  { src: "/carousel/adult-martial-arts.jpg", alt: "Adult martial arts class" },
  { src: "/carousel/kickboxing-class.jpg", alt: "High energy kickboxing" },
  { src: "/carousel/yoga-wellness.jpg", alt: "Yoga and wellness session" },
];

/**
 * Student Login - Premium Cinematic Split-Screen Design
 * Left: Dojo background with glassmorphic login panel
 * Right: Rotating image carousel with visual storytelling
 */
export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate carousel images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 6000); // 6 seconds per image
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

  // Query to find student by email (for demo mode)
  const findStudentMutation = trpc.studentPortal.getByEmail.useQuery(
    { email },
    { enabled: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    // Try demo login first (find by email)
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

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form with Dojo Background */}
      <div 
        className="w-full lg:w-1/2 flex flex-col justify-center relative"
        style={{
          backgroundImage: `url('/login-hero-dojoflow.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 xl:px-20">
          <div className="max-w-md w-full mx-auto">
            {/* Header with DojoFlow Icon */}
            <div className="flex items-center gap-3 mb-12">
              {/* DojoFlow Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-xl text-white/70 font-medium mb-10">
              Train. Progress. Advance.
            </p>

            {/* Login Form - Glassmorphic Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 px-5 text-base bg-white/10 border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>

                {/* Password Field with Eye Toggle */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 px-5 pr-12 text-base bg-white/10 border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:border-red-500 focus:ring-red-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-400 font-medium">{error}</p>
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

                {/* Secure sign-in text */}
                <p className="text-center text-white/40 text-sm">• Secure sign-in •</p>
              </form>

              {/* Social Login Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg"
                >
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
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
            <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
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

            {/* Back to Kiosk Link */}
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

      {/* Right Panel - Rotating Image Carousel */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Carousel Images */}
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay from left */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          </div>
        ))}

        {/* Quote overlay - top right */}
        <div className="absolute top-12 right-12 max-w-xs text-right z-10">
          <p className="text-lg font-medium text-white/90 drop-shadow-lg italic">
            "Every master was once a beginner."
          </p>
        </div>

        {/* Carousel Navigation Dots */}
        <div className="absolute bottom-24 right-12 flex gap-2 z-10">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={goToPrevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goToNextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Yellow Belt Progress Badge - bottom */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-inner" />
            <span className="text-sm font-semibold text-slate-700">Yellow Belt</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">2 classes to next rank</span>
          </div>
        </div>
      </div>
    </div>
  );
}
