import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

export default function StaffChangePassword() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword && newPassword !== confirmPassword;

  const changePasswordMutation = trpc.staffAuth.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to change password. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0b]">
      {/* Left Panel — Branding */}
      <div
        className={`hidden lg:flex lg:w-[45%] h-full flex-col justify-between p-12 relative overflow-hidden transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
        style={{
          backgroundImage: "url('/hero-martial-arts.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Content */}
        <div className="relative z-10">
          <img src="/dojoflow-logo-light.png" alt="DojoFlow" className="h-10 w-auto" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-6 w-6 text-red-400" />
            <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">Security</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Secure your<br />account.
          </h1>
          <p className="text-gray-300 text-base leading-relaxed max-w-sm">
            Update your temporary password to something only you know. Use a strong password with a mix of letters, numbers, and symbols.
          </p>

          {/* Tips */}
          <div className="mt-8 space-y-3">
            {[
              "At least 8 characters long",
              "Mix uppercase and lowercase letters",
              "Include numbers and symbols",
              "Avoid using personal information",
            ].map((tip) => (
              <div key={tip} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} DojoFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div
        className={`w-full lg:w-[55%] h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 overflow-y-auto transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        }`}
      >
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/dojoflow-logo-light.png" alt="DojoFlow" className="h-8 w-auto" />
          </div>

          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Password Updated!</h2>
              <p className="text-gray-400 mb-8">
                Your password has been changed successfully. You can now use your new password to sign in.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              >
                Go to Dashboard
              </Button>
              <button
                onClick={() => navigate("/staff/login")}
                className="mt-4 w-full text-gray-400 text-sm hover:text-white transition-colors"
              >
                Back to Staff Login
              </button>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Staff Portal</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Change Password</h2>
                <p className="text-gray-400 text-sm">
                  Update your temporary password to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-300 text-sm font-medium">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-600 rounded-xl pr-12 focus:border-red-500 focus:ring-red-500/20"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-300 text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-600 rounded-xl pr-12 focus:border-red-500 focus:ring-red-500/20"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : "bg-[#2a2a2c]"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.score <= 1 ? "text-red-400" :
                        strength.score <= 2 ? "text-orange-400" :
                        strength.score <= 3 ? "text-yellow-400" :
                        "text-green-400"
                      }`}>
                        {strength.label} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-600 rounded-xl pr-12 focus:ring-red-500/20 transition-colors ${
                        passwordMismatch ? "border-red-500 focus:border-red-500" :
                        passwordsMatch ? "border-green-500 focus:border-green-500" :
                        "focus:border-red-500"
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  {changePasswordMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <p className="text-center text-gray-500 text-sm">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Cancel and go back
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
