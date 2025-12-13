import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Loader2, Check, AlertCircle, FileText, Eraser, ChevronDown } from "lucide-react";
import SignaturePad from "signature_pad";

/**
 * WaiverSigning - Digital liability waiver signing page
 * Features:
 * - Full waiver document display
 * - Touch/mouse signature pad
 * - Auto-determine signer (guardian for under 18, student for 18+)
 * - Date/name auto-filled
 * - Cannot proceed without signature
 */
export default function WaiverSigning() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const programId = searchParams.get("programId");
  const enrollmentId = searchParams.get("enrollmentId");

  // Signature pad refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // State
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch student data
  const { data: studentData, isLoading: studentLoading } = trpc.studentPortal.getStudentById.useQuery(
    { studentId: Number(studentId) },
    { enabled: !!studentId }
  );

  // Fetch waiver template
  const { data: waiverData, isLoading: waiverLoading } = trpc.studentPortal.getWaiverTemplate.useQuery(
    { programId: programId ? Number(programId) : undefined },
    { enabled: true }
  );

  // Sign waiver mutation
  const signWaiverMutation = trpc.studentPortal.signWaiver.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Navigate to payment or success based on program config
        if (data.nextStep === "payment") {
          navigate(`/student-payment?studentId=${studentId}&programId=${programId}&enrollmentId=${data.enrollmentId}`);
        } else if (data.nextStep === "pending_approval") {
          navigate(`/student-pending-approval?studentId=${studentId}&enrollmentId=${data.enrollmentId}`);
        } else {
          navigate(`/student-onboarding-success?studentId=${studentId}&enrollmentId=${data.enrollmentId}`);
        }
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to submit waiver. Please try again.");
      setIsSubmitting(false);
    },
  });

  // Calculate age from DOB
  const calculateAge = (dob: Date | string | null): number => {
    if (!dob) return 18; // Default to adult if no DOB
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const student = studentData?.student;
  const isMinor = student?.dateOfBirth ? calculateAge(student.dateOfBirth) < 18 : false;
  const signerType = isMinor ? "guardian" : "student";
  const signerName = isMinor 
    ? student?.guardianName || "" 
    : `${student?.firstName || ""} ${student?.lastName || ""}`.trim();

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });

      signaturePadRef.current.addEventListener("endStroke", () => {
        setHasSignature(!signaturePadRef.current?.isEmpty());
      });
    }
  }, [canvasRef.current]);

  // Handle scroll to detect if user has read the waiver
  const handleWaiverScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Clear signature
  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  // Submit waiver
  const handleSubmit = async () => {
    if (!hasAgreed || !hasSignature || !studentId) {
      setError("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const signatureData = signaturePadRef.current?.toDataURL("image/png") || "";

    signWaiverMutation.mutate({
      studentId: Number(studentId),
      programId: programId ? Number(programId) : undefined,
      waiverTemplateId: waiverData?.waiver?.id || 1,
      signerType,
      signerName,
      signerEmail: isMinor ? student?.guardianEmail || "" : student?.email || "",
      signatureData,
    });
  };

  const isLoading = studentLoading || waiverLoading;
  const canSubmit = hasScrolledToBottom && hasAgreed && hasSignature && !isSubmitting;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Loading waiver...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Student Not Found</h2>
          <p className="text-slate-500 mb-4">Unable to load student information.</p>
          <Button onClick={() => navigate("/student-login")}>Return to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Liability Waiver</h1>
              <p className="text-sm text-slate-500">Required before class participation</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-slate-500">{student.program || "General Program"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
              <Check className="h-3 w-3" />
            </span>
            <span>Profile Complete</span>
            <span className="text-slate-300">→</span>
            <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-medium">2</span>
            <span className="font-medium text-slate-900">Sign Waiver</span>
            <span className="text-slate-300">→</span>
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">3</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Waiver Document */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">{waiverData?.waiver?.title || "Liability Waiver"}</h2>
            <p className="text-sm text-slate-500">Please read the entire document before signing</p>
          </div>
          
          <div 
            className="p-6 max-h-[400px] overflow-y-auto prose prose-sm prose-slate"
            onScroll={handleWaiverScroll}
          >
            <div dangerouslySetInnerHTML={{ 
              __html: (waiverData?.waiver?.content || "").replace(/\n/g, "<br/>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/^## (.+)$/gm, "<h2>$1</h2>") 
            }} />
          </div>

          {!hasScrolledToBottom && (
            <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-center justify-center gap-2 text-amber-700 text-sm">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              Scroll down to read the entire waiver
            </div>
          )}
        </div>

        {/* Signer Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            {isMinor ? "Parent/Guardian Signature Required" : "Your Signature"}
          </h3>
          
          {isMinor && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700">
                Since the student is under 18 years old, a parent or guardian must sign this waiver.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isMinor ? "Guardian Name" : "Full Name"}
              </label>
              <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                {signerName || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                {new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </div>
            </div>
          </div>

          {/* Signature Pad */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Signature
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>
            <div className={`border-2 rounded-xl overflow-hidden ${hasSignature ? "border-green-300" : "border-slate-200"}`}>
              <canvas
                ref={canvasRef}
                className="w-full h-40 touch-none"
                style={{ touchAction: "none" }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sign above using your finger or mouse
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <Checkbox
              id="agree"
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(checked === true)}
              disabled={!hasScrolledToBottom}
              className="mt-0.5"
            />
            <label htmlFor="agree" className="text-sm text-slate-700 cursor-pointer">
              I have read and understand the terms of this liability waiver. I agree to release and hold harmless the school from any claims arising from my participation in martial arts training.
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 h-14 text-base rounded-xl"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 h-14 text-base bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Sign & Continue
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Your signature will be securely stored and a copy will be available in your dashboard.
        </p>
      </main>
    </div>
  );
}
