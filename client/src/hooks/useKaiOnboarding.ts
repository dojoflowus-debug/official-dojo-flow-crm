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
 *   8. Providing goBack() for back navigation
 *   9. Exposing stepNumber/totalSteps for progress bar
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "../lib/trpc";
import type { OnboardingStep, OnboardingProfile } from "@shared/onboarding";
import { getStepQuestion } from "@shared/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isOnboarding: boolean;
  step: OnboardingStep | "idle";
  showSkip?: boolean;
  showBack?: boolean;
  showLogoUpload?: boolean;
  logoUploadType?: "light" | "dark" | "icon-light" | "icon-dark";
  showPhotoUpload?: boolean;
}

interface UseKaiOnboardingOptions {
  organizationId: number;
  onInjectMessages: (messages: OnboardingMessage[]) => void;
  onComplete: () => void;
}

// ─── Empty profile factory ────────────────────────────────────────────────────

function emptyProfile(): OnboardingProfile {
  return {
    name: null,
    title: null,
    profilePhotoUrl: null,
    programs: [],
    styles: [],
    schoolName: null,
    displayName: null,
    tagline: null,
    addressStreet: null,
    addressCity: null,
    addressState: null,
    addressPostal: null,
    addressCountry: null,
    phone: null,
    email: null,
    website: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    logoIconLightUrl: null,
    logoIconDarkUrl: null,
    brandColorPrimary: null,
    brandColorSecondary: null,
    brandColorTertiary: null,
    timezone: null,
    currency: null,
  };
}

// ─── Helper: is this step a logo/file upload step? ────────────────────────────

function isLogoUploadStep(step: OnboardingStep): boolean {
  return step === "logo_light" || step === "logo_dark" || step === "icon_logo_light" || step === "icon_logo_dark";
}

