import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

/**
 * Student Login - Premium Apple-inspired split-screen design
 * Left: Clean white login panel
 * Right: Full-height cinematic student image
 */
export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            {APP_LOGO ? (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
            ) : (
              <div className="flex items-center gap-2">
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-8 w-8 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4l8 4 8-4M4 12l8 4 8-4M4 20l8-4 8 4" />
                </svg>
                <span className="text-xl font-semibold text-slate-900">DojoFlow</span>
              </div>
            )}
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Train. Progress. Advance.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 px-5 text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 text-slate-900"
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 px-5 pr-12 text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            {/* Continue Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending || findStudentMutation.isFetching}
              className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/25 transition-all hover:shadow-xl hover:shadow-slate-900/30"
            >
              {(loginMutation.isPending || findStudentMutation.isFetching) ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            {/* Secondary Links */}
            <div className="flex flex-col items-center gap-3">
              {/* Create Account - More Prominent */}
              <p className="text-sm text-slate-500">
                New student?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/student-onboarding")}
                  className="text-red-500 hover:text-red-600 font-semibold underline underline-offset-2 transition-colors"
                >
                  Create an account
                </button>
              </p>
              {/* Forgot Password */}
              <button
                type="button"
                onClick={() => navigate("/student-forgot-password")}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="w-14 h-14 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
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
              className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
          </div>

          {/* Back to Kiosk Link */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Back to Kiosk
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Cinematic Student Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Student Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/dojo-welcome.jpg')`,
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
        </div>

        {/* Belt Badge Overlay */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-inner" />
            <span className="text-sm font-semibold text-slate-700">Yellow Belt</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">Your journey continues</span>
          </div>
        </div>

        {/* Aspirational Quote */}
        <div className="absolute top-12 right-12 max-w-xs text-right">
          <p className="text-lg font-medium text-white/90 drop-shadow-lg">
            "Every master was once a beginner."
          </p>
        </div>
      </div>
    </div>
  );
}
