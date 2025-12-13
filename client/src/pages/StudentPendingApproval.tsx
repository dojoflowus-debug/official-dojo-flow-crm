import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, Mail, Phone, ArrowLeft } from "lucide-react";

/**
 * StudentPendingApproval - Page shown when enrollment requires instructor approval
 * Features:
 * - Clear status message
 * - Expected timeline
 * - Contact information
 * - Option to check status later
 */
export default function StudentPendingApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const enrollmentId = searchParams.get("enrollmentId");

  // Fetch student data
  const { data: studentData, isLoading } = trpc.studentPortal.getStudentById.useQuery(
    { studentId: Number(studentId) },
    { enabled: !!studentId }
  );

  const student = studentData?.student;

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pending Approval</h1>
            <p className="text-white/90">
              Your enrollment request has been submitted
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800">
                <span className="font-medium">Hi {student?.firstName}!</span> Your enrollment 
                requires instructor approval. We'll review your application and get back 
                to you within 24-48 hours.
              </p>
            </div>

            <h2 className="font-semibold text-slate-900 mb-4">What Happens Next?</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-amber-700">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Application Review</p>
                  <p className="text-sm text-slate-500">
                    Our instructors will review your application and experience level
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-500">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Email Notification</p>
                  <p className="text-sm text-slate-500">
                    You'll receive an email once your application is approved
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-500">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Complete Payment</p>
                  <p className="text-sm text-slate-500">
                    After approval, you can complete payment and start training
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t border-slate-100 pt-6 mb-6">
              <h3 className="font-medium text-slate-900 mb-3">Questions?</h3>
              <div className="space-y-2">
                <a 
                  href="mailto:info@dojo.com" 
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500"
                >
                  <Mail className="h-4 w-4" />
                  info@dojo.com
                </a>
                <a 
                  href="tel:+15551234567" 
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500"
                >
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/student-login")}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                Check Status Later
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full h-12 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Reference ID: ENR-{enrollmentId || "000"}
        </p>
      </div>
    </div>
  );
}
