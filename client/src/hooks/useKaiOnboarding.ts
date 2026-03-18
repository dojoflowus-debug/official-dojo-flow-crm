import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

export type OnboardingStep =
  | "idle"
  | "owner_name"
  | "owner_title"
  | "programs_taught"
  | "owner_rank"
  | "school_name"
  | "martial_arts_style"
  | "address"
  | "city_state_zip"
  | "phone"
  | "email"
  | "website"
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
  /** The onboarding step this message belongs to (for file input ref) */
  onboardingStep?: OnboardingStep;
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
  const [ownerTitle, setOwnerTitle] = useState<string>("");
  const [programsTaught, setProgramsTaught] = useState<string>("");
  const [pendingSteps, setPendingSteps] = useState<OnboardingStep[]>([]);
  const hasInitialized = useRef(false);

  const utils = trpc.useUtils();

  // Query onboarding status — always fetch fresh on mount (staleTime: 0)
  const statusQuery = trpc.kaiProfileOnboarding.getStatus.useQuery(undefined, {
    enabled: organizationId > 0,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Mutations
  const saveOwnerNameMutation = trpc.kaiProfileOnboarding.saveOwnerName.useMutation();
  const saveSchoolNameMutation = trpc.kaiProfileOnboarding.saveSchoolName.useMutation();
  const saveProfileFieldMutation = trpc.kaiProfileOnboarding.saveProfileField.useMutation();
  const completeOnboardingMutation = trpc.kaiProfileOnboarding.completeOnboarding.useMutation();

  // Generate a unique message ID
  const msgId = (suffix: string) => `onboarding-${suffix}-${Date.now()}`;

  // Initialize onboarding when status loads
  useEffect(() => {
    if (hasInitialized.current) return;
    if (statusQuery.isLoading) return;
    if (!statusQuery.data) return;
    if (organizationId <= 0) return;

    // If onboarding is already completed and nothing critical is missing, don't show
    if (!statusQuery.data.needsOnboarding) {
      hasInitialized.current = true;
      return;
    }

    hasInitialized.current = true;

    const missingSteps = statusQuery.data.missingSteps as OnboardingStep[];
    if (missingSteps.length === 0) return;

    setPendingSteps(missingSteps);
    setIsActive(true);

    const firstStep = missingSteps[0];

    // Build greeting + first question
    const messages: OnboardingMessage[] = [
      {
        id: msgId("greeting"),
        role: "assistant",
        content:
          "👋 **Welcome to DojoFlow!** I'm KAI, your AI-powered dojo command center.\n\nBefore you dive in, let me help you set up your school profile — it only takes a minute, and you can update everything later in **Settings → School Profile**.\n\n*(You can skip this and set it up later if you prefer.)*",
        isOnboarding: true,
        step: "idle",
        showSkip: true,
      },
      buildQuestionMessage(firstStep),
    ];

    onInjectMessages(messages);
    setCurrentStep(firstStep);
  }, [statusQuery.data, statusQuery.isLoading, organizationId]);

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
      case "owner_title":
        return {
          id: msgId("q-owner-title"),
          role: "assistant",
          content:
            "What's your **title**? *(e.g., Sensei, Sifu, Coach, Professor, Master, Instructor — or type your own)*",
          isOnboarding: true,
          step: "owner_title",
          showSkip: true,
        };
      case "programs_taught":
        return {
          id: msgId("q-programs"),
          role: "assistant",
          content:
            "What **programs do you teach**? *(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, MMA, Gymnastics, Yoga — list as many as you like)*",
          isOnboarding: true,
          step: "programs_taught",
          showSkip: true,
        };
      case "owner_rank":
        return {
          id: msgId("q-rank"),
          role: "assistant",
          content:
            "What is your **current rank or belt**? *(e.g., Black Belt 3rd Degree, Purple Belt, 10th Dan — or skip if not applicable)*",
          isOnboarding: true,
          step: "owner_rank",
          showSkip: true,
        };
      case "school_name":
        return {
          id: msgId("q-school-name"),
          role: "assistant",
          content: "What's the **name of your school or dojo?**",
          isOnboarding: true,
          step: "school_name",
        };
      case "martial_arts_style":
        return {
          id: msgId("q-style"),
          role: "assistant",
          content:
            "What **martial arts style(s)** do you teach? *(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, MMA, Judo — or type your own)*",
          isOnboarding: true,
          step: "martial_arts_style",
          showSkip: true,
        };
      case "address":
        return {
          id: msgId("q-address"),
          role: "assistant",
          content:
            "What's your **school's street address?** *(e.g., 123 Main Street)*",
          isOnboarding: true,
          step: "address",
          showSkip: true,
        };
      case "city_state_zip":
        return {
          id: msgId("q-city-state-zip"),
          role: "assistant",
          content:
            "What's your **city, state, and ZIP code?** *(e.g., Miami, FL 33101)*",
          isOnboarding: true,
          step: "city_state_zip",
          showSkip: true,
        };
      case "phone":
        return {
          id: msgId("q-phone"),
          role: "assistant",
          content:
            "What's your **school's phone number?** *(e.g., (305) 555-1234)*",
          isOnboarding: true,
          step: "phone",
          showSkip: true,
        };
      case "email":
        return {
          id: msgId("q-email"),
          role: "assistant",
          content:
            "What's your **school's contact email?** *(e.g., info@mydojo.com)*",
          isOnboarding: true,
          step: "email",
          showSkip: true,
        };
      case "website":
        return {
          id: msgId("q-website"),
          role: "assistant",
          content:
            "Do you have a **website**? *(e.g., https://mydojo.com — or skip if you don't have one yet)*",
          isOnboarding: true,
          step: "website",
          showSkip: true,
        };
      case "logo_light":
        return {
          id: msgId("q-logo-light"),
          role: "assistant",
          content:
            "Now let's brand your dashboard. Upload your **Day Mode logo** (used on light backgrounds). PNG or SVG works best.",
          isOnboarding: true,
          step: "logo_light",
          onboardingStep: "logo_light",
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
          onboardingStep: "logo_dark",
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
    async (completedStep: OnboardingStep, currentOwnerName: string, ackMessage?: string) => {
      const remaining = pendingSteps.filter((s) => s !== completedStep);
      setPendingSteps(remaining);

      if (remaining.length === 0) {
        await finishOnboarding(currentOwnerName);
      } else {
        const nextStep = remaining[0];
        setCurrentStep(nextStep);
        const msgs: OnboardingMessage[] = [];
        if (ackMessage) {
          msgs.push({
            id: msgId("ack"),
            role: "assistant",
            content: ackMessage,
            isOnboarding: true,
            step: nextStep,
          });
        }
        msgs.push(buildQuestionMessage(nextStep));
        onInjectMessages(msgs);
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
        await advanceToNextStep("owner_name", trimmed, `Nice to meet you, **${trimmed}**! 🥋`);
        return true;
      }

      if (currentStep === "owner_title") {
        setOwnerTitle(trimmed);
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "ownerTitle", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save owner title:", e);
        }
        const titleName = ownerName ? `${trimmed} ${ownerName}` : trimmed;
        await advanceToNextStep("owner_title", ownerName, `Got it — I'll address you as **${titleName}**. 🎖️`);
        return true;
      }

      if (currentStep === "programs_taught") {
        setProgramsTaught(trimmed);
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "programsTaught", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save programs:", e);
        }

        // Check if any martial arts program was mentioned — if so, insert owner_rank step next
        const martialArtsKeywords = [
          "jiu-jitsu", "jiujitsu", "bjj", "muay thai", "karate", "mma", "judo",
          "taekwondo", "kung fu", "boxing", "kickboxing", "wrestling", "hapkido",
          "aikido", "krav maga", "capoeira", "sambo", "wushu", "ninjutsu",
          "martial art", "combat", "self-defense", "self defense",
        ];
        const lowerText = trimmed.toLowerCase();
        const hasMartialArts = martialArtsKeywords.some((kw) => lowerText.includes(kw));

        if (hasMartialArts) {
          // Insert owner_rank step right after programs_taught
          const remaining = pendingSteps.filter((s) => s !== "programs_taught");
          const rankAlreadyPending = remaining.includes("owner_rank");
          const newPending = rankAlreadyPending
            ? remaining
            : ["owner_rank" as OnboardingStep, ...remaining];
          setPendingSteps(newPending);

          const nextStep = newPending[0];
          setCurrentStep(nextStep);
          onInjectMessages([
            {
              id: msgId("ack-programs"),
              role: "assistant",
              content: `Great programs! 🥊 Since you teach martial arts, one more question:`,
              isOnboarding: true,
              step: nextStep,
            },
            buildQuestionMessage(nextStep),
          ]);
        } else {
          await advanceToNextStep("programs_taught", ownerName, `Awesome! 🏆 Those are great programs.`);
        }
        return true;
      }

      if (currentStep === "owner_rank") {
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "ownerRank", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save owner rank:", e);
        }
        await advanceToNextStep("owner_rank", ownerName, `Impressive — **${trimmed}**! 🏅`);
        return true;
      }

      if (currentStep === "school_name") {
        try {
          await saveSchoolNameMutation.mutateAsync({ schoolName: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save school name:", e);
        }
        await advanceToNextStep("school_name", ownerName, `**${trimmed}** — great name! 🏆`);
        return true;
      }

      if (currentStep === "martial_arts_style") {
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "martialArtsStyle", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save martial arts style:", e);
        }
        await advanceToNextStep("martial_arts_style", ownerName, `Got it — **${trimmed}**. 🥊`);
        return true;
      }

      if (currentStep === "address") {
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "addressStreet", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save address:", e);
        }
        await advanceToNextStep("address", ownerName, `📍 Address saved.`);
        return true;
      }

      if (currentStep === "city_state_zip") {
        // Parse "Miami, FL 33101" format
        try {
          const parts = trimmed.split(",");
          const city = parts[0]?.trim() || trimmed;
          const stateZip = (parts[1] || "").trim().split(/\s+/);
          const state = stateZip[0] || "";
          const zip = stateZip[1] || "";
          await saveProfileFieldMutation.mutateAsync({
            field: "cityStateZip",
            value: JSON.stringify({ city, state, zip }),
          });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save city/state/zip:", e);
        }
        await advanceToNextStep("city_state_zip", ownerName, `📍 Location saved.`);
        return true;
      }

      if (currentStep === "phone") {
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "phone", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save phone:", e);
        }
        await advanceToNextStep("phone", ownerName, `📞 Phone saved.`);
        return true;
      }

      if (currentStep === "email") {
        try {
          await saveProfileFieldMutation.mutateAsync({ field: "email", value: trimmed });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save email:", e);
        }
        await advanceToNextStep("email", ownerName, `📧 Email saved.`);
        return true;
      }

      if (currentStep === "website") {
        try {
          let url = trimmed;
          if (url && !url.startsWith("http")) url = "https://" + url;
          await saveProfileFieldMutation.mutateAsync({ field: "website", value: url });
        } catch (e) {
          console.error("[KaiOnboarding] Failed to save website:", e);
        }
        await advanceToNextStep("website", ownerName, `🌐 Website saved.`);
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
    [isActive, currentStep, pendingSteps, ownerName, ownerTitle, programsTaught, onInjectMessages, saveOwnerNameMutation, saveSchoolNameMutation, saveProfileFieldMutation, advanceToNextStep]
  );

  /**
   * Handle logo upload completion during onboarding.
   * Called after uploadLogo mutation has already saved the data to the DB.
   * Returns true if consumed by onboarding.
   */
  const handleLogoUpload = useCallback(
    async (type: "light" | "dark", _url: string): Promise<boolean> => {
      if (!isActive) return false;
      if (type === "light" && currentStep !== "logo_light") return false;
      if (type === "dark" && currentStep !== "logo_dark") return false;

      const completedStep: OnboardingStep = type === "light" ? "logo_light" : "logo_dark";
      await advanceToNextStep(completedStep, ownerName, `✅ Logo saved!`);
      return true;
    },
    [isActive, currentStep, pendingSteps, ownerName, advanceToNextStep]
  );

  /**
   * Skip the current step (for optional steps).
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
          id: msgId("skip"),
          role: "assistant",
          content:
            "No problem! You can add this anytime in **Settings → School Profile**.",
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

      // Build personalized closing message using title if available
      const titleStr = ownerTitle ? `${ownerTitle} ` : "";
      const displayName = name ? `${titleStr}${name}` : "there";

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
    [onInjectMessages, onComplete, utils, completeOnboardingMutation, ownerTitle]
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
