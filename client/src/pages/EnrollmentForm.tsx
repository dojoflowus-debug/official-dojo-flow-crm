import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Step components
import StudentInfoStep from './enrollment-steps/StudentInfoStep';
import ContactInfoStep from './enrollment-steps/ContactInfoStep';
import ParentInfoStep from './enrollment-steps/ParentInfoStep';
import ProgramInterestStep from './enrollment-steps/ProgramInterestStep';
import GoalsMotivationStep from './enrollment-steps/GoalsMotivationStep';
import MedicalInfoStep from './enrollment-steps/MedicalInfoStep';
import PricingStep from './enrollment-steps/PricingStep';
import WaiverStep from './enrollment-steps/WaiverStep';
import ReviewSubmitStep from './enrollment-steps/ReviewSubmitStep';

const STEPS = [
  { id: 'student_info', title: 'Student Information', component: StudentInfoStep },
  { id: 'contact_info', title: 'Contact Information', component: ContactInfoStep },
  { id: 'parent_info', title: 'Parent/Guardian', component: ParentInfoStep },
  { id: 'program_interest', title: 'Program Interest', component: ProgramInterestStep },
  { id: 'goals_motivation', title: 'Goals & Motivation', component: GoalsMotivationStep },
  { id: 'medical_info', title: 'Medical Information', component: MedicalInfoStep },
  { id: 'pricing', title: 'Membership', component: PricingStep },
  { id: 'waiver', title: 'Waiver & Consent', component: WaiverStep },
  { id: 'review', title: 'Review & Submit', component: ReviewSubmitStep },
];

export default function EnrollmentForm() {
  const [, navigate] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEnrollment = trpc.enrollment.create.useMutation();
  const updateStep = trpc.enrollment.updateStep.useMutation();

  // Create enrollment on mount
  useEffect(() => {
    const initEnrollment = async () => {
      const result = await createEnrollment.mutateAsync({ source: 'form' });
      if (result.success && result.enrollmentId) {
        setEnrollmentId(result.enrollmentId);
      }
    };
    initEnrollment();
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const CurrentStepComponent = currentStep.component;
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async (stepData: any) => {
    if (!enrollmentId) return;

    setIsSubmitting(true);
    try {
      // Save step data to backend
      await updateStep.mutateAsync({
        enrollmentId,
        stepId: currentStep.id,
        data: stepData,
      });

      // Update local state
      setEnrollmentData({ ...enrollmentData, ...stepData });

      // Move to next step
      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/enrollment')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-white font-semibold">{currentStep.title}</h2>
                <p className="text-sm text-slate-400">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <CurrentStepComponent
            data={enrollmentData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            isSubmitting={isSubmitting}
            enrollmentId={enrollmentId}
          />
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStepIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentStepIndex
                ? 'bg-red-600 w-8'
                : index < currentStepIndex
                ? 'bg-red-600/50'
                : 'bg-slate-700'
            }`}
            aria-label={`Go to ${step.title}`}
          />
        ))}
      </div>
    </div>
  );
}
