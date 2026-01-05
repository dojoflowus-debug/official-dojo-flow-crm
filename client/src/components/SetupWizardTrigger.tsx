import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import SetupWizardModal from './SetupWizardModal';

interface SetupWizardTriggerProps {
  onWizardComplete?: () => void;
}

export default function SetupWizardTrigger({
  onWizardComplete,
}: SetupWizardTriggerProps) {
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showSnoozeChip, setShowSnoozeChip] = useState(false);

  const checkStatusQuery = trpc.setupWizard.checkOnboardingStatus.useQuery();
  const snoozeSetupMutation = trpc.setupWizard.snoozeSetup.useMutation();

  // Check if setup is needed on mount
  useEffect(() => {
    if (checkStatusQuery.data) {
      const { needsSetup, isCompleted, isSnoozed } = checkStatusQuery.data;

      if (!isCompleted && needsSetup && !isSnoozed) {
        setShowTriggerModal(true);
      } else if (!isCompleted && needsSetup && isSnoozed) {
        setShowSnoozeChip(true);
      }
    }
  }, [checkStatusQuery.data]);

  const handleSetupNow = () => {
    setShowTriggerModal(false);
    setShowWizard(true);
  };

  const handleRemindLater = async () => {
    try {
      await snoozeSetupMutation.mutateAsync({ hours: 24 });
      setShowTriggerModal(false);
      setShowSnoozeChip(true);
    } catch (error) {
      console.error('Failed to snooze setup:', error);
    }
  };

  const handleManualSetup = () => {
    setShowTriggerModal(false);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setShowSnoozeChip(false);
    onWizardComplete?.();
    checkStatusQuery.refetch();
  };

  return (
    <>
      {/* Initial trigger modal */}
      <Dialog open={showTriggerModal} onOpenChange={setShowTriggerModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Want me to set up your dojo now?
            </DialogTitle>
            <DialogDescription>
              I can help you get started in just a few minutes. Let's add your
              programs, schedule, and pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>What we'll set up:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li>✓ Business basics (name, timezone)</li>
              <li>✓ Branding (logo, colors)</li>
              <li>✓ Programs and classes</li>
              <li>✓ Pricing plans</li>
              <li>✓ Staff and locations</li>
            </ul>
          </div>

          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleManualSetup}
            >
              I'll do it manually
            </Button>
            <Button
              variant="outline"
              onClick={handleRemindLater}
            >
              Remind me later
            </Button>
            <Button
              onClick={handleSetupNow}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Yes, set up my dojo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze chip - shown in Kai Command */}
      {showSnoozeChip && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-900 font-medium">
            Finish setup
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSetupNow}
            className="h-6 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            Start
          </Button>
          <button
            onClick={() => setShowSnoozeChip(false)}
            className="ml-auto text-amber-600 hover:text-amber-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full wizard modal */}
      <SetupWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
    </>
  );
}
