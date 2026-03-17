import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

export type OnboardingStep =
  | "idle"
  | "owner_name"
  | "school_name"
  | "logo_light"
  | "logo_dark"
  | "complete";

export interface OnboardingMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  isOnboarding: true;
  step?: OnboardingStep;
  /** If true, show a file upload button instead of text input */
  expectsFileUpload?: boolean;
  /** If true, show a skip button */
  showSkip?: boolean;
}

interface UseKaiOnboardingOptions {
  organizationId: number;
  /** Called when KAI should inject messages into the chat */
  onInjectMessages: (messages: OnboardingMessage[]) => void;
  /** Called when onboarding is done (complete or skipped) */
  onComplete: () => void;
}

export function useKaiOnboarding({
  organizationId,
  onInjectMessages,
  onComplete,
}: UseKaiOnboardingOptions) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("idle");
  const [isActive, setIsActive] = useState(false);
  const [ownerName, setOwnerName] = useState<string>("");
  // Track which steps still need to be done (managed locally to avoid stale query data)
  const [pendingSteps, setPendingSteps] = useState<OnboardingStep[]>([]);
  const hasInitialized = useRef(false);

  const utils = trpc.useUtils();

  // Query onboarding status
  const statusQuery = trpc.kaiProfileOnboarding.getStatus.useQuery(undefined, {
    enabled: organizationId > 0,
    retry: false,
    staleTime: 60_000,
  });

  // Mutations
  const saveOwnerNameMutation = trpc.kaiProfileOnboarding.saveOwnerName.useMutation();
  const saveSchoolNameMutation = trpc.kaiProfileOnboarding.saveSchoolName.useMutation();
  const saveLogoMutation = trpc.kaiProfileOnboarding.saveLogo.useMutation();
  const completeOnboardingMutation = trpc.kaiProfileOnboarding.completeOnboarding.useMutation();

  // Generate a unique message ID
  const msgId = (suffix: string) => `onboarding-${suffix}-${Date.now()}`;

  // Initialize onboarding when status loads
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!statusQuery.data) return;
    if (!statusQuery.data.needsOnboarding) return;
    if (organizationId <= 0) return;

    hasInitialized.current = true;

    const missingSteps = statusQuery.data.missingSteps as OnboardingStep[];
    setPendingSteps(missingSteps);
    setIsActive(true);

    const firstStep = missingSteps[0];

    // Build greeting + first question
    const messages: OnboardingMessage[] = [
      {
        id: msgId("greeting"),
        role: "assistant",
        content:
          "👋 **Welcome to DojoFlow!** I'm KAI, your AI-powered dojo command center.\n\nBefore you dive in, let me help you set up your school profile in just a few quick steps. This helps personalize your dashboard and gets everything ready for your students and staff.\n\n*(You can skip this and set it up later in Settings if you prefer.)*",
        isOnboarding: true,
        step: "idle",
        showSkip: true,
      },
      buildQuestionMessage(firstStep),
    ];

    onInjectMessages(messages);
    setCurrentStep(firstStep);
  }, [statusQuery.data, organizationId]);

  /** Build the KAI question message for a given step */
  function buildQuestionMessage(step: OnboardingStep): OnboardingMessage {
    switch (step) {
      case "owner_name":
        return {
          id: msgId("q-owner-name"),
          role: "assistant",
          content: "First, **what's your name?** (This is how I'll address you.)",
          isOnboarding: true,
          step: "owner_name",
        };
      case "school_name":
        return {
          id: msgId("q-school-name"),
          role: "assistant",
          content: "What's the **name of your school or dojo?**",
          isOnboarding: true,
          step: "school_name",
        };
      case "logo_light":
        return {
          id: msgId("q-logo-light"),
          role: "assistant",
          content:
            "Now let's brand your dashboard. Upload your **Day Mode logo** (used on light backgrounds). PNG or SVG works best.",
          isOnboarding: true,
          step: "logo_light",
          expectsFileUpload: true,
          showSkip: true,
        };
      case "logo_dark":
        return {
          id: msgId("q-logo-dark"),
          role: "assistant",
          content:
            "Almost done! Upload your **Dark Mode logo** (usually a white or light version of your logo, used on dark backgrounds).",
          isOnboarding: true,
          step: "logo_dark",
          expectsFileUpload: true,
          showSkip: true,
        };
      default:
        return {
          id: msgId("q-unknown"),
          role: "assistant",
          content: "What would you like to set up next?",
          isOnboarding: true,
          step: "idle",
        };
    }
  }

  /** Advance to the next pending step, or finish if none remain */
  const advanceToNextStep = useCallback(
    async (completedStep: OnboardingStep, currentOwnerName: string) => {
      const remaining = pendingSteps.filter((s) => s !== completedStep);
      setPendingSteps(remaining);

      if (remaining.length === 0) {
        await finishOnboarding(currentOwnerName);
      } else {
        const nextStep = remaining[0];
        setCurrentStep(nextStep);
        onInjectMessages([buildQuestionMessage(nextStep)]);
      }
    },
    [pendingSteps, onInjectMessages]
  );

  /**
   * Process a user's text reply during onboarding.
   * Returns true if the message was consumed by onboarding (don't send to AI).
   */
  const handleUserReply = useCallback(
    async (text: string): Promise<boolean> => {
      if (!isActive || currentStep === "idle" || currentStep === "complete") {
        return false;
      }

      const trimmed = text.trim();
      if (!trimmed) return false;

      if (currentStep === "owner_name") {
        setOwnerName(trimmed);
        try {
          await saveOwnerNameMutation.mutateAsync({ name: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save owner name:", e);
        }

        // Acknowledge and advance
        const remaining = pendingSteps.filter((s) => s !== "owner_name");
        setPendingSteps(remaining);

        if (remaining.length === 0) {
          await finishOnboarding(trimmed);
        } else {
          const nextStep = remaining[0];
          setCurrentStep(nextStep);
          onInjectMessages([
            {
              id: msgId("ack-name"),
              role: "assistant",
              content: `Nice to meet you, **${trimmed}**! 🥋`,
              isOnboarding: true,
              step: nextStep,
            },
            buildQuestionMessage(nextStep),
          ]);
        }

        return true;
      }

      if (currentStep === "school_name") {
        try {
          await saveSchoolNameMutation.mutateAsync({ schoolName: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save school name:", e);
        }

        const remaining = pendingSteps.filter((s) => s !== "school_name");
        setPendingSteps(remaining);

        if (remaining.length === 0) {
          await finishOnboarding(ownerName);
        } else {
          const nextStep = remaining[0];
          setCurrentStep(nextStep);
          onInjectMessages([
            {
              id: msgId("ack-school"),
              role: "assistant",
              content: `**${trimmed}** — great name! 🏆`,
              isOnboarding: true,
              step: nextStep,
            },
            buildQuestionMessage(nextStep),
          ]);
        }

        return true;
      }

      // For logo steps, text replies are ignored (they need to use the upload button)
      if (currentStep === "logo_light" || currentStep === "logo_dark") {
        onInjectMessages([
          {
            id: msgId("logo-hint"),
            role: "assistant",
            content:
              "Please use the **Upload Logo** button above to upload your logo image, or click **Skip for now** to continue.",
            isOnboarding: true,
            step: currentStep,
          },
        ]);
        return true;
      }

      return false;
    },
    [isActive, currentStep, pendingSteps, ownerName, onInjectMessages, saveOwnerNameMutation, saveSchoolNameMutation]
  );

  /**
   * Handle logo upload completion during onboarding.
   * Returns true if consumed by onboarding.
   */
  const handleLogoUpload = useCallback(
    async (type: "light" | "dark", url: string): Promise<boolean> => {
      if (!isActive) return false;
      if (type === "light" && currentStep !== "logo_light") return false;
      if (type === "dark" && currentStep !== "logo_dark") return false;

      try {
        await saveLogoMutation.mutateAsync({ type, url });
      } catch (e) {
        console.error("[KaiOnboarding] Failed to save logo:", e);
      }

      const completedStep: OnboardingStep = type === "light" ? "logo_light" : "logo_dark";
      const remaining = pendingSteps.filter((s) => s !== completedStep);
      setPendingSteps(remaining);

      if (remaining.length === 0) {
        await finishOnboarding(ownerName);
      } else {
        const nextStep = remaining[0];
        setCurrentStep(nextStep);
        onInjectMessages([
          {
            id: msgId("ack-logo"),
            role: "assistant",
            content: `✅ Logo saved!`,
            isOnboarding: true,
            step: nextStep,
          },
          buildQuestionMessage(nextStep),
        ]);
      }

      return true;
    },
    [isActive, currentStep, pendingSteps, ownerName, onInjectMessages, saveLogoMutation]
  );

  /**
   * Skip the current logo step.
   */
  const skipLogoStep = useCallback(async () => {
    const completedStep = currentStep as OnboardingStep;
    const remaining = pendingSteps.filter((s) => s !== completedStep);
    setPendingSteps(remaining);

    if (remaining.length === 0) {
      await finishOnboarding(ownerName);
    } else {
      const nextStep = remaining[0];
      setCurrentStep(nextStep);
      onInjectMessages([
        {
          id: msgId("skip-logo"),
          role: "assistant",
          content:
            "No problem! You can add your logo anytime in **Settings → School Profile**.",
          isOnboarding: true,
          step: nextStep,
        },
        buildQuestionMessage(nextStep),
      ]);
    }
  }, [currentStep, pendingSteps, ownerName, onInjectMessages]);

  /**
   * Finish the onboarding flow.
   */
  const finishOnboarding = useCallback(
    async (name: string) => {
      try {
        await completeOnboardingMutation.mutateAsync({ skipped: false });
      } catch (e) {
        console.error("[KaiOnboarding] Failed to complete onboarding:", e);
      }

      const displayName = name || "there";
      onInjectMessages([
        {
          id: msgId("complete"),
          role: "assistant",
          content: `🎉 You're all set, **${displayName}**!\n\nYour school profile is configured. I'm ready to help you manage your dojo — students, leads, attendance, and more.\n\n**What would you like to do first?**`,
          isOnboarding: true,
          step: "complete",
        },
      ]);

      setCurrentStep("complete");
      setIsActive(false);

      // Invalidate queries so the UI reflects the new profile
      utils.kaiProfileOnboarding.getStatus.invalidate();
      utils.schoolProfile.get.invalidate();

      onComplete();
    },
    [onInjectMessages, onComplete, utils, completeOnboardingMutation]
  );

  /**
   * Skip the entire onboarding flow.
   */
  const skipOnboarding = useCallback(async () => {
    try {
      await completeOnboardingMutation.mutateAsync({ skipped: true });
    } catch (e) {
      console.error("[KaiOnboarding] Failed to skip onboarding:", e);
    }

    onInjectMessages([
      {
        id: msgId("skipped"),
        role: "assistant",
        content:
          "No worries! You can set up your school profile anytime in **Settings → School Profile**.\n\nI'm ready to help. What would you like to do?",
        isOnboarding: true,
        step: "complete",
      },
    ]);

    setCurrentStep("complete");
    setIsActive(false);
    utils.kaiProfileOnboarding.getStatus.invalidate();
    onComplete();
  }, [onInjectMessages, onComplete, utils, completeOnboardingMutation]);

  return {
    isActive,
    currentStep,
    isLoading: statusQuery.isLoading,
    handleUserReply,
    handleLogoUpload,
    skipLogoStep,
    skipOnboarding,
  };
}
