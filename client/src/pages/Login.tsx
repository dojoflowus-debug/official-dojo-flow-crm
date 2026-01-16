import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Calendar, Users, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Login Page Component
 * 
 * Generic DojoFlow login page with:
 * - Split-screen layout (form left, visual brand right)
 * - Clean, modern design matching Owner page style
 * - Traditional email/password authentication
 * - Sign In / Sign Up tabs
 * - Social login placeholders (Google, Facebook, TikTok)
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        return;
      }
      
      // Redirect to Kai Command on success
      window.location.href = '/kai';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        return;
      }
      
      // Redirect to Kai Command on success
      window.location.href = '/kai';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    setError(null);
    
    if (provider === 'Google') {
      // Redirect to Google OAuth flow
      window.location.href = '/api/auth/google';
    } else {
      setError(`${provider} authentication not yet implemented`);
    }
  };

  return (
    <div className="min-h-full flex bg-[#0a0a0b]">
      {/* Left Panel - Form (40%) */}
      <div 
        className={`w-full lg:w-[40%] min-h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
      >
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <img src="/logo-icon.png" alt="DojoFlow" className="h-9 w-9" />
            <span className="text-white text-xl font-semibold">DojoFlow</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-8 bg-[#1a1a1c] rounded-full p-1">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "signin"
                  ? "bg-[#2a2a2c] text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-[#2a2a2c] text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-400 mb-8">Sign in to manage your school</p>

              <form onSubmit={handleSignIn} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keep-logged-in"
                      checked={keepLoggedIn}
                      onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                      className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label
                      htmlFor="keep-logged-in"
                      className="text-sm text-gray-400 cursor-pointer"
                    >
                      Keep me logged in
                    </Label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-red-500 hover:text-red-400">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  Log In
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#2a2a2c]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#0a0a0b] px-3 text-gray-500">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white hover:bg-[#2a2a2c] rounded-xl"
                    onClick={() => handleSocialLogin("Google")}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white hover:bg-[#2a2a2c] rounded-xl"
                    onClick={() => handleSocialLogin("Facebook")}
                  >
                    <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white hover:bg-[#2a2a2c] rounded-xl"
                    onClick={() => handleSocialLogin("TikTok")}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </Button>
                </div>
              </form>

              <p className="mt-8 text-center text-gray-400 text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-white font-medium hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create account</h2>
              <p className="text-gray-400 mb-8">Get started with DojoFlow</p>

              <form onSubmit={handleSignUp} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300 text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  Create Account
                </Button>
              </form>

              <p className="mt-8 text-center text-gray-400 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="text-white font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Visual Brand (60%) */}
      <div 
        className={`hidden lg:flex lg:w-[60%] relative overflow-hidden transition-all duration-700 ease-out delay-200 ${
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
          <img src="/logo-icon.png" alt="" className="w-[500px] h-[500px] object-contain" />
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
              <img src="/logo-icon.png" alt="" className="w-7 h-7" />
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
