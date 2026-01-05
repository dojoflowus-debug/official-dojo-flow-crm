import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import AIChatBox from './AIChatBox';
import {
  BasicsStep,
  BrandingStep,
  ProgramsStep,
  ScheduleStep,
  PricingStep,
  StaffStep,
  LocationsStep,
  ReviewStep,
} from './SetupWizardSteps';

const WIZARD_STEPS = [
  { id: 1, title: 'Basics', description: 'Business name & timezone' },
  { id: 2, title: 'Branding', description: 'Logo & colors' },
  { id: 3, title: 'Programs', description: 'Add your programs' },
  { id: 4, title: 'Schedule', description: 'Class schedule' },
  { id: 5, title: 'Pricing', description: 'Pricing plans' },
  { id: 6, title: 'Staff', description: 'Instructors' },
  { id: 7, title: 'Locations', description: 'Dojo locations' },
  { id: 8, title: 'Review', description: 'Review & publish' },
];

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function SetupWizardModal({
  isOpen,
  onClose,
  onComplete,
}: SetupWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState<number[]>([]);
  const [showAIChat, setShowAIChat] = useState(true);
  const [stepData, setStepData] = useState<Record<string, any>>({
    businessName: '',
    timezone: 'America/New_York',
    estimatedStudents: 0,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
  });
  const { toast } = useToast();

  const updateProgressMutation = trpc.setupWizard.updateProgress.useMutation();
  const completeSetupMutation = trpc.setupWizard.completeSetup.useMutation();

  const handleStepComplete = async () => {
    // Validate step data before proceeding
    if (currentStep === 1) {
      if (!stepData.businessName) {
        toast({
          title: 'Required',
          description: 'Please enter your business name',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!stepsCompleted.includes(currentStep)) {
      setStepsCompleted([...stepsCompleted, currentStep]);
    }

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
      await updateProgressMutation.mutateAsync({
        currentStep: currentStep + 1,
        stepsCompleted: [...stepsCompleted, currentStep],
      });
    }
  };

  const handleSkipStep = () => {
    if (!stepsCompleted.includes(currentStep)) {
      setStepsCompleted([...stepsCompleted, currentStep]);
    }
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = async () => {
    try {
      await completeSetupMutation.mutateAsync();
      toast({
        title: 'Setup Complete!',
        description: 'Your dojo is ready to go. Welcome to DojoFlow!',
      });
      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const progressPercent = (stepsCompleted.length / WIZARD_STEPS.length) * 100;
  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col">
        {/* Header with progress */}
        <div className="border-b bg-gradient-to-r from-slate-50 to-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Set Up Your Dojo
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Estimated setup time: 3–7 minutes
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(progressPercent)}%
              </div>
              <p className="text-xs text-slate-600">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-2" />

          {/* Step indicators */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : stepsCompleted.includes(step.id)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {stepsCompleted.includes(step.id) ? (
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                ) : (
                  <span className="inline-block w-4 h-4 mr-1 text-center">
                    {step.id}
                  </span>
                )}
                {step.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left side - AI Chat */}
          {showAIChat && (
            <div className="w-1/3 border-r bg-slate-50 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Kai Assistant</h3>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChatBox
                  context={{
                    type: 'setup_wizard',
                    step: currentStepData.title,
                    description: currentStepData.description,
                  }}
                />
              </div>
            </div>
          )}

          {/* Right side - Setup content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-slate-600 mb-6">
                  {currentStepData.description}
                </p>

                {/* Step content */}
                <div className="mb-6">
                  {currentStep === 1 && (
                    <BasicsStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 2 && (
                    <BrandingStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 3 && (
                    <ProgramsStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 4 && (
                    <ScheduleStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 5 && (
                    <PricingStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 6 && (
                    <StaffStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 7 && (
                    <LocationsStep data={stepData} onChange={setStepData} />
                  )}
                  {currentStep === 8 && (
                    <ReviewStep data={stepData} />
                  )}
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="border-t bg-slate-50 p-6 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkipStep}
                >
                  Skip
                </Button>
              </div>

              <div className="flex gap-2">
                {currentStep === WIZARD_STEPS.length ? (
                  <Button
                    onClick={handleFinish}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Publish & Launch
                  </Button>
                ) : (
                  <Button onClick={handleStepComplete}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
