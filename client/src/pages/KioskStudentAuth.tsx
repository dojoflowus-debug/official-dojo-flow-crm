import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, GraduationCap, Phone, QrCode, User, ArrowLeft, Calendar } from "lucide-react";

/**
 * Kiosk Student/Parent Authentication Page
 * ONLY accessible from Kiosk interface - NOT from public website
 * Supports phone + verification, QR code, and name + DOB
 * Organization-bound authentication
 */
export default function KioskStudentAuth() {
  const navigate = useNavigate();
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [authMethod, setAuthMethod] = useState<"phone" | "qr" | "name-dob">("phone");

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
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">Student Login</span>
        </div>

        <Card className="shadow-xl bg-slate-800/50 backdrop-blur-md border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Welcome Back!</CardTitle>
            <CardDescription className="text-slate-300">
              Choose how you'd like to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as typeof authMethod)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="phone" className="data-[state=active]:bg-purple-600">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-purple-600">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="name-dob" className="data-[state=active]:bg-purple-600">
                  <User className="h-4 w-4 mr-2" />
                  Name
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone">
                <PhoneAuthForm locationSlug={locationSlug} />
              </TabsContent>

              <TabsContent value="qr">
                <QRAuthForm locationSlug={locationSlug} />
              </TabsContent>

              <TabsContent value="name-dob">
                <NameDOBAuthForm locationSlug={locationSlug} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          Student authentication is only available at kiosk locations
        </p>
      </div>
    </div>
  );
}

/**
 * Phone + Verification Code Authentication Form
 */
function PhoneAuthForm({ locationSlug }: { locationSlug?: string }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const requestCodeMutation = trpc.studentAuth.requestLoginCode.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your phone");
      setCodeSent(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyCodeMutation = trpc.studentAuth.verifyLoginCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/student-portal");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleRequestCode = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    requestCodeMutation.mutate({ phone: digits, locationSlug: locationSlug || "" });
  };

  const handleVerifyCode = () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    verifyCodeMutation.mutate({ phone: digits, code, locationSlug: locationSlug || "" });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-white">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={handlePhoneChange}
          disabled={codeSent}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      {!codeSent ? (
        <Button
          onClick={handleRequestCode}
          disabled={requestCodeMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
            Use different phone number
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

  const qrLoginMutation = trpc.studentAuth.loginWithQR.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/student-portal");
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
            <p className="text-sm text-slate-400">Scan your student QR code</p>
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
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
        QR codes are provided by your school
      </p>
    </div>
  );
}

/**
 * Name + Date of Birth Authentication Form (for children)
 */
function NameDOBAuthForm({ locationSlug }: { locationSlug?: string }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const nameDOBLoginMutation = trpc.studentAuth.loginWithNameDOB.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/student-portal");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogin = () => {
    if (!firstName || !lastName) {
      toast.error("Please enter your first and last name");
      return;
    }
    if (!dateOfBirth) {
      toast.error("Please enter your date of birth");
      return;
    }
    nameDOBLoginMutation.mutate({
      firstName,
      lastName,
      dateOfBirth,
      locationSlug: locationSlug || "",
    });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="first-name" className="text-white">First Name</Label>
        <Input
          id="first-name"
          type="text"
          placeholder="John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="last-name" className="text-white">Last Name</Label>
        <Input
          id="last-name"
          type="text"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob" className="text-white">
          <Calendar className="inline h-4 w-4 mr-2" />
          Date of Birth
        </Label>
        <Input
          id="dob"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <Button
        onClick={handleLogin}
        disabled={nameDOBLoginMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {nameDOBLoginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        This method is for students under 18
      </p>
    </div>
  );
}
