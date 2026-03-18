/**
 * useKaiOnboarding — Pure state machine consumer.
 *
 * All validation, correction detection, and step logic lives on the server
 * (kaiOnboardingStateMachine.ts). This hook is responsible only for:
 *   1. Fetching initial onboarding status
 *   2. Injecting the greeting + first question into the chat
 *   3. Routing user text replies to the server's processStep mutation
 *   4. Routing file uploads to the server's uploadLogo mutation
 *   5. Rendering the server's kaiMessage response back into the chat
 *   6. Signalling completion to the parent component
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "../lib/trpc";
import type { OnboardingStep, OnboardingProfile } from "../../../server/kaiOnboardingStateMachine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isOnboarding: boolean;
  step: OnboardingStep | "idle";
  showSkip?: boolean;
  showLogoUpload?: boolean;
  logoUploadType?: "light" | "dark";
}

interface UseKaiOnboardingOptions {
  organizationId: number;
  onInjectMessages: (messages: OnboardingMessage[]) => void;
  onComplete: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useKaiOnboarding({
  organizationId,
  onInjectMessages,
  onComplete,
}: UseKaiOnboardingOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("name");
  const [profile, setProfile] = useState<OnboardingProfile>({
    name: null,
    title: null,
    programs: [],
    styles: [],
    schoolName: null,
    addressStreet: null,
    addressCity: null,
    addressState: null,
    addressPostal: null,
    phone: null,
    email: null,
    website: null,
    logoLightUrl: null,
    logoDarkUrl: null,
  });
  const [hasMartialArts, setHasMartialArts] = useState(false);
  const hasInitialized = useRef(false);
  let msgCounter = useRef(0);

  const msgId = (suffix: string) => `onboarding-${++msgCounter.current}-${suffix}`;

  // ── Status query ────────────────────────────────────────────────────────────
  const statusQuery = trpc.kaiOnboardingSM.getStatus.useQuery(undefined, {
    enabled: organizationId > 0,
    staleTime: 0,
    refetchOnMount: true,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const processStepMutation = trpc.kaiOnboardingSM.processStep.useMutation();
  const uploadLogoMutation = trpc.kaiOnboardingSM.uploadLogo.useMutation();
  const skipOnboardingMutation = trpc.kaiOnboardingSM.skipOnboarding.useMutation();

  // ── Initialize onboarding on first load ────────────────────────────────────
  // NOTE: This hook is DISABLED — the new KaiOnboardingOverlay component handles
  // all onboarding UI. This hook is kept for legacy compatibility but does NOT
  // inject messages into the chat anymore.
  useEffect(() => {
    if (hasInitialized.current) return;
    if (statusQuery.isLoading || !statusQuery.data) return;
    if (organizationId <= 0) return;

    hasInitialized.current = true;
    // Do NOT set isActive = true — the overlay handles everything
    // Do NOT inject messages — the overlay handles everything
  }, [statusQuery.data, statusQuery.isLoading, organizationId]);

  // ── Handle user text reply ──────────────────────────────────────────────────
  const handleUserReply = useCallback(
    async (userText: string): Promise<boolean> => {
      if (!isActive) return false;
      if (currentStep === "complete") return false;

      // Logo steps require file upload — redirect text input
      if (currentStep === "logo_light" || currentStep === "logo_dark") {
        onInjectMessages([
          {
            id: msgId("logo-text-redirect"),
            role: "assistant",
            content: "Please use the **Upload Logo** button below to upload your logo file.",
            isOnboarding: true,
            step: currentStep,
            showLogoUpload: true,
            logoUploadType: currentStep === "logo_light" ? "light" : "dark",
            showSkip: true,
          },
        ]);
        return true;
      }

      try {
        const result = await processStepMutation.mutateAsync({
          currentStep,
          userInput: userText,
          currentProfile: profile,
          hasMartialArts,
        });

        // Update local state
        setProfile(result.profile);
        setCurrentStep(result.nextStep);
        if (result.hasMartialArts !== undefined) {
          setHasMartialArts(result.hasMartialArts);
        }

        // Inject KAI's response
        const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
        onInjectMessages([
          {
            id: msgId(`resp-${result.nextStep}`),
            role: "assistant",
            content: result.kaiMessage,
            isOnboarding: true,
            step: result.nextStep,
            showSkip: result.showSkip,
            showLogoUpload: isLogoStep,
            logoUploadType: result.nextStep === "logo_light" ? "light" : result.nextStep === "logo_dark" ? "dark" : undefined,
          },
        ]);

        if (result.isComplete) {
          setIsActive(false);
          onComplete();
        }

        return true;
      } catch (err) {
        console.error("[KaiOnboarding] processStep error:", err);
        onInjectMessages([
          {
            id: msgId("error"),
            role: "assistant",
            content: "I ran into a brief issue saving that. Could you try again?",
            isOnboarding: true,
            step: currentStep,
            showSkip: false,
          },
        ]);
        return true;
      }
    },
    [isActive, currentStep, profile, hasMartialArts, processStepMutation, onInjectMessages, onComplete]
  );

  // ── Handle logo file upload ─────────────────────────────────────────────────
  const handleLogoUpload = useCallback(
    async (file: File, type: "light" | "dark") => {
      if (!isActive) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        try {
          const result = await uploadLogoMutation.mutateAsync({
            type,
            dataUrl,
            fileName: file.name,
            currentProfile: profile,
            hasMartialArts,
          });

          setProfile(result.profile);
          setCurrentStep(result.nextStep);

          const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
          onInjectMessages([
            {
              id: msgId(`logo-${type}-done`),
              role: "assistant",
              content: result.kaiMessage,
              isOnboarding: true,
              step: result.nextStep,
              showSkip: result.showSkip,
              showLogoUpload: isLogoStep,
              logoUploadType: result.nextStep === "logo_light" ? "light" : result.nextStep === "logo_dark" ? "dark" : undefined,
            },
          ]);

          if (result.isComplete) {
            setIsActive(false);
            onComplete();
          }
        } catch (err) {
          console.error("[KaiOnboarding] uploadLogo error:", err);
          onInjectMessages([
            {
              id: msgId("logo-error"),
              role: "assistant",
              content: "I had trouble saving that logo. Please try again.",
              isOnboarding: true,
              step: currentStep,
              showLogoUpload: true,
              logoUploadType: type,
              showSkip: true,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    },
    [isActive, currentStep, profile, hasMartialArts, uploadLogoMutation, onInjectMessages, onComplete]
  );

  // ── Skip entire onboarding ──────────────────────────────────────────────────
  const skipOnboarding = useCallback(async () => {
    try {
      await skipOnboardingMutation.mutateAsync();
    } catch {}
    setIsActive(false);
    onComplete();
  }, [skipOnboardingMutation, onComplete]);

  return {
    isActive,
    currentStep,
    profile,
    hasMartialArts,
    handleUserReply,
    handleLogoUpload,
    skipOnboarding,
    isProcessing: processStepMutation.isPending || uploadLogoMutation.isPending,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  switch (step) {
    case "name": return "First, **what's your name?**";
    case "title": return `What's your **title**, ${profile.name || ""}? *(e.g., Sensei, Sifu, Coach, Professor, Master, Instructor)*`;
    case "programs": return "What **programs** do you teach? *(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, Gymnastics, Yoga — list as many as you like)*";
    case "rank": return "What is your current **rank or belt**?";
    case "school_name": return "What's the **name of your school or dojo**?";
    case "martial_style": return "What **martial arts style(s)** do you primarily teach?";
    case "address": return "What's your **street address**?";
    case "city_state_zip": return "What's your **city, state, and ZIP code**?";
    case "phone": return "What's your **school phone number**?";
    case "email": return "What's your **school email address**?";
    case "website": return "What's your **school website**?";
    case "logo_light": return "Now let's brand your dashboard. Upload your **Day Mode logo** — used on light backgrounds. PNG or SVG works best.";
    case "logo_dark": return "Upload your **Dark Mode logo** — usually a white or light version of your logo, used on dark backgrounds.";
    default: return "What's your **name**?";
  }
}
