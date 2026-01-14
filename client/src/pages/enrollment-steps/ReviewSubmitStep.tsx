import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ReviewSubmitStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  enrollmentId: number | null;
}

export default function ReviewSubmitStep({ data, onBack, enrollmentId }: ReviewSubmitStepProps) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const submitEnrollment = trpc.enrollment.submit.useMutation();

  const handleSubmit = async () => {
    if (!enrollmentId) return;
    
    setIsSubmitting(true);
    try {
      const result = await submitEnrollment.mutateAsync({ enrollmentId });
      
      if (result.success) {
        setIsSuccess(true);
        
        // Redirect to kiosk after 5 seconds
        setTimeout(() => {
          navigate('/kiosk');
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to submit enrollment:', error);
      alert('Failed to submit enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Enrollment Complete!
        </h2>
        
        <p className="text-xl text-slate-300 mb-6">
          Welcome to the DojoFlow family!
        </p>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <p className="text-slate-300 mb-4">
            Our staff will contact you within 24 hours to:
          </p>
          <ul className="text-left text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Schedule your first class</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Discuss membership options</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Answer any questions you have</span>
            </li>
          </ul>
        </div>
        
        <p className="text-slate-400 text-sm">
          Returning to welcome screen in 5 seconds...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Review Your Information
        </h2>
        <p className="text-slate-400">
          Please review your enrollment details before submitting
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Student Information */}
        {(data.firstName || data.lastName) && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Student Information</h3>
            <div className="space-y-2 text-slate-300">
              <p><span className="text-slate-400">Name:</span> {data.firstName} {data.lastName}</p>
              {data.dateOfBirth && <p><span className="text-slate-400">Date of Birth:</span> {new Date(data.dateOfBirth).toLocaleDateString()}</p>}
              {data.age && <p><span className="text-slate-400">Age:</span> {data.age}</p>}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(data.phone || data.email) && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2 text-slate-300">
              {data.phone && <p><span className="text-slate-400">Phone:</span> {data.phone}</p>}
              {data.email && <p><span className="text-slate-400">Email:</span> {data.email}</p>}
              {data.streetAddress && (
                <p>
                  <span className="text-slate-400">Address:</span> {data.streetAddress}
                  {data.city && `, ${data.city}`}
                  {data.state && `, ${data.state}`}
                  {data.zipCode && ` ${data.zipCode}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Parent/Guardian */}
        {data.guardianName && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Parent/Guardian</h3>
            <div className="space-y-2 text-slate-300">
              <p><span className="text-slate-400">Name:</span> {data.guardianName}</p>
              {data.guardianRelationship && <p><span className="text-slate-400">Relationship:</span> {data.guardianRelationship}</p>}
              {data.guardianPhone && <p><span className="text-slate-400">Phone:</span> {data.guardianPhone}</p>}
              {data.guardianEmail && <p><span className="text-slate-400">Email:</span> {data.guardianEmail}</p>}
            </div>
          </div>
        )}

        {/* Program Interest */}
        {data.programInterest && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Program Interest</h3>
            <div className="space-y-2 text-slate-300">
              <p><span className="text-slate-400">Program:</span> {data.programInterest}</p>
              {data.experienceLevel && <p><span className="text-slate-400">Experience:</span> {data.experienceLevel}</p>}
            </div>
          </div>
        )}

        {/* Goals */}
        {data.goals && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Goals</h3>
            <p className="text-slate-300">{data.goals}</p>
          </div>
        )}

        {/* Membership */}
        {data.selectedMembershipPlan && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Selected Membership</h3>
            <p className="text-slate-300">{data.selectedMembershipPlan}</p>
          </div>
        )}

        {/* Waiver */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-white font-semibold">Waiver Signed</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
      </Button>
    </div>
  );
}
