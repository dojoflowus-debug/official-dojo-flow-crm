/**
 * useKaiOnboarding — Pure state machine consumer.
 *
 * All validation, correction detection, and step logic lives on the server
 * (kaiOnboardingStateMachine.ts). This hook is responsible only for:
 *   1. Fetching initial onboarding status
 *   2. Injecting the greeting + first question into the chat
 *   3. Routing user text replies to the server's processStep mutation
 *   4. Routing file uploads to the server's uploadLogo / uploadProfilePhoto mutations
 *   5. Rendering the server's kaiMessage response back into the chat
 *   6. Signalling completion to the parent component
 *   7. Invalidating auth.me after name/title steps so the header updates
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
  showPhotoUpload?: boolean;
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
    profilePhotoUrl: null,
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

  // ── tRPC utils for cache invalidation ──────────────────────────────────────
  const utils = trpc.useUtils();

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
  const resetOnboardingMutation = trpc.kaiOnboardingSM.resetOnboarding.useMutation();

  // ── Initialize onboarding on first load ────────────────────────────────────
  // Onboarding happens inside the KAI chat — KAI asks questions conversationally
  // in the main chat feed and the user replies via the normal composer.
  useEffect(() => {
    if (hasInitialized.current) return;
    if (statusQuery.isLoading || !statusQuery.data) return;
    if (organizationId <= 0) return;

    const data = statusQuery.data;

    if (!data.needsOnboarding) {
      hasInitialized.current = true;
      return;
    }

    hasInitialized.current = true;
    setIsActive(true);

    const initialStep = (data.step as OnboardingStep) || "name";
    const initialProfile = (data.profile as OnboardingProfile) || profile;
    const initialHasMartialArts = data.hasMartialArts || false;

    setCurrentStep(initialStep);
    setProfile(initialProfile);
    setHasMartialArts(initialHasMartialArts);

    // Build the greeting + first question
    const firstQuestion = getFirstQuestion(initialStep, initialProfile);
    const isPhotoStep = initialStep === "profile_photo";
    onInjectMessages([
      {
        id: msgId("greeting"),
        role: "assistant",
        content:
          "👋 **Welcome to DojoFlow!** I'm KAI, your AI-powered dojo command center.\n\nBefore you dive in, let me help you set up your school profile — it only takes a minute, and you can update everything later in **Settings → School Profile**.\n\n*(You can skip this and set it up later if you prefer.)*",
        isOnboarding: true,
        step: "idle",
        showSkip: true,
      },
      {
        id: msgId(`q-${initialStep}`),
        role: "assistant",
        content: firstQuestion,
        isOnboarding: true,
        step: initialStep,
        showSkip: initialStep !== "name" && initialStep !== "programs",
        showLogoUpload: initialStep === "logo_light" || initialStep === "logo_dark",
        logoUploadType: initialStep === "logo_light" ? "light" : initialStep === "logo_dark" ? "dark" : undefined,
        showPhotoUpload: isPhotoStep,
      },
    ]);
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

      // Profile photo step — redirect text to skip/upload flow
      if (currentStep === "profile_photo") {
        onInjectMessages([
          {
            id: msgId("photo-text-redirect"),
            role: "assistant",
            content: "Use the **Upload Photo** button below to add your profile picture, or click **Skip** to continue.",
            isOnboarding: true,
            step: currentStep,
            showPhotoUpload: true,
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

        // After name or title step, invalidate auth.me so the header updates
        if (currentStep === "name" || currentStep === "title") {
          try {
            await utils.auth.me.invalidate();
          } catch {}
        }

        // Inject KAI's response
        const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
        const isPhotoStep = result.nextStep === "profile_photo";
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
            showPhotoUpload: isPhotoStep,
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
    [isActive, currentStep, profile, hasMartialArts, processStepMutation, onInjectMessages, onComplete, utils]
  );

  // ── Upload profile picture mutation ───────────────────────────────────────
  const uploadProfilePictureMutation = trpc.auth.uploadProfilePicture.useMutation();

  // ── Resize image to max 800x800 before upload ──────────────────────────────
  const resizeImage = (dataUrl: string, maxSize = 800): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl); // fallback: use original
      img.src = dataUrl;
    });

  // ── Handle profile photo upload ─────────────────────────────────────────────────────
  const handleProfilePhotoUpload = useCallback(
    async (file: File) => {
      if (!isActive) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) return;

        // Resize to max 800x800 and compress to JPEG to stay under 5MB
        const dataUrl = await resizeImage(rawDataUrl, 800);

        try {
          // Upload via auth.uploadProfilePicture (existing endpoint)
          const base64Data = dataUrl.split(',')[1] || dataUrl;
          const mimeType = 'image/jpeg'; // always JPEG after resize
          const result = await uploadProfilePictureMutation.mutateAsync({ imageData: base64Data, mimeType });
          const photoUrl = result?.photoUrl || dataUrl;          // Submit the URL to the state machine as the answer
          const smResult = await processStepMutation.mutateAsync({
            currentStep: "profile_photo",
            userInput: photoUrl,
            currentProfile: { ...profile, profilePhotoUrl: photoUrl },
            hasMartialArts,
          });

          setProfile(smResult.profile);
          setCurrentStep(smResult.nextStep);

          // Invalidate auth.me so avatar updates
          try { await utils.auth.me.invalidate(); } catch {}

          const isLogoStep = smResult.nextStep === "logo_light" || smResult.nextStep === "logo_dark";
          onInjectMessages([
            {
              id: msgId("photo-done"),
              role: "assistant",
              content: smResult.kaiMessage,
              isOnboarding: true,
              step: smResult.nextStep,
              showSkip: smResult.showSkip,
              showLogoUpload: isLogoStep,
              logoUploadType: smResult.nextStep === "logo_light" ? "light" : smResult.nextStep === "logo_dark" ? "dark" : undefined,
            },
          ]);

          if (smResult.isComplete) {
            setIsActive(false);
            onComplete();
          }
        } catch (err) {
          console.error("[KaiOnboarding] profilePhoto upload error:", err);
          onInjectMessages([
            {
              id: msgId("photo-error"),
              role: "assistant",
              content: "I had trouble saving that photo. Please try again or skip for now.",
              isOnboarding: true,
              step: "profile_photo",
              showPhotoUpload: true,
              showSkip: true,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    },
    [isActive, profile, hasMartialArts, processStepMutation, uploadProfilePictureMutation, onInjectMessages, onComplete, utils]
  );

  // ── Skip profile photo ──────────────────────────────────────────────────────
  const skipProfilePhoto = useCallback(async () => {
    if (!isActive) return;
    try {
      const result = await processStepMutation.mutateAsync({
        currentStep: "profile_photo",
        userInput: "skip",
        currentProfile: profile,
        hasMartialArts,
      });
      setProfile(result.profile);
      setCurrentStep(result.nextStep);
      const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
      onInjectMessages([
        {
          id: msgId("photo-skip"),
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
    } catch {}
  }, [isActive, profile, hasMartialArts, processStepMutation, onInjectMessages, onComplete]);

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

    // ── Skip entire onboarding ───────────────────────────────────────────────
  const skipOnboarding = useCallback(async () => {
    try {
      await skipOnboardingMutation.mutateAsync();
    } catch {}
    setIsActive(false);
    onComplete();
  }, [skipOnboardingMutation, onComplete]);

  // ── Restart onboarding from scratch ──────────────────────────────────
  const restartOnboarding = useCallback(async () => {
    try {
      await resetOnboardingMutation.mutateAsync();
    } catch {}
    // Reset local state
    const emptyProfile: OnboardingProfile = {
      name: null, title: null, profilePhotoUrl: null, programs: [], styles: [],
      schoolName: null, addressStreet: null, addressCity: null, addressState: null,
      addressPostal: null, phone: null, email: null, website: null,
      logoLightUrl: null, logoDarkUrl: null,
    };
    setCurrentStep("name");
    setProfile(emptyProfile);
    setHasMartialArts(false);
    setIsActive(true);
    hasInitialized.current = false;
    // Re-inject greeting
    onInjectMessages([
      {
        id: msgId("restart-greeting"),
        role: "assistant",
        content: "👋 **Welcome back!** Let's start your setup from the beginning.\n\n*(You can skip this and set it up later if you prefer.)*",
        isOnboarding: true,
        step: "idle",
        showSkip: true,
      },
      {
        id: msgId("restart-q-name"),
        role: "assistant",
        content: "First, **what's your name?**",
        isOnboarding: true,
        step: "name",
        showSkip: false,
      },
    ]);
  }, [resetOnboardingMutation, onInjectMessages]);;

  return {
    isActive,
    currentStep,
    profile,
    hasMartialArts,
    handleUserReply,
    handleLogoUpload,
    handleProfilePhotoUpload,
    skipProfilePhoto,
    skipOnboarding,
    restartOnboarding,
    isProcessing: processStepMutation.isPending || uploadLogoMutation.isPending,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  switch (step) {
    case "name": return "First, **what's your name?**";
    case "title": return `What's your **title**, ${profile.name || ""}? *(e.g., Sensei, Sifu, Coach, Professor, Master, Instructor)*`;
    case "profile_photo": {
      const titleName = profile.title && profile.name
        ? `${profile.title} ${profile.name}`
        : profile.name || "there";
      return `Great to meet you, **${titleName}**! 📸 Would you like to upload a **profile photo**? It'll appear next to your messages in KAI. *(You can skip this and add one later in Settings)*`;
    }
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
