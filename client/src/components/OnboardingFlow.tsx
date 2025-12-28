import { useState } from "react";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingFlowProps {
  flowType: "growth" | "health" | "billing" | "retention";
  onComplete: () => void;
  onClose: () => void;
}

interface ConversationStep {
  question: string;
  placeholder: string;
  fieldName: string;
}

const flowSteps: Record<string, ConversationStep[]> = {
  growth: [
    {
      question: "What's your current student count?",
      placeholder: "e.g., 75 students",
      fieldName: "currentStudents",
    },
    {
      question: "What's your target student count?",
      placeholder: "e.g., 150 students",
      fieldName: "targetStudents",
    },
    {
      question: "What's your ideal timeline?",
      placeholder: "e.g., 6 months",
      fieldName: "timeline",
    },
  ],
  health: [
    {
      question: "How many classes do you run per week?",
      placeholder: "e.g., 20 classes",
      fieldName: "classesPerWeek",
    },
    {
      question: "What's your average class size?",
      placeholder: "e.g., 12 students",
      fieldName: "avgClassSize",
    },
    {
      question: "Which programs do you want to track?",
      placeholder: "e.g., Kids Karate, Adult BJJ",
      fieldName: "programs",
    },
  ],
  billing: [
    {
      question: "How many active members do you have?",
      placeholder: "e.g., 85 members",
      fieldName: "activeMembers",
    },
    {
      question: "What's your typical monthly tuition?",
      placeholder: "e.g., $150/month",
      fieldName: "monthlyTuition",
    },
    {
      question: "Do you currently use a payment processor?",
      placeholder: "e.g., Stripe, Square, None",
      fieldName: "paymentProcessor",
    },
  ],
  retention: [
    {
      question: "How long do students typically stay?",
      placeholder: "e.g., 18 months",
      fieldName: "avgRetention",
    },
    {
      question: "What's your current monthly churn rate?",
      placeholder: "e.g., 5%",
      fieldName: "churnRate",
    },
    {
      question: "What engagement signals do you track?",
      placeholder: "e.g., Attendance, belt tests",
      fieldName: "engagementSignals",
    },
  ],
};

export default function OnboardingFlow({
  flowType,
  onComplete,
  onClose,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState("");

  const steps = flowSteps[flowType];
  const currentQuestion = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (!currentInput.trim()) return;

    setResponses({
      ...responses,
      [currentQuestion.fieldName]: currentInput,
    });
    setCurrentInput("");

    if (isLastStep) {
      // Complete the flow
      setTimeout(() => {
        onComplete();
      }, 500);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mt-4">
          {/* Kai avatar */}
          <div className="mb-8 flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-lg opacity-50 animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-lg font-semibold text-white">Kai</div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              {currentQuestion.question}
            </h2>
            <p className="text-slate-400">
              This helps me understand your needs better.
            </p>
          </div>

          {/* Previous responses summary */}
          {currentStep > 0 && (
            <div className="mb-6 space-y-2">
              {Object.entries(responses).map(([key, value], idx) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm text-slate-400"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Input field */}
          <div className="space-y-4">
            <div>
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentQuestion.placeholder}
                className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 text-lg py-6 focus:border-orange-500 focus:ring-orange-500"
                autoFocus
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">
                Press Enter or click Next
              </div>
              <Button
                onClick={handleNext}
                disabled={!currentInput.trim()}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-6 text-lg rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastStep ? "Complete" : "Next"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