function getLogoUploadType(step: OnboardingStep): "light" | "dark" | "icon-light" | "icon-dark" | undefined {
  if (step === "logo_light") return "light";
  if (step === "logo_dark") return "dark";
  if (step === "icon_logo_light") return "icon-light";
  if (step === "icon_logo_dark") return "icon-dark";
  return undefined;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useKaiOnboarding({
  organizationId,
  onInjectMessages,
  onComplete,
}: UseKaiOnboardingOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("name");
  const [stepNumber, setStepNumber] = useState(1);
  const [totalSteps, setTotalSteps] = useState(22);
  const [profile, setProfile] = useState<OnboardingProfile>(emptyProfile());
  const [hasMartialArts, setHasMartialArts] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const hasInitialized = useRef(false);
  const lastAskedStep = useRef<OnboardingStep | null>(null);
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
  const goBackMutation = trpc.kaiOnboardingSM.goBack.useMutation();

  // ── Initialize onboarding on first load ────────────────────────────────────
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
    const serverProfile = data.profile as Partial<OnboardingProfile> | null;
    const initialProfile: OnboardingProfile = {
      ...emptyProfile(),
      ...(serverProfile || {}),
    };
    const initialHasMartialArts = data.hasMartialArts || false;
    const initStepNumber = data.stepNumber ?? 1;
    const initTotalSteps = data.totalSteps ?? 22;

    setCurrentStep(initialStep);
    setProfile(initialProfile);
    setHasMartialArts(initialHasMartialArts);
    setStepNumber(initStepNumber);
    setTotalSteps(initTotalSteps);
    if (data.completedSteps) setCompletedSteps(data.completedSteps as OnboardingStep[]);

    const isPhotoStep = initialStep === "profile_photo";
    const isLogoStep = isLogoUploadStep(initialStep);
    const isFirstStep = initialStep === "name";

    const firstQuestion = getStepQuestion(initialStep, initialProfile);

    const combinedContent = isFirstStep
      ? firstQuestion
      : `Welcome back — let's pick up where we left off.\n\n${firstQuestion}`;

    onInjectMessages([
      {
        id: msgId(`q-${initialStep}`),
        role: "assistant",
        content: combinedContent,
        isOnboarding: true,
        step: initialStep,
        showSkip: true,
        showBack: !isFirstStep,
        showLogoUpload: isLogoStep,
        logoUploadType: getLogoUploadType(initialStep),
        showPhotoUpload: isPhotoStep,
      },
    ]);
  }, [statusQuery.data, statusQuery.isLoading, organizationId]);

  // ── Handle user text reply ──────────────────────────────────────────────────
  const handleUserReply = useCallback(
    async (userText: string): Promise<boolean> => {
      if (!isActive) return false;
      if (currentStep === "complete") return false;

      try {
        const result = await processStepMutation.mutateAsync({
          currentStep,
          userInput: userText,
          currentProfile: profile,
          hasMartialArts,
          completedSteps,
        });

        // Update local state
        setProfile(result.profile);
        setCurrentStep(result.nextStep);
        if (result.hasMartialArts !== undefined) {
          setHasMartialArts(result.hasMartialArts);
        }
        if ((result as any)._completedStepsToAdd?.length) {
          setCompletedSteps(prev => Array.from(new Set([...prev, ...(result as any)._completedStepsToAdd])));
        }
        if (result.stepNumber !== undefined) setStepNumber(result.stepNumber);
        if (result.totalSteps !== undefined) setTotalSteps(result.totalSteps);

        // After name or title step, invalidate auth.me so the header updates
        if (currentStep === "name" || currentStep === "title") {
          try {
            await utils.auth.me.invalidate();
          } catch {}
        }

        lastAskedStep.current = result.nextStep;

        const nextIsLogoStep = isLogoUploadStep(result.nextStep);
        const nextIsPhotoStep = result.nextStep === "profile_photo";
        const currentIsLogoStep = isLogoUploadStep(currentStep);
        const currentIsPhotoStep = currentStep === "profile_photo";

        const showLogoUpload = nextIsLogoStep || (result.expectsFileUpload && currentIsLogoStep);
        const showPhotoUpload = nextIsPhotoStep || (result.expectsFileUpload && currentIsPhotoStep);

        const logoType = getLogoUploadType(result.nextStep) || getLogoUploadType(currentStep);

        onInjectMessages([
          {
            id: msgId(`resp-${result.nextStep}`),
            role: "assistant",
            content: result.kaiMessage,
            isOnboarding: true,
            step: result.nextStep,
            showSkip: result.showSkip,
            showBack: result.showBack,
            showLogoUpload,
            logoUploadType: logoType,
            showPhotoUpload,
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
            content: "I encountered a brief system error. Please try again.",
            isOnboarding: true,
            step: currentStep,
            showSkip: false,
            showBack: false,
          },
        ]);
        return true;
      }
    },
    [isActive, currentStep, profile, hasMartialArts, completedSteps, processStepMutation, onInjectMessages, onComplete, utils]
  );

  // ── Go back to previous step ─────────────────────────────────────────────────
  const handleGoBack = useCallback(async () => {
    if (!isActive) return;
    try {
      const result = await goBackMutation.mutateAsync({
        currentStep,
        currentProfile: profile,
        hasMartialArts,
        completedSteps,
      });

      setCurrentStep(result.nextStep);
      setProfile(result.profile);
      if (result.hasMartialArts !== undefined) setHasMartialArts(result.hasMartialArts);
      if (result.stepNumber !== undefined) setStepNumber(result.stepNumber);
      if (result.totalSteps !== undefined) setTotalSteps(result.totalSteps);
      lastAskedStep.current = result.nextStep;

      const isLogoStep = isLogoUploadStep(result.nextStep);
      const isPhotoStep = result.nextStep === "profile_photo";

      onInjectMessages([
        {
          id: msgId(`back-${result.nextStep}`),
          role: "assistant",
          content: result.kaiMessage,
          isOnboarding: true,
          step: result.nextStep,
          showSkip: result.showSkip,
          showBack: result.showBack,
          showLogoUpload: isLogoStep,
          logoUploadType: getLogoUploadType(result.nextStep),
          showPhotoUpload: isPhotoStep,
        },
      ]);
    } catch (err) {
      console.error("[KaiOnboarding] goBack error:", err);
    }
  }, [isActive, currentStep, profile, hasMartialArts, completedSteps, goBackMutation, onInjectMessages]);

  // ── Upload profile picture mutation ───────────────────────────────────────
  const uploadProfilePictureMutation = trpc.auth.uploadProfilePicture.useMutation();

  // ── Resize image to max 800x800 before upload ──────────────────────────────
  const resizeImage = (dataUrl: string, maxSize = 800): Promise<{ dataUrl: string; mimeType: string }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl: resized, mimeType: 'image/jpeg' });
      };
      img.onerror = () => resolve({ dataUrl, mimeType: 'image/jpeg' });
      img.src = dataUrl;
    });

  // ── Handle profile photo upload ─────────────────────────────────────────────
  const handleProfilePhotoUpload = useCallback(
    async (file: File) => {
      if (!isActive) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) return;

        const { dataUrl, mimeType } = await resizeImage(rawDataUrl, 800);

        try {
          const base64Data = dataUrl.split(',')[1] || dataUrl;
          const result = await uploadProfilePictureMutation.mutateAsync({ imageData: base64Data, mimeType });
          const photoUrl = result?.photoUrl || dataUrl;

          const smResult = await processStepMutation.mutateAsync({
            currentStep: "profile_photo",
            userInput: photoUrl,
            currentProfile: { ...profile, profilePhotoUrl: photoUrl },
            hasMartialArts,
            completedSteps,
          });

          setProfile(smResult.profile);
          setCurrentStep(smResult.nextStep);
          if (smResult.stepNumber !== undefined) setStepNumber(smResult.stepNumber);
          if (smResult.totalSteps !== undefined) setTotalSteps(smResult.totalSteps);

          try { await utils.auth.me.invalidate(); } catch {}

          const isLogoStep = isLogoUploadStep(smResult.nextStep);
          onInjectMessages([
            {
              id: msgId("photo-done"),
              role: "assistant",
              content: smResult.kaiMessage,
              isOnboarding: true,
              step: smResult.nextStep,
              showSkip: smResult.showSkip,
              showBack: smResult.showBack,
              showLogoUpload: isLogoStep,
              logoUploadType: getLogoUploadType(smResult.nextStep),
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
              content: "Photo upload failed. Please try again or skip for now.",
              isOnboarding: true,
              step: "profile_photo",
              showPhotoUpload: true,
              showSkip: true,
              showBack: true,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    },
    [isActive, profile, hasMartialArts, completedSteps, processStepMutation, uploadProfilePictureMutation, onInjectMessages, onComplete, utils]
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
        completedSteps,
      });
      setProfile(result.profile);
      setCurrentStep(result.nextStep);
      if (result.stepNumber !== undefined) setStepNumber(result.stepNumber);
      if (result.totalSteps !== undefined) setTotalSteps(result.totalSteps);

      const isLogoStep = isLogoUploadStep(result.nextStep);
      onInjectMessages([
        {
          id: msgId("photo-skip"),
          role: "assistant",
          content: result.kaiMessage,
          isOnboarding: true,
          step: result.nextStep,
          showSkip: result.showSkip,
          showBack: result.showBack,
          showLogoUpload: isLogoStep,
          logoUploadType: getLogoUploadType(result.nextStep),
        },
      ]);
      if (result.isComplete) {
        setIsActive(false);
        onComplete();
      }
    } catch {}
  }, [isActive, profile, hasMartialArts, completedSteps, processStepMutation, onInjectMessages, onComplete]);

  // ── Handle logo file upload ─────────────────────────────────────────────────
  const handleLogoUpload = useCallback(
    async (file: File, type: "light" | "dark" | "icon-light" | "icon-dark") => {
      if (!isActive) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        // Strip any base64 logo data from the profile before sending to server
        // to avoid inflating the request payload with large data URLs
        const safeProfile = {
          ...profile,
          logoLightUrl: profile.logoLightUrl?.startsWith('data:') ? null : profile.logoLightUrl,
          logoDarkUrl: profile.logoDarkUrl?.startsWith('data:') ? null : profile.logoDarkUrl,
          logoIconLightUrl: profile.logoIconLightUrl?.startsWith('data:') ? null : profile.logoIconLightUrl,
          logoIconDarkUrl: profile.logoIconDarkUrl?.startsWith('data:') ? null : profile.logoIconDarkUrl,
        };

        try {
          const result = await uploadLogoMutation.mutateAsync({
            type,
            dataUrl,
            fileName: file.name,
            currentProfile: safeProfile,
            hasMartialArts,
            completedSteps,
          });

          setProfile(result.profile);
          setCurrentStep(result.nextStep);
          if (result.stepNumber !== undefined) setStepNumber(result.stepNumber);
          if (result.totalSteps !== undefined) setTotalSteps(result.totalSteps);

          const isLogoStep = isLogoUploadStep(result.nextStep);
          onInjectMessages([
            {
              id: msgId(`logo-${type}-done`),
              role: "assistant",
              content: result.kaiMessage,
              isOnboarding: true,
              step: result.nextStep,
              showSkip: result.showSkip,
              showBack: result.showBack,
              showLogoUpload: isLogoStep,
              logoUploadType: getLogoUploadType(result.nextStep),
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
              content: "That file didn't come through — make sure it's a PNG or SVG under 5MB, then tap Upload Logo to try again.",
              isOnboarding: true,
              step: currentStep,
              showLogoUpload: true,
              logoUploadType: type,
              showSkip: true,
              showBack: true,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    },
    [isActive, currentStep, profile, hasMartialArts, completedSteps, uploadLogoMutation, onInjectMessages, onComplete]
  );

  // ── Skip entire onboarding ───────────────────────────────────────────────
  const skipOnboarding = useCallback(async () => {
    try {
      await skipOnboardingMutation.mutateAsync();
    } catch {}
    setIsActive(false);
    onComplete();
  }, [skipOnboardingMutation, onComplete]);

  // ── Restart onboarding from scratch ──────────────────────────────
  const restartOnboarding = useCallback(async () => {
    try {
      await resetOnboardingMutation.mutateAsync();
    } catch {}
    const fresh = emptyProfile();
    setCurrentStep("name");
    setProfile(fresh);
    setHasMartialArts(false);
    setStepNumber(1);
    setTotalSteps(22);
    setCompletedSteps([]);
    setIsActive(true);
    hasInitialized.current = false;
    onInjectMessages([
      {
        id: msgId("restart-q-name"),
        role: "assistant",
        content: `No problem — let's start fresh.\n\n**What's your name?**`,
        isOnboarding: true,
        step: "name",
        showSkip: false,
        showBack: false,
      },
    ]);
  }, [resetOnboardingMutation, onInjectMessages]);

  return {
    isActive,
    currentStep,
    stepNumber,
    totalSteps,
    profile,
    hasMartialArts,
    handleUserReply,
    handleLogoUpload,
    handleProfilePhotoUpload,
    skipProfilePhoto,
    skipOnboarding,
    restartOnboarding,
    handleGoBack,
    isProcessing: processStepMutation.isPending || uploadLogoMutation.isPending || goBackMutation.isPending,
  };
}
