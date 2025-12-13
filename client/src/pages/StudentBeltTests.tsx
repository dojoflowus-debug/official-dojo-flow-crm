import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_LOGO } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Lock
} from "lucide-react";
import { useLocation, useSearch } from "wouter";

// Belt colors for visual display
const beltColors: Record<string, { bg: string; border: string; text: string }> = {
  'White': { bg: '#F5F5F5', border: '#E0E0E0', text: '#374151' },
  'Yellow': { bg: '#FCD34D', border: '#F59E0B', text: '#78350F' },
  'Orange': { bg: '#FB923C', border: '#EA580C', text: '#7C2D12' },
  'Green': { bg: '#4ADE80', border: '#16A34A', text: '#14532D' },
  'Brown': { bg: '#A16207', border: '#78350F', text: '#FFFFFF' },
  'Blue': { bg: '#60A5FA', border: '#2563EB', text: '#1E3A8A' },
  'Purple': { bg: '#A78BFA', border: '#7C3AED', text: '#4C1D95' },
  'Red': { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF' },
  'Black': { bg: '#1F2937', border: '#111827', text: '#FFFFFF' },
};

// Soft Card Component
function SoftCard({ 
  children, 
  className = "",
  hover = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div 
      className={`
        bg-white rounded-3xl 
        shadow-[0_2px_20px_rgba(0,0,0,0.06)]
        border border-gray-100/50
        ${hover ? 'transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Registration Modal with Payment
function RegistrationModal({ 
  test, 
  studentId,
  onClose, 
  onSuccess 
}: { 
  test: any; 
  studentId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eligibilityQuery = trpc.studentPortal.checkBeltTestEligibility.useQuery(
    { studentId, testId: test.id },
    { enabled: !!test }
  );
  
  const paymentMutation = trpc.studentPortal.createBeltTestPayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.free) {
          // Free registration completed
          onSuccess();
        } else if (data.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = data.checkoutUrl;
        }
      } else {
        setError(data.error || 'Registration failed');
        setIsProcessing(false);
      }
    },
    onError: (err) => {
      setError(err.message);
      setIsProcessing(false);
    }
  });

  const handleRegister = () => {
    setIsProcessing(true);
    setError(null);
    
    const baseUrl = window.location.origin;
    paymentMutation.mutate({ 
      studentId, 
      testId: test.id,
      successUrl: `${baseUrl}/student-belt-tests?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/student-belt-tests?cancelled=true`,
    });
  };

  const beltColor = beltColors[test.beltLevel] || beltColors['White'];
  const testDate = new Date(test.testDate);
  const spotsLeft = test.maxCapacity - test.currentRegistrations;
  const hasFee = test.fee && test.fee > 0;
  const feeAmount = hasFee ? (test.fee / 100).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Belt Test Registration</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Belt Badge */}
          <div className="flex items-center justify-center">
            <div 
              className="px-6 py-3 rounded-full font-bold text-lg"
              style={{ 
                backgroundColor: beltColor.bg, 
                borderColor: beltColor.border,
                color: beltColor.text,
                border: `3px solid ${beltColor.border}`
              }}
            >
              {test.beltLevel} Belt Test
            </div>
          </div>

          {/* Test Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">{test.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>{testDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{test.startTime}{test.endTime ? ` - ${test.endTime}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>{test.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 text-orange-500" />
                <span>{spotsLeft} spots left</span>
              </div>
            </div>

            {test.instructorName && (
              <p className="text-sm text-gray-500">
                Lead Instructor: <span className="font-medium text-gray-700">{test.instructorName}</span>
              </p>
            )}

            {test.notes && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                {test.notes}
              </p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Registration Fee</p>
                  <p className="text-2xl font-bold">${feeAmount}</p>
                </div>
              </div>
              {hasFee && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span>Secure payment via Stripe</span>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility Check */}
          {eligibilityQuery.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-2 text-gray-500">Checking eligibility...</span>
            </div>
          ) : eligibilityQuery.data?.eligible ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">You are eligible to register!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your attendance and class requirements have been met.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Not Eligible</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {eligibilityQuery.data?.reason || 'You do not meet the requirements for this test.'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={!eligibilityQuery.data?.eligible || isProcessing}
            className="flex-1 bg-black hover:bg-gray-800 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : hasFee ? (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${feeAmount} & Register
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Register Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Success Modal
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
        <p className="text-gray-600 mb-6">
          You have successfully registered and paid for the belt test. We'll send you a reminder before the test date.
        </p>
        <Button 
          onClick={onClose}
          className="bg-black hover:bg-gray-800 text-white px-8"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}

/**
 * Student Belt Tests Page
 * Shows upcoming belt tests and allows registration with payment
 */
export default function StudentBeltTests() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Parse URL params
  const urlParams = new URLSearchParams(searchString);
  const paymentSuccess = urlParams.get('success') === 'true';
  const sessionId = urlParams.get('session_id');

  // Verify payment if returning from Stripe
  const verifyPaymentQuery = trpc.studentPortal.verifyBeltTestPayment.useQuery(
    { sessionId: sessionId || '' },
    { enabled: !!sessionId && paymentSuccess }
  );

  // Check login status
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("student_logged_in");
    const storedStudentId = localStorage.getItem("student_id");
    
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }
    
    if (storedStudentId) {
      setStudentId(parseInt(storedStudentId, 10));
    }
  }, [setLocation]);

  // Show success modal after payment verification
  useEffect(() => {
    if (verifyPaymentQuery.data?.paid) {
      setShowSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', '/student-belt-tests');
    }
  }, [verifyPaymentQuery.data]);

  // Fetch upcoming belt tests
  const testsQuery = trpc.studentPortal.getUpcomingBeltTests.useQuery(
    { studentId: studentId! },
    { enabled: !!studentId }
  );

  // Fetch my registrations
  const registrationsQuery = trpc.studentPortal.getMyBeltTestRegistrations.useQuery(
    { studentId: studentId! },
    { enabled: !!studentId }
  );

  const cancelMutation = trpc.studentPortal.cancelBeltTestRegistration.useMutation({
    onSuccess: () => {
      registrationsQuery.refetch();
      testsQuery.refetch();
    }
  });

  const handleRegistrationSuccess = () => {
    setSelectedTest(null);
    setShowSuccess(true);
    registrationsQuery.refetch();
    testsQuery.refetch();
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const upcomingTests = testsQuery.data?.tests || [];
  const myRegistrations = registrationsQuery.data || [];
  const registeredTestIds = myRegistrations
    .filter((r: any) => r.registration.status === 'registered')
    .map((r: any) => r.registration.testId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation("/student-dashboard")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <img src={APP_LOGO} alt="DojoFlow" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">Belt Tests</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Current Progress */}
        {testsQuery.data?.currentProgress && (
          <SoftCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{testsQuery.data.currentProgress.currentBelt}</p>
                <p className="text-sm text-gray-500">Current Belt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{testsQuery.data.nextBelt}</p>
                <p className="text-sm text-gray-500">Next Belt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{testsQuery.data.currentProgress.qualifiedAttendance}%</p>
                <p className="text-sm text-gray-500">Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{testsQuery.data.currentProgress.qualifiedClasses}</p>
                <p className="text-sm text-gray-500">Classes</p>
              </div>
            </div>
          </SoftCard>
        )}

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Registrations</h2>
            <div className="space-y-4">
              {myRegistrations.map((reg: any) => {
                const test = reg.test;
                if (!test) return null;
                const beltColor = beltColors[test.beltLevel] || beltColors['White'];
                const testDate = new Date(test.testDate);
                const isPast = testDate < new Date();
                
                return (
                  <SoftCard key={reg.registration.id} className="p-4" hover>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: beltColor.bg, border: `2px solid ${beltColor.border}` }}
                        >
                          <Award className="h-6 w-6" style={{ color: beltColor.text }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{test.name}</h3>
                          <p className="text-sm text-gray-500">
                            {testDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {test.startTime}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              reg.registration.status === 'registered' ? 'bg-green-100 text-green-700' :
                              reg.registration.status === 'passed' ? 'bg-blue-100 text-blue-700' :
                              reg.registration.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {reg.registration.status.charAt(0).toUpperCase() + reg.registration.status.slice(1)}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              reg.registration.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              reg.registration.paymentStatus === 'waived' ? 'bg-blue-100 text-blue-700' :
                              reg.registration.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {reg.registration.paymentStatus === 'paid' ? '✓ Paid' :
                               reg.registration.paymentStatus === 'waived' ? 'Free' :
                               reg.registration.paymentStatus === 'pending' ? 'Payment Pending' :
                               reg.registration.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      {reg.registration.status === 'registered' && !isPast && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelMutation.mutate({ studentId: studentId!, testId: test.id })}
                          disabled={cancelMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </SoftCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Tests */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming {testsQuery.data?.nextBelt} Belt Tests
          </h2>
          
          {testsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : upcomingTests.length === 0 ? (
            <SoftCard className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Upcoming Tests</h3>
              <p className="text-gray-500">
                There are no {testsQuery.data?.nextBelt} Belt tests scheduled at this time.
                Check back soon or ask the front desk for more information.
              </p>
            </SoftCard>
          ) : (
            <div className="space-y-4">
              {upcomingTests.map((test: any) => {
                const beltColor = beltColors[test.beltLevel] || beltColors['White'];
                const testDate = new Date(test.testDate);
                const spotsLeft = test.maxCapacity - test.currentRegistrations;
                const isRegistered = registeredTestIds.includes(test.id);
                const hasFee = test.fee && test.fee > 0;
                
                return (
                  <SoftCard key={test.id} className="p-6" hover>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: beltColor.bg, border: `2px solid ${beltColor.border}` }}
                        >
                          <Award className="h-7 w-7" style={{ color: beltColor.text }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{test.name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              {testDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-orange-500" />
                              {test.startTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              {test.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-sm text-gray-500">
                              <Users className="h-4 w-4 inline mr-1" />
                              {spotsLeft} of {test.maxCapacity} spots available
                            </p>
                            {hasFee && (
                              <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                ${(test.fee / 100).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Registered
                          </span>
                        ) : spotsLeft === 0 ? (
                          <span className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-full font-medium">
                            Full
                          </span>
                        ) : (
                          <Button
                            onClick={() => setSelectedTest(test)}
                            className="bg-black hover:bg-gray-800 text-white"
                          >
                            {hasFee ? (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Register (${(test.fee / 100).toFixed(2)})
                              </>
                            ) : (
                              'Register'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </SoftCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Requirements Info */}
        <SoftCard className="p-6 bg-orange-50 border-orange-100">
          <h3 className="font-semibold text-orange-900 mb-2">Belt Test Requirements</h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Minimum 80% attendance in the current belt cycle</li>
            <li>• Minimum 20 qualified classes since last promotion</li>
            <li>• Must be testing for your next belt level</li>
            <li>• Registration closes when capacity is reached</li>
            <li>• Payment is processed securely via Stripe</li>
          </ul>
        </SoftCard>

        {/* Stripe Badge */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Lock className="h-4 w-4" />
          <span>Payments secured by Stripe</span>
        </div>
      </main>

      {/* Registration Modal */}
      {selectedTest && studentId && (
        <RegistrationModal
          test={selectedTest}
          studentId={studentId}
          onClose={() => setSelectedTest(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}
