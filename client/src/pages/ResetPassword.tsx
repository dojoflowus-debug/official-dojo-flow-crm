import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

/**
 * Reset Password Page
 * Allows users to set a new password using a reset token
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: "url('/martial-arts-class.jpg')" }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-black/60 backdrop-blur-[15px] p-8 rounded-2xl border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/dojoflow-logo.png" 
              alt="DojoFlow" 
              className="w-32 h-auto"
            />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Reset Password
          </h1>
          <p className="text-slate-300 text-center mb-8">
            Enter your new password below.
          </p>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white font-medium">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                  required
                  disabled={loading || !token}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                  required
                  disabled={loading || !token}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 active:scale-[0.98]"
                disabled={loading || !token}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Password Reset Successful!</h2>
                <p className="text-slate-300">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
              </div>

              <div className="pt-4">
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Go to Login Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
