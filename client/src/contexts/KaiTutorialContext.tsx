/**
 * KaiTutorialContext — Kai Contextual Training System
 *
 * Production spec implementation:
 *
 * 1. Module detection via window.location.pathname
 * 2. Global Kai state: mode ("idle" | "guide" | "assist"), context, step, tutorialCompleted
 * 3. Auto-trigger tutorial on first visit (DB-persisted)
 * 4. Toolbar command parser: "add student" → executeAction("create_student")
 * 5. Action engine: executeAction() → startStudentTutorial() etc.
 * 6. Student tutorial flow: highlight → waitForClick → highlight form → waitForSubmit → complete
 * 7. Visual guidance: highlight(), pulse(), arrow(), tooltip() DOM utilities
 * 8. Personality engine: randomized response pools (start, success, encourage)
 * 9. Completion handler: marks DB, fires completion message
 * 10. Ghost mode: 15s inactivity → Kai.suggest()
 * 11. UX rules: always skippable, always resumable, no blocking flows
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  TUTORIAL_REGISTRY,
  detectModule,
  parseSmartCommand,
  type TutorialModule,
  type TutorialStep,
  type TutorialDefinition,
} from "../../../shared/tutorialRegistry";
import type { SpotlightTarget } from "@/components/SpotlightOverlay";
import {
  highlight,
  pulse,
  arrow,
  clearGuidance,
  waitForClick,
  waitForSubmit,
} from "@/lib/kaiTutorialUtils";

// ─── Kai State Engine (spec §2) ───────────────────────────────────────────────

export type KaiMode = "idle" | "guide" | "assist";

// ─── Personality Response Pool (spec §9) ─────────────────────────────────────

const KAI_RESPONSES = {
  start: [
    "Let's get this set up — I've got you.",
    "This part is quick. We'll knock it out in seconds.",
    "Alright, let's do this. Follow my lead.",
    "Let's get your first one in. Takes about 10 seconds.",
  ],
  success: [
    "Nice. That's done.",
    "Perfect — locked in.",
    "You're moving fast.",
    "Solid. Let's keep going.",
  ],
  encourage: [
    "Almost there — one more step.",
    "You're doing great. Keep going.",
    "Nearly done. This is the last bit.",
  ],
  suggest: [
    "Need a hand with this? I can walk you through it.",
    "Looks like you might be stuck — want me to guide you?",
    "I can show you how this works. Just say the word.",
  ],
};

function randomFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Ghost Mode Config (spec §11) ────────────────────────────────────────────

const GHOST_IDLE_MS = 15000; // 15 seconds per spec

const GHOST_MESSAGES: Record<TutorialModule, string> = {
  students: "Need help adding a student? I can walk you through it in 30 seconds.",
  leads: "Want me to show you how the pipeline works? Takes about a minute.",
  classes: "Need help setting up your class schedule? I've got you.",
  billing: "Not sure where to start with billing? Let me walk you through it.",
  kiosk: "Want to set up your check-in kiosk? I'll make it quick.",
};

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface KaiTutorialContextType {
  activeModule: TutorialModule | null;
  kaiMode: KaiMode;
  isRunning: boolean;
  currentStepIndex: number;
  totalSteps: number;
  spotlightTarget: SpotlightTarget | null;
  pendingKaiMessage: string | null;
  ghostModeOffer: { module: TutorialModule; message: string } | null;
  startTutorial: (module: TutorialModule) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  consumeKaiMessage: () => void;
  dismissGhostOffer: () => void;
  acceptGhostOffer: () => void;
  handleToolbarCommand: (input: string) => boolean;
  isModuleCompleted: (module: TutorialModule) => boolean;
  currentTutorial: TutorialDefinition | null;
  currentStep: TutorialStep | null;
}

const KaiTutorialContext = createContext<KaiTutorialContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function KaiTutorialProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  // Kai state engine (spec §2)
  const [kaiMode, setKaiMode] = useState<KaiMode>("idle");
  const [activeModule, setActiveModule] = useState<TutorialModule | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget | null>(null);
  const [pendingKaiMessage, setPendingKaiMessage] = useState<string | null>(null);
  const [ghostModeOffer, setGhostModeOffer] = useState<{
    module: TutorialModule;
    message: string;
  } | null>(null);
  const [completedModules, setCompletedModules] = useState<
    Partial<Record<TutorialModule, boolean>>
  >({});

  // Refs for cleanup
  const ghostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghostOfferedRef = useRef<Set<TutorialModule>>(new Set());
  const stepCleanupRef = useRef<(() => void)[]>([]);
  const isRunningRef = useRef(false);

  // tRPC
  const tutorialStatus = trpc.tutorial.getStatus.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
  const markComplete = trpc.tutorial.markComplete.useMutation();
  const saveProgress = trpc.tutorial.saveProgress.useMutation();

  // Sync completed modules from DB
  useEffect(() => {
    if (tutorialStatus.data?.completed) {
      setCompletedModules(tutorialStatus.data.completed);
    }
  }, [tutorialStatus.data]);

  // Keep ref in sync
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // ── Cleanup helper ───────────────────────────────────────────────────────────

  const cleanupStep = useCallback(() => {
    stepCleanupRef.current.forEach((fn) => fn());
    stepCleanupRef.current = [];
    clearGuidance();
  }, []);

  // ── Route detection (spec §1) ────────────────────────────────────────────────

  useEffect(() => {
    const mod = detectModule(location);
    if (mod !== activeModule) {
      if (isRunningRef.current) {
        cleanupStep();
        setIsRunning(false);
        setSpotlightTarget(null);
        setPendingKaiMessage(null);
        setKaiMode("idle");
      }
      setActiveModule(mod);
      setGhostModeOffer(null);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-launch on first visit (spec §3) ─────────────────────────────────────

  useEffect(() => {
    if (!activeModule) return;
    if (isRunningRef.current) return;
    if (completedModules[activeModule]) return;
    if (!tutorialStatus.isFetched) return;

    const t = setTimeout(() => {
      startTutorial(activeModule);
    }, 1500);
    return () => clearTimeout(t);
  }, [activeModule, tutorialStatus.isFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ghost mode: 15s inactivity (spec §11) ────────────────────────────────────

  useEffect(() => {
    if (!activeModule || isRunning || completedModules[activeModule]) return;

    const resetTimer = () => {
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = setTimeout(() => {
        if (
          !isRunningRef.current &&
          activeModule &&
          !ghostOfferedRef.current.has(activeModule)
        ) {
          ghostOfferedRef.current.add(activeModule);
          setGhostModeOffer({
            module: activeModule,
            message: GHOST_MESSAGES[activeModule],
          });
        }
      }, GHOST_IDLE_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    };
  }, [activeModule, isRunning, completedModules]);

  // ── Step renderer ────────────────────────────────────────────────────────────

  const renderStep = useCallback(
    (tutorial: TutorialDefinition, stepIdx: number) => {
      cleanupStep();

      const step = tutorial.steps[stepIdx];
      if (!step) return;

      const isLast = stepIdx === tutorial.steps.length - 1;

      // Choose personality message
      const isFirst = stepIdx === 0;
      const kaiMsg = isFirst
        ? step.kaiMessage
        : isLast
        ? `${randomFrom(KAI_RESPONSES.encourage)} ${step.kaiMessage}`
        : step.kaiMessage;

      // Update spotlight overlay
      setSpotlightTarget({
        selector: step.targetSelector,
        message: kaiMsg,
        stepLabel: step.label,
        stepIndex: stepIdx,
        totalSteps: tutorial.steps.length,
        tooltipPosition: step.tooltipPosition ?? "bottom",
        showNext: true,
        showSkip: true,
        onNext: () => nextStep(),
        onSkip: () => skipTutorial(),
      });

      // Inject Kai message into chat
      setPendingKaiMessage(kaiMsg);

      // DOM visual guidance
      if (step.targetSelector) {
        const cleanH = highlight(step.targetSelector);
        const cleanP = pulse(step.targetSelector);
        const cleanA = arrow(step.targetSelector, "above");
        stepCleanupRef.current.push(cleanH, cleanP, cleanA);

        // Auto-click if configured
        if (step.autoClick) {
          setTimeout(() => {
            const el = document.querySelector(step.targetSelector!) as HTMLElement | null;
            el?.click();
          }, 800);
        }

        // waitForClick: auto-advance when user clicks the target (spec §6)
        const cleanClick = waitForClick(step.targetSelector, () => {
          if (isRunningRef.current) {
            setTimeout(() => {
              setPendingKaiMessage(randomFrom(KAI_RESPONSES.success));
              setTimeout(() => nextStep(), 600);
            }, 200);
          }
        });
        stepCleanupRef.current.push(cleanClick);
      }

      // waitForSubmit: auto-advance when a form is submitted (spec §6)
      if (step.action === "submit_student") {
        const cleanSubmit = waitForSubmit("[data-tutorial-id='student-form']", () => {
          if (isRunningRef.current) {
            setPendingKaiMessage(randomFrom(KAI_RESPONSES.success));
            setTimeout(() => completeTutorialFn(tutorial), 800);
          }
        });
        stepCleanupRef.current.push(cleanSubmit);
      }

      if (step.action === "submit_lead") {
        const cleanSubmit = waitForSubmit("[data-tutorial-id='lead-form']", () => {
          if (isRunningRef.current) {
            setPendingKaiMessage(randomFrom(KAI_RESPONSES.success));
            setTimeout(() => completeTutorialFn(tutorial), 800);
          }
        });
        stepCleanupRef.current.push(cleanSubmit);
      }

      if (step.action === "submit_class") {
        const cleanSubmit = waitForSubmit("[data-tutorial-id='class-form']", () => {
          if (isRunningRef.current) {
            setPendingKaiMessage(randomFrom(KAI_RESPONSES.success));
            setTimeout(() => completeTutorialFn(tutorial), 800);
          }
        });
        stepCleanupRef.current.push(cleanSubmit);
      }

      // Save progress
      saveProgress.mutate({ module: tutorial.module, stepId: step.id });

      if (isLast) {
        setTimeout(() => completeTutorialFn(tutorial), 2500);
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Completion handler (spec §10) ────────────────────────────────────────────

  const completeTutorialFn = useCallback(
    (tutorial: TutorialDefinition) => {
      cleanupStep();
      setIsRunning(false);
      setSpotlightTarget(null);
      setCurrentStepIndex(0);
      setKaiMode("idle");
      setCompletedModules((prev) => ({ ...prev, [tutorial.module]: true }));
      // Spec §10: "Done. Your dojo is operational. Want to move on to leads or classes?"
      setPendingKaiMessage(tutorial.completionMessage);
      markComplete.mutate({ module: tutorial.module });
    },
    [cleanupStep, markComplete]
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  // Action engine (spec §5)
  const executeAction = useCallback(
    (action: string, module: TutorialModule) => {
      const tutorial = TUTORIAL_REGISTRY[module];
      if (!tutorial) return;
      const stepIdx = tutorial.steps.findIndex((s) => s.action === action);
      const targetIdx = stepIdx === -1 ? 0 : stepIdx;

      setActiveModule(module);
      setIsRunning(true);
      isRunningRef.current = true;
      setCurrentStepIndex(targetIdx);
      setKaiMode("guide");
      setGhostModeOffer(null);
      setPendingKaiMessage(
        `Got it — let me show you how to ${action.replace(/_/g, " ")}.`
      );
      setTimeout(() => renderStep(tutorial, targetIdx), 600);
    },
    [renderStep]
  );

  // startTutorial (spec §3)
  const startTutorial = useCallback(
    (module: TutorialModule) => {
      const tutorial = TUTORIAL_REGISTRY[module];
      if (!tutorial) return;
      setActiveModule(module);
      setIsRunning(true);
      isRunningRef.current = true;
      setCurrentStepIndex(0);
      setKaiMode("guide");
      setGhostModeOffer(null);
      // Personality: randomized start message + intro
      setPendingKaiMessage(
        `${randomFrom(KAI_RESPONSES.start)} ${tutorial.introMessage}`
      );
      setTimeout(() => renderStep(tutorial, 0), 700);
    },
    [renderStep]
  );

  const nextStep = useCallback(() => {
    if (!activeModule) return;
    const tutorial = TUTORIAL_REGISTRY[activeModule];
    if (!tutorial) return;
    const next = currentStepIndex + 1;
    if (next >= tutorial.steps.length) {
      completeTutorialFn(tutorial);
      return;
    }
    setCurrentStepIndex(next);
    renderStep(tutorial, next);
  }, [activeModule, currentStepIndex, renderStep, completeTutorialFn]);

  // skipTutorial — always skippable (UX rule)
  const skipTutorial = useCallback(() => {
    if (!activeModule) return;
    const tutorial = TUTORIAL_REGISTRY[activeModule];
    if (tutorial) completeTutorialFn(tutorial);
  }, [activeModule, completeTutorialFn]);

  const consumeKaiMessage = useCallback(() => setPendingKaiMessage(null), []);
  const dismissGhostOffer = useCallback(() => setGhostModeOffer(null), []);

  const acceptGhostOffer = useCallback(() => {
    if (ghostModeOffer) {
      startTutorial(ghostModeOffer.module);
      setGhostModeOffer(null);
    }
  }, [ghostModeOffer, startTutorial]);

  // Toolbar command parser (spec §4)
  const handleToolbarCommand = useCallback(
    (input: string): boolean => {
      const cmd = parseSmartCommand(input);
      if (!cmd) return false;
      executeAction(cmd.action, cmd.module);
      return true;
    },
    [executeAction]
  );

  const isModuleCompleted = useCallback(
    (module: TutorialModule) => !!completedModules[module],
    [completedModules]
  );

  const currentTutorial = activeModule ? TUTORIAL_REGISTRY[activeModule] : null;
  const currentStep = currentTutorial?.steps[currentStepIndex] ?? null;

  return (
    <KaiTutorialContext.Provider
      value={{
        activeModule,
        kaiMode,
        isRunning,
        currentStepIndex,
        totalSteps: currentTutorial?.steps.length ?? 0,
        spotlightTarget,
        pendingKaiMessage,
        ghostModeOffer,
        startTutorial,
        nextStep,
        skipTutorial,
        consumeKaiMessage,
        dismissGhostOffer,
        acceptGhostOffer,
        handleToolbarCommand,
        isModuleCompleted,
        currentTutorial,
        currentStep,
      }}
    >
      {children}
    </KaiTutorialContext.Provider>
  );
}

export function useKaiTutorial() {
  const ctx = useContext(KaiTutorialContext);
  if (!ctx) throw new Error("useKaiTutorial must be used within KaiTutorialProvider");
  return ctx;
}
