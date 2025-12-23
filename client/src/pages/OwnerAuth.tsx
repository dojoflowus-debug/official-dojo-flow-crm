import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

/**
 * Owner Authentication Page
 * Handles both login and signup flows with tabbed interface
 */
export default function OwnerAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl">DojoFlow</span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <SignupForm onSuccess={() => navigate("/owner/onboarding")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Login Form Component
 */
function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useOTP, setUseOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const loginMutation = trpc.ownerAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Login successful!");
      navigate("/owner/dashboard");
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
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Log in to your DojoFlow account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
          />
        </div>

        {!useOTP ? (
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={loginMutation.isPending}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="login-otp">Verification Code</Label>
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
              />
              <Button
                variant="outline"
                onClick={handleRequestOTP}
                disabled={requestCodeMutation.isPending || otpSent}
              >
                {requestCodeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : otpSent ? (
                  "Sent"
                ) : (
                  "Send Code"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setUseOTP(!useOTP);
              setOtpSent(false);
              setOtpCode("");
            }}
            className="text-blue-600 hover:underline"
          >
            {useOTP ? "Use password instead" : "Use verification code"}
          </button>
          <a href="#" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={loginMutation.isPending}
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
      </CardContent>
    </Card>
  );
}

/**
 * Signup Form Component
 */
interface SignupFormProps {
  onSuccess: () => void;
}

function SignupForm({ onSuccess }: SignupFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const signupMutation = trpc.ownerAuth.signup.useMutation({
    onSuccess: (data) => {
      toast.success("Account created! Please check your email for verification code.");
      // Store userId in localStorage for onboarding flow
      localStorage.setItem("pendingUserId", data.userId.toString());
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSignup = () => {
    if (!firstName || !lastName || !email || !phone) {
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
      phone,
      password: password || undefined,
      agreeToTerms,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Owner Account</CardTitle>
        <CardDescription>Start your 14-day free trial</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signup-firstname">First Name</Label>
            <Input
              id="signup-firstname"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={signupMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-lastname">Last Name</Label>
            <Input
              id="signup-lastname"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={signupMutation.isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={signupMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-phone">Mobile Phone</Label>
          <Input
            id="signup-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={signupMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password (Optional)</Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={signupMutation.isPending}
          />
          <p className="text-xs text-slate-500">
            Leave blank to use OTP-only login
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="signup-terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            disabled={signupMutation.isPending}
          />
          <label htmlFor="signup-terms" className="text-sm text-slate-600 leading-tight">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button
          className="w-full"
          onClick={handleSignup}
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
