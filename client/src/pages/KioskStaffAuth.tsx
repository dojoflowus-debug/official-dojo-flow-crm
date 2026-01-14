import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Users, KeyRound, QrCode, Mail, ArrowLeft } from "lucide-react";

/**
 * Kiosk Staff Authentication Page
 * ONLY accessible from Kiosk interface - NOT from public website
 * Supports PIN, QR code, and email/phone verification
 * Location-bound authentication
 */
export default function KioskStaffAuth() {
  const navigate = useNavigate();
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [authMethod, setAuthMethod] = useState<"pin" | "email" | "qr">("pin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Kiosk */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white"
            onClick={() => navigate(`/kiosk/${locationSlug}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Kiosk
          </Button>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">Staff Login</span>
        </div>

        <Card className="shadow-xl bg-slate-800/50 backdrop-blur-md border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Staff Access</CardTitle>
            <CardDescription className="text-slate-300">
              Choose your authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as typeof authMethod)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="pin" className="data-[state=active]:bg-blue-600">
                  <KeyRound className="h-4 w-4 mr-2" />
                  PIN
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-blue-600">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-blue-600">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pin">
                <PINAuthForm locationSlug={locationSlug} />
              </TabsContent>

              <TabsContent value="email">
                <EmailAuthForm locationSlug={locationSlug} />
              </TabsContent>

              <TabsContent value="qr">
                <QRAuthForm locationSlug={locationSlug} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          Staff authentication is only available at physical kiosk locations
        </p>
      </div>
    </div>
  );
}

/**
 * PIN Authentication Form
 */
function PINAuthForm({ locationSlug }: { locationSlug?: string }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");

  const pinLoginMutation = trpc.staffAuth.loginWithPIN.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
      setPin(""); // Clear PIN on error
    },
  });

  const handlePINSubmit = () => {
    if (!pin || pin.length < 4) {
      toast.error("Please enter a valid PIN (at least 4 digits)");
      return;
    }
    pinLoginMutation.mutate({ pin, locationSlug: locationSlug || "" });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="pin" className="text-white">Enter Your PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          placeholder="••••"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handlePINSubmit()}
          className="text-center text-2xl tracking-widest bg-slate-700/50 border-slate-600 text-white"
          autoFocus
        />
      </div>

      <Button
        onClick={handlePINSubmit}
        disabled={pinLoginMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
      >
        {pinLoginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </div>
  );
}

/**
 * Email/Phone Authentication Form
 */
function EmailAuthForm({ locationSlug }: { locationSlug?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const requestCodeMutation = trpc.staffAuth.requestLoginCode.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your email");
      setCodeSent(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyCodeMutation = trpc.staffAuth.verifyLoginCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequestCode = () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    requestCodeMutation.mutate({ email, locationSlug: locationSlug || "" });
  };

  const handleVerifyCode = () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    verifyCodeMutation.mutate({ email, code, locationSlug: locationSlug || "" });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="staff@yourschool.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={codeSent}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      {!codeSent ? (
        <Button
          onClick={handleRequestCode}
          disabled={requestCodeMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          {requestCodeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Code...
            </>
          ) : (
            "Send Verification Code"
          )}
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white">Verification Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              className="text-center text-2xl tracking-widest bg-slate-700/50 border-slate-600 text-white"
              autoFocus
            />
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={verifyCodeMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {verifyCodeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setCodeSent(false);
              setCode("");
            }}
            className="w-full text-slate-300 hover:text-white"
          >
            Use different email
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * QR Code Authentication Form
 */
function QRAuthForm({ locationSlug }: { locationSlug?: string }) {
  const navigate = useNavigate();
  const [qrData, setQrData] = useState("");

  const qrLoginMutation = trpc.staffAuth.loginWithQR.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
      setQrData("");
    },
  });

  const handleQRScan = () => {
    if (!qrData) {
      toast.error("Please scan your QR code");
      return;
    }
    qrLoginMutation.mutate({ qrData, locationSlug: locationSlug || "" });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="text-center py-8">
        <div className="w-48 h-48 mx-auto bg-slate-700/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-600">
          <div className="text-center">
            <QrCode className="h-16 w-16 mx-auto text-slate-400 mb-3" />
            <p className="text-sm text-slate-400">Scan your staff QR code</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr-data" className="text-white">Or enter QR code manually</Label>
        <Input
          id="qr-data"
          type="text"
          placeholder="QR code data"
          value={qrData}
          onChange={(e) => setQrData(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQRScan()}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <Button
        onClick={handleQRScan}
        disabled={qrLoginMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
      >
        {qrLoginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        QR codes are generated by your school administrator
      </p>
    </div>
  );
}
