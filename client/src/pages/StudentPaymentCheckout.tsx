import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Check, AlertCircle, CreditCard, Shield, Clock } from "lucide-react";

/**
 * StudentPaymentCheckout - Payment page for program enrollment
 * Features:
 * - Shows program details and pricing
 * - Stripe checkout integration
 * - Trial period information if applicable
 * - Secure payment processing
 */
export default function StudentPaymentCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const programId = searchParams.get("programId");
  const enrollmentId = searchParams.get("enrollmentId");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Fetch student data
  const { data: studentData, isLoading: studentLoading } = trpc.studentPortal.getStudentById.useQuery(
    { studentId: Number(studentId) },
    { enabled: !!studentId }
  );

  // Fetch program data
  const { data: programData, isLoading: programLoading } = trpc.studentPortal.getProgramById.useQuery(
    { programId: Number(programId) },
    { enabled: !!programId }
  );

  // Fetch enrollment status
  const { data: enrollmentData } = trpc.studentPortal.getEnrollmentStatus.useQuery(
    { studentId: Number(studentId), programId: programId ? Number(programId) : undefined },
    { enabled: !!studentId }
  );

  // Create checkout session mutation
  const createCheckoutMutation = trpc.studentPortal.createEnrollmentCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success && data.nextStep === "success") {
        navigate(`/student-onboarding-success?studentId=${studentId}&enrollmentId=${enrollmentId}`);
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to create checkout session");
      setIsProcessing(false);
    },
  });

  const student = studentData?.student;
  const program = programData?.program;
  const enrollment = enrollmentData?.enrollment;

  const isLoading = studentLoading || programLoading;

  // Calculate pricing
  const monthlyPrice = program?.monthlyPrice || 0;
  const trialDays = program?.trialLengthDays || 0;
  const isProrated = program?.trialType === "prorated";
  const proratedAmount = isProrated && trialDays > 0 
    ? Math.round((monthlyPrice / 30) * trialDays) 
    : 0;

  const handlePayment = async () => {
    if (!studentId || !programId) {
      setError("Missing required information");
      return;
    }

    setIsProcessing(true);
    setError("");

    createCheckoutMutation.mutate({
      studentId: Number(studentId),
      programId: Number(programId),
      enrollmentId: enrollmentId ? Number(enrollmentId) : undefined,
    });
  };

  const handleSkipPayment = () => {
    // For free trials, skip payment and go to success
    navigate(`/student-onboarding-success?studentId=${studentId}&enrollmentId=${enrollmentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!student || !program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Information Not Found</h2>
          <p className="text-slate-500 mb-4">Unable to load payment details.</p>
          <Button onClick={() => navigate("/student-login")}>Return to Login</Button>
        </div>
      </div>
    );
  }

  // If it's a free trial, show different UI
  if (program.trialType === "free" && trialDays > 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Free Trial</h1>
                <p className="text-sm text-slate-500">{program.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Start Your Free Trial!
            </h2>
            <p className="text-slate-600 mb-6">
              You have {trialDays} days to try {program.name} completely free.
              No payment required today.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-green-600 mb-2">$0</div>
              <div className="text-slate-500">for {trialDays} days</div>
              <div className="text-sm text-slate-400 mt-2">
                Then ${(monthlyPrice / 100).toFixed(2)}/month
              </div>
            </div>

            <Button
              onClick={handleSkipPayment}
              className="w-full h-14 text-base bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/25"
            >
              Start Free Trial
            </Button>

            <p className="text-xs text-slate-400 mt-4">
              You can cancel anytime during your trial period.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Payment</h1>
              <p className="text-sm text-slate-500">Complete your enrollment</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-slate-500">{program.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
              <Check className="h-3 w-3" />
            </span>
            <span>Profile</span>
            <span className="text-slate-300">→</span>
            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
              <Check className="h-3 w-3" />
            </span>
            <span>Waiver</span>
            <span className="text-slate-300">→</span>
            <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-medium">3</span>
            <span className="font-medium text-slate-900">Payment</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 mb-1">Order Summary</h2>
            <p className="text-sm text-slate-500">Review your enrollment details</p>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-slate-900">{program.name}</h3>
                <p className="text-sm text-slate-500">{program.description || "Monthly membership"}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">
                  ${(monthlyPrice / 100).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">per month</div>
              </div>
            </div>

            {isProrated && trialDays > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{trialDays}-Day Prorated Trial</span>
                </div>
                <p className="text-sm text-blue-600">
                  Pay ${(proratedAmount / 100).toFixed(2)} today for your trial period.
                  After {trialDays} days, you'll be charged ${(monthlyPrice / 100).toFixed(2)}/month.
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-slate-900">Due Today</span>
                <span className="text-slate-900">
                  ${((isProrated ? proratedAmount : monthlyPrice) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-4 mb-6">
          <Shield className="h-5 w-5 text-slate-500" />
          <div className="text-sm text-slate-600">
            <span className="font-medium">Secure Payment</span>
            <span className="mx-1">·</span>
            <span>Powered by Stripe</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-14 text-base bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/25"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ${((isProrated ? proratedAmount : monthlyPrice) / 100).toFixed(2)}
            </>
          )}
        </Button>

        <div className="flex gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 h-12 rounded-xl"
          >
            Back
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By completing this payment, you agree to our terms of service and privacy policy.
        </p>
      </main>
    </div>
  );
}
