import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setLoading(false);
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
            Forgot Password?
          </h1>
          <p className="text-slate-300 text-center mb-8">
            Enter your email address and we'll send you a link to reset your password.
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
                <Label htmlFor="email" className="text-white font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
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
                <h2 className="text-xl font-semibold text-white">Check Your Email</h2>
                <p className="text-slate-300">
                  If an account exists with <span className="text-white font-medium">{email}</span>, 
                  you will receive a password reset link shortly.
                </p>
              </div>

              <div className="pt-4">
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Return to Login
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
