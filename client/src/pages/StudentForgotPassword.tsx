import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

/**
 * Forgot Password Page - Apple-inspired design matching login
 */
export default function StudentForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const requestResetMutation = trpc.studentPortal.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        // For demo purposes, show the token link
        if (data._demoToken) {
          setDemoToken(data._demoToken);
        }
      } else {
        setError(data.error || "Failed to send reset link");
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to send reset link");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    requestResetMutation.mutate({ email: email.trim() });
  };

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
                  Reset Password
                </h1>
                <p className="text-lg text-slate-500 font-medium">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-14 pr-5 text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 text-slate-900"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={requestResetMutation.isPending}
                  className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/25 transition-all hover:shadow-xl hover:shadow-slate-900/30"
                >
                  {requestResetMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
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
                  Check Your Email
                </h1>
                <p className="text-lg text-slate-500 mb-8">
                  We've sent a password reset link to <strong className="text-slate-700">{email}</strong>
                </p>

                {/* Demo Token Link (for testing) */}
                {demoToken && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                    <p className="text-sm text-amber-800 font-medium mb-2">
                      Demo Mode: Click below to reset your password
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={() => navigate(`/student-reset-password?token=${demoToken}`)}
                    >
                      Reset Password Now
                    </Button>
                  </div>
                )}

                <p className="text-sm text-slate-400">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setDemoToken(null);
                    }}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Back to Login Link */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("/student-login")}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
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
            "Fall seven times, stand up eight."
          </p>
          <p className="text-sm text-white/70 mt-2">— Japanese Proverb</p>
        </div>
      </div>
    </div>
  );
}
