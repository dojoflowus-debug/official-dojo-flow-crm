import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowLeft, Calendar, Users, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Forgot Password Page
 * Generic design matching Owner page style
 * Split-screen layout with form left, visual brand right
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="fixed inset-0 flex bg-[#0a0a0b]">
      {/* Left Panel - Form (40%) */}
      <div 
        className={`w-full lg:w-[40%] h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 transition-all duration-700 ease-out overflow-y-auto ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
      >
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png" alt="DojoFlow" className="h-9 w-9" />
            <span className="text-white text-xl font-semibold">DojoFlow</span>
          </div>

          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-gray-400 mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-500/20 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
              <p className="text-gray-400 mb-8">
                If an account exists with <span className="text-white font-medium">{email}</span>, 
                you will receive a password reset link shortly.
              </p>

              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white hover:bg-[#2a2a2c] rounded-xl"
                >
                  Return to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Visual Brand (60%) */}
      <div 
        className={`hidden lg:flex lg:w-[60%] h-full relative overflow-hidden transition-all duration-700 ease-out delay-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0f] via-[#0d0d12] to-[#0a0a0b]" />
        
        {/* Subtle Bokeh/Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/3 rounded-full blur-3xl" />
        </div>

        {/* Faint DojoFlow Swirl Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png" alt="" className="w-[500px] h-[500px] object-contain" />
        </div>

        {/* Floating Feature Cards */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="relative w-full max-w-lg h-[400px]">
            {/* Schedule Card */}
            <div 
              className={`absolute top-0 left-0 bg-[#1a1a1c]/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/5 w-48 transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-white text-sm font-medium">Schedule</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded-full w-full" />
                <div className="h-2 bg-white/10 rounded-full w-3/4" />
                <div className="h-2 bg-red-500/30 rounded-full w-1/2" />
              </div>
            </div>

            {/* Attendance Card */}
            <div 
              className={`absolute top-8 right-0 bg-[#1a1a1c]/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/5 w-52 transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-white text-sm font-medium">Attendance</span>
              </div>
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-orange-500/40 to-orange-400/20 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Automations Card */}
            <div 
              className={`absolute bottom-20 left-8 bg-[#1a1a1c]/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/5 w-56 transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "800ms" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-white text-sm font-medium">Automations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
                </div>
                <span className="text-yellow-400 text-xs font-medium">12 active</span>
              </div>
            </div>

            {/* Revenue Card */}
            <div 
              className={`absolute bottom-0 right-4 bg-[#1a1a1c]/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/5 w-48 transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "1000ms" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white text-sm font-medium">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-white">$12,450</div>
              <div className="text-green-400 text-xs">+18% this month</div>
            </div>
          </div>

          {/* Brand Message */}
          <div 
            className={`text-center mt-16 transition-all duration-1000 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "1200ms" }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png" alt="" className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              AI with a black belt in operations
            </h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Enroll faster, retain longer, and automate the busy work with Kai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
