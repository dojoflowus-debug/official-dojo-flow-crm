import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";

/**
 * Reset Password Page - Complete the password reset flow
 */
export default function StudentResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  const { data: tokenValidation, isLoading: isValidating } = trpc.studentPortal.validateResetToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.studentPortal.resetPassword.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password");
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to reset password");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-500 mb-6">This password reset link is invalid or has expired.</p>
          <Button onClick={() => navigate("/student-forgot-password")}>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (tokenValidation && !tokenValidation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-500 mb-6">{tokenValidation.error || "This password reset link has expired."}</p>
          <Button onClick={() => navigate("/student-forgot-password")}>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
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

          {!success ? (
            <>
              {/* Headline */}
              <div className="mb-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                  New Password
                </h1>
                <p className="text-lg text-slate-500 font-medium">
                  {tokenValidation?.studentName && (
                    <>Hi {tokenValidation.studentName}! </>
                  )}
                  Create a strong password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Field */}
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-14 pr-12 text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength */}
                {password && (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Password Strength</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-slate-400"}`}>
                        {hasMinLength ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-2 ${hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                        {hasUppercase ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-2 ${hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                        {hasLowercase ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                        Lowercase
                      </div>
                      <div className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-slate-400"}`}>
                        {hasNumber ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                        Number
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field */}
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-14 pr-12 text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className={`flex items-center gap-2 text-sm ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Passwords do not match
                      </>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending || !hasMinLength || password !== confirmPassword}
                  className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/25 transition-all hover:shadow-xl hover:shadow-slate-900/30 disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                  Password Reset!
                </h1>
                <p className="text-lg text-slate-500 mb-8">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Button
                  onClick={() => navigate("/student-login")}
                  className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/25"
                >
                  Continue to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-slate-100 to-slate-200">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
        </div>

        {/* Motivational Quote */}
        <div className="absolute top-12 right-12 max-w-xs text-right">
          <p className="text-lg font-medium text-white/90 drop-shadow-lg">
            "A journey of a thousand miles begins with a single step."
          </p>
          <p className="text-sm text-white/70 mt-2">— Lao Tzu</p>
        </div>
      </div>
    </div>
  );
}
