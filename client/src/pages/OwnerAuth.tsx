import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Calendar, Users, Zap, TrendingUp } from "lucide-react";

/**
 * Premium Owner Authentication Page
 * Split-screen layout with form panel (left) and visual brand panel (right)
 */
export default function OwnerAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-[#2a2a2c] text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-[#2a2a2c] text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Forms */}
          {activeTab === "login" ? (
            <LoginForm onSwitchToSignup={() => setActiveTab("signup")} />
          ) : (
            <SignupForm 
              onSuccess={() => navigate("/owner/onboarding")} 
              onSwitchToLogin={() => setActiveTab("login")}
            />
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

/**
 * Login Form Component
 */
interface LoginFormProps {
  onSwitchToSignup: () => void;
}

function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const loginMutation = trpc.ownerAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login successful!");
      if (data.hasOrganization) {
        navigate("/kai");
      } else {
        navigate("/owner/onboarding");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const requestCodeMutation = trpc.ownerAuth.requestLoginCode.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your email");
      setOtpSent(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogin = () => {
    if (useOTP) {
      if (!otpCode) {
        toast.error("Please enter the verification code");
        return;
      }
      loginMutation.mutate({ email, code: otpCode });
    } else {
      if (!password) {
        toast.error("Please enter your password");
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  const handleRequestOTP = () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    requestCodeMutation.mutate({ email });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm">Sign in to manage your school</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-gray-300 text-sm">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
            className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {!useOTP ? (
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-gray-300 text-sm">
              Password
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={loginMutation.isPending}
                className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="login-otp" className="text-gray-300 text-sm">
              Verification Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="login-otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={loginMutation.isPending || !otpSent}
                className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <Button
                variant="outline"
                onClick={handleRequestOTP}
                disabled={requestCodeMutation.isPending || otpSent}
                className="h-12 px-4 bg-[#1a1a1c] border-[#2a2a2c] text-white hover:bg-[#2a2a2c] rounded-xl"
              >
                {requestCodeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : otpSent ? (
                  "Sent"
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setUseOTP(!useOTP);
            setOtpSent(false);
            setOtpCode("");
          }}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          {useOTP ? "Use password" : "Use verification code"}
        </button>
        <a href="#" className="text-red-400 hover:text-red-300 transition-colors">
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleLogin}
        disabled={loginMutation.isPending}
        className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Log In"
        )}
      </Button>

      {/* Footer Link */}
      <p className="text-center text-gray-400 text-sm">
        Don't have an account?{" "}
        <button
          onClick={onSwitchToSignup}
          className="text-white hover:text-red-400 transition-colors font-medium"
        >
          Create account
        </button>
      </p>
    </div>
  );
}

/**
 * Signup Form Component
 */
interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(false);

  const signupMutation = trpc.ownerAuth.signup.useMutation({
    onSuccess: (data) => {
      toast.success("Account created! Please check your email for verification code.");
      localStorage.setItem("pendingUserId", data.userId.toString());
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSignup = () => {
    if (!firstName || !lastName || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to Terms and Privacy Policy");
      return;
    }

    signupMutation.mutate({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      password: password || undefined,
      agreeToTerms,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Create your DojoFlow account</h1>
        <p className="text-gray-400 text-sm">Set up your school in minutes. Kai will guide you.</p>
      </div>

      {/* Google Sign In */}
      <Button
        variant="outline"
        className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl border-0 transition-all duration-200"
        onClick={() => toast.info("Google sign-in coming soon")}
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[#2a2a2c]" />
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-[#2a2a2c]" />
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signup-firstname" className="text-gray-300 text-sm">
              First name
            </Label>
            <Input
              id="signup-firstname"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={signupMutation.isPending}
              className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-lastname" className="text-gray-300 text-sm">
              Last name
            </Label>
            <Input
              id="signup-lastname"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={signupMutation.isPending}
              className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-gray-300 text-sm">
            Email address
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={signupMutation.isPending}
            className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-gray-300 text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={signupMutation.isPending}
              className="h-12 bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="signup-updates"
            checked={receiveUpdates}
            onCheckedChange={(checked) => setReceiveUpdates(checked as boolean)}
            disabled={signupMutation.isPending}
            className="mt-0.5 border-[#2a2a2c] data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
          />
          <label htmlFor="signup-updates" className="text-gray-400 text-sm leading-tight cursor-pointer">
            Join our email list for special offers and updates!
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="signup-terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            disabled={signupMutation.isPending}
            className="mt-0.5 border-[#2a2a2c] data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
          />
          <label htmlFor="signup-terms" className="text-gray-400 text-sm leading-tight cursor-pointer">
            I agree with DojoFlow's{" "}
            <a href="#" className="text-white hover:text-red-400 underline transition-colors">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-white hover:text-red-400 underline transition-colors">
              Terms of Service
            </a>
            .
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSignup}
        disabled={signupMutation.isPending}
        className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
      >
        {signupMutation.isPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {/* Footer Link */}
      <p className="text-center text-gray-400 text-sm">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-white hover:text-red-400 transition-colors font-medium"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
