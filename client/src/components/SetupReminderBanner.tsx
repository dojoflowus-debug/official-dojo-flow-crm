import { useState } from "react";
import { useLocation } from "wouter";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type NavigateFunction = (path: string) => void;

interface SetupReminderBannerProps {
  onDismiss?: () => void;
}

export function SetupReminderBanner({ onDismiss }: SetupReminderBannerProps) {
  const [, navigate] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleResume = () => {
    navigate?.("/kai-setup");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Setup Incomplete</h3>
            <p className="text-sm text-amber-800 mt-1">
              You skipped the setup wizard. Complete it to unlock all features and get your school fully configured.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-900 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={handleResume}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Resume Setup
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          className="text-amber-700 border-amber-300"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
