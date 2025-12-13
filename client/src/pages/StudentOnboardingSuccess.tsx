import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Check, Calendar, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * StudentOnboardingSuccess - Success page after completing enrollment
 * Features:
 * - Celebration animation with confetti
 * - Welcome message
 * - Next steps guidance
 * - Quick links to dashboard features
 */
export default function StudentOnboardingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const enrollmentId = searchParams.get("enrollmentId");

  const [showContent, setShowContent] = useState(false);

  // Fetch student data
  const { data: studentData, isLoading } = trpc.studentPortal.getStudentById.useQuery(
    { studentId: Number(studentId) },
    { enabled: !!studentId }
  );

  // Fetch enrollment status
  const { data: enrollmentData } = trpc.studentPortal.getEnrollmentStatus.useQuery(
    { studentId: Number(studentId) },
    { enabled: !!studentId }
  );

  const student = studentData?.student;
  const enrollment = enrollmentData?.enrollment;
  const trialDaysRemaining = enrollmentData?.trialDaysRemaining;

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"],
      });
      setShowContent(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div 
        className={`max-w-lg w-full transition-all duration-700 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to the Dojo!</h1>
            <p className="text-white/90">
              {student?.firstName}, your enrollment is complete
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Trial Status */}
            {enrollment?.status === "trial" && trialDaysRemaining !== null && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Free Trial Active</p>
                  <p className="text-sm text-green-600">
                    {trialDaysRemaining} days remaining
                  </p>
                </div>
              </div>
            )}

            {/* What's Next */}
            <h2 className="font-semibold text-slate-900 mb-4">What's Next?</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">View Class Schedule</p>
                  <p className="text-sm text-slate-500">Find classes that fit your schedule</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Prepare for Your First Class</p>
                  <p className="text-sm text-slate-500">Wear comfortable clothes, bring water</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Connect with Instructors</p>
                  <p className="text-sm text-slate-500">Ask questions, get guidance</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => navigate("/student-dashboard")}
              className="w-full h-14 text-base bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/25"
            >
              Go to Dashboard
            </Button>

            <p className="text-center text-xs text-slate-400 mt-4">
              A confirmation email has been sent to your inbox
            </p>
          </div>
        </div>

        {/* School Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Questions? Contact us at the front desk
          </p>
        </div>
      </div>
    </div>
  );
}
