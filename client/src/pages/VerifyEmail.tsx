import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, ShieldCheck, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * VerifyEmail - Email verification gate
 *
 * Shown to authenticated users whose emailVerified === false.
 * They must enter the 6-digit OTP sent to their email before
 * they can access any protected page.
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Get the current user's email from auth.me
  const { data: me } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (me?.email) {
      setEmail(me.email);
    }
  }, [me]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resendMutation = trpc.ownerAuth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent! Check your inbox.");
      setCooldown(60);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send code. Please try again.");
    },
  });

  const verifyMutation = trpc.ownerAuth.verifyEmailCode.useMutation({
    onSuccess: async () => {
      toast.success("Email verified! Welcome to DojoFlow.");
      // Invalidate auth cache so ProtectedRoute sees emailVerified = true
      await utils.auth.me.invalidate();
      navigate("/kai", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message || "Invalid or expired code. Please try again.");
    },
  });

  const handleSendCode = () => {
    if (!email) return;
    resendMutation.mutate({ email });
  };

  const handleVerify = () => {
    if (!email) return;
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code from your email.");
      return;
    }
    verifyMutation.mutate({ email, code });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/owner";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Verify Your Email</h1>
          <p className="text-slate-400 text-sm text-center leading-relaxed">
            For your security, we need to verify your email address before you can access DojoFlow.
            {email && (
              <>
                {" "}Enter the 6-digit code sent to{" "}
                <span className="text-purple-300 font-medium">{email}</span>.
              </>
            )}
          </p>
        </div>

        {/* Code input */}
        <div className="space-y-3">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em] bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-14"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifyMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold"
          >
            {verifyMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>
        </div>

        {/* Resend */}
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-sm">Didn't receive a code?</p>
          <Button
            variant="ghost"
            onClick={handleSendCode}
            disabled={cooldown > 0 || resendMutation.isPending || !email}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 text-sm"
          >
            {resendMutation.isPending ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification code"}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-sm"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Sign out and use a different account
          </Button>
        </div>
      </div>
    </div>
  );
}
