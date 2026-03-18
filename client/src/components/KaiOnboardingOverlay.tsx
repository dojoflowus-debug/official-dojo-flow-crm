/**
 * KaiOnboardingOverlay
 *
 * Renders as an absolute-positioned layer over the KAI Dashboard.
 * Two modes:
 *   1. "welcome"  — dim backdrop + centered welcome card (Start / Explore)
 *   2. "guided"   — dim backdrop + side panel with progress bar + one-step chat
 *
 * The dashboard stays fully visible behind the overlay so users can orient
 * themselves inside the command center from the very first moment.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Upload, Zap, Compass } from "lucide-react";
import { trpc } from "../lib/trpc";
import type { OnboardingStep, OnboardingProfile } from "../../../server/kaiOnboardingStateMachine";

// ─── Types ────────────────────────────────────────────────────────────────────

type OverlayMode = "welcome" | "guided" | "hidden";

interface StepMessage {
  id: string;
  role: "kai" | "user";
  content: string;
  showLogoUpload?: boolean;
  logoUploadType?: "light" | "dark";
  showSkip?: boolean;
}

interface KaiOnboardingOverlayProps {
  organizationId: number;
  isDark?: boolean;
  onExploreFirst: () => void;   // called when user picks "Explore First"
  onComplete: () => void;        // called when onboarding finishes
  onStepComplete?: (completedCount: number) => void; // called after each step
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  name: "Your Name",
  title: "Your Title",
  programs: "Programs",
  rank: "Your Rank",
  school_name: "School Name",
  martial_style: "Style",
  address: "Address",
  city_state_zip: "City / State / ZIP",
  phone: "Phone",
  email: "Email",
  website: "Website",
  logo_light: "Day Logo",
  logo_dark: "Night Logo",
  complete: "Done",
};

const TOTAL_STEPS = 13; // max possible steps (rank + martial_style are conditional)

function stepNumber(step: OnboardingStep): number {
  const map: Record<string, number> = {
    name: 1, title: 2, programs: 3, rank: 4, school_name: 5,
    martial_style: 6, address: 7, city_state_zip: 8, phone: 9,
    email: 10, website: 11, logo_light: 12, logo_dark: 13, complete: 99,
  };
  return map[step] ?? 1;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KaiOnboardingOverlay({
  organizationId,
  isDark,
  onExploreFirst,
  onComplete,
  onStepComplete,
}: KaiOnboardingOverlayProps) {
  const [mode, setMode] = useState<OverlayMode>("welcome");
  const [messages, setMessages] = useState<StepMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("name");
  const [profile, setProfile] = useState<OnboardingProfile>({
    name: null, title: null, programs: [], styles: [],
    schoolName: null, addressStreet: null, addressCity: null,
    addressState: null, addressPostal: null, phone: null,
    email: null, website: null, logoLightUrl: null, logoDarkUrl: null,
  });
  const [hasMartialArts, setHasMartialArts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCounter = useRef(0);
  const hasLoaded = useRef(false);

  const msgId = () => `ob-${++msgCounter.current}-${Date.now()}`;

  // ── tRPC mutations ──────────────────────────────────────────────────────────
  const statusQuery = trpc.kaiOnboardingSM.getStatus.useQuery(undefined, {
    enabled: organizationId > 0,
    staleTime: 0,
  });
  const processStepMutation = trpc.kaiOnboardingSM.processStep.useMutation();
  const uploadLogoMutation = trpc.kaiOnboardingSM.uploadLogo.useMutation();
  const skipOnboardingMutation = trpc.kaiOnboardingSM.skipOnboarding.useMutation();

  // ── Load initial state ──────────────────────────────────────────────────────
  useEffect(() => {
    if (hasLoaded.current) return;
    if (statusQuery.isLoading || !statusQuery.data) return;
    if (organizationId <= 0) return;

    const data = statusQuery.data;
    if (!data.needsOnboarding) {
      setMode("hidden");
      hasLoaded.current = true;
      return;
    }

    hasLoaded.current = true;
    const step = (data.step as OnboardingStep) || "name";
    const savedProfile = (data.profile as OnboardingProfile) || profile;
    setCurrentStep(step);
    setProfile(savedProfile);
    setHasMartialArts(data.hasMartialArts || false);
    setMode("welcome");
  }, [statusQuery.data, statusQuery.isLoading, organizationId]);

  // ── Auto-scroll messages ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when guided mode opens ─────────────────────────────────────
  useEffect(() => {
    if (mode === "guided") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [mode]);

  // ── Start guided activation ─────────────────────────────────────────────────
  const startGuided = useCallback(() => {
    setMode("guided");
    const question = getFirstQuestion(currentStep, profile);
    setMessages([{
      id: msgId(),
      role: "kai",
      content: question,
      showSkip: currentStep !== "name" && currentStep !== "programs",
      showLogoUpload: currentStep === "logo_light" || currentStep === "logo_dark",
      logoUploadType: currentStep === "logo_light" ? "light" : currentStep === "logo_dark" ? "dark" : undefined,
    }]);
  }, [currentStep, profile]);

  // ── Handle text submit ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    if (currentStep === "complete") return;

    // Logo steps: redirect to upload button
    if (currentStep === "logo_light" || currentStep === "logo_dark") {
      setMessages(prev => [...prev, {
        id: msgId(), role: "kai",
        content: "Please use the **Upload Logo** button to upload your file.",
        showLogoUpload: true,
        logoUploadType: currentStep === "logo_light" ? "light" : "dark",
        showSkip: true,
      }]);
      setInputText("");
      return;
    }

    setInputText("");
    setMessages(prev => [...prev, { id: msgId(), role: "user", content: text }]);
    setIsProcessing(true);

    try {
      const result = await processStepMutation.mutateAsync({
        currentStep,
        userInput: text,
        currentProfile: profile,
        hasMartialArts,
      });

      setProfile(result.profile);
      setCurrentStep(result.nextStep);
      if (result.hasMartialArts !== undefined) setHasMartialArts(result.hasMartialArts);
      onStepComplete?.(stepNumber(result.nextStep) - 1);

      const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
      setMessages(prev => [...prev, {
        id: msgId(),
        role: "kai",
        content: result.kaiMessage,
        showSkip: result.showSkip,
        showLogoUpload: isLogoStep,
        logoUploadType: result.nextStep === "logo_light" ? "light" : result.nextStep === "logo_dark" ? "dark" : undefined,
      }]);

      if (result.isComplete) {
        setMode("hidden");
        onComplete();
      }
    } catch {
      setMessages(prev => [...prev, {
        id: msgId(), role: "kai",
        content: "I had a brief issue saving that. Could you try again?",
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, currentStep, profile, hasMartialArts, processStepMutation, onComplete]);

  // ── Handle logo upload ──────────────────────────────────────────────────────
  const handleLogoFile = useCallback(async (file: File, type: "light" | "dark") => {
    setMessages(prev => [...prev, { id: msgId(), role: "user", content: `📎 Uploaded: ${file.name}` }]);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) { setIsProcessing(false); return; }

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
        setMessages(prev => [...prev, {
          id: msgId(),
          role: "kai",
          content: result.kaiMessage,
          showSkip: result.showSkip,
          showLogoUpload: isLogoStep,
          logoUploadType: result.nextStep === "logo_light" ? "light" : result.nextStep === "logo_dark" ? "dark" : undefined,
        }]);

        if (result.isComplete) {
          setMode("hidden");
          onComplete();
        }
      } catch {
        setMessages(prev => [...prev, {
          id: msgId(), role: "kai",
          content: "I had trouble saving that logo. Please try again.",
          showLogoUpload: true,
          logoUploadType: type,
          showSkip: true,
        }]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [profile, hasMartialArts, uploadLogoMutation, onComplete]);

  // ── Handle Explore First ────────────────────────────────────────────────────
  const handleExploreFirst = useCallback(() => {
    setMode("hidden");
    onExploreFirst();
  }, [onExploreFirst]);

  // ── Handle skip step ────────────────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await processStepMutation.mutateAsync({
        currentStep,
        userInput: "skip",
        currentProfile: profile,
        hasMartialArts,
      });
      setProfile(result.profile);
      setCurrentStep(result.nextStep);
      const isLogoStep = result.nextStep === "logo_light" || result.nextStep === "logo_dark";
      setMessages(prev => [...prev, {
        id: msgId(),
        role: "kai",
        content: result.kaiMessage,
        showSkip: result.showSkip,
        showLogoUpload: isLogoStep,
        logoUploadType: result.nextStep === "logo_light" ? "light" : result.nextStep === "logo_dark" ? "dark" : undefined,
      }]);
      if (result.isComplete) { setMode("hidden"); onComplete(); }
    } catch {}
    finally { setIsProcessing(false); }
  }, [isProcessing, currentStep, profile, hasMartialArts, processStepMutation, onComplete]);

  // ── Progress ────────────────────────────────────────────────────────────────
  const stepNum = stepNumber(currentStep);
  const progressPct = Math.min(((stepNum - 1) / TOTAL_STEPS) * 100, 100);

  if (mode === "hidden") return null;

  // ── Shared backdrop ─────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}
      >
        {/* ── Welcome Card ── */}
        {mode === "welcome" && (
          <motion.div
            key="welcome-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md mx-4"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl" style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.18) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "translateY(-10px)",
            }} />

            <div className="relative rounded-2xl border overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(15,15,20,0.98) 0%, rgba(20,10,10,0.98) 100%)",
                borderColor: "rgba(239,68,68,0.25)",
                boxShadow: "0 0 60px rgba(239,68,68,0.12), 0 24px 80px rgba(0,0,0,0.6)",
              }}>

              {/* Top accent line */}
              <div className="h-px w-full" style={{
                background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)"
              }} />

              <div className="p-8">
                {/* KAI badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono tracking-widest text-red-400/80 uppercase">KAI • COMMAND CENTER</span>
                </div>

                {/* Headline */}
                <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
                  Welcome to<br />
                  <span style={{ background: "linear-gradient(135deg, #FF4C4C, #FF8C8C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Kai Command
                  </span>
                </h1>

                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  Your dojo command center is ready. Start guided activation to personalize your system, or explore first and set up later.
                </p>

                {/* CTA buttons */}
                <div className="space-y-3">
                  <button
                    onClick={startGuided}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 group"
                    style={{
                      background: "linear-gradient(135deg, #EF4444, #DC2626)",
                      boxShadow: "0 4px 20px rgba(239,68,68,0.35)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(239,68,68,0.5)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(239,68,68,0.35)")}
                  >
                    <span className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4" />
                      Start Guided Activation
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={handleExploreFirst}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-sm text-white/70 hover:text-white transition-all duration-200 group"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onMouseEnter={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.07)"); (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.04)"); (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"); }}
                  >
                    <span className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      Explore First
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Footer note */}
                <p className="mt-5 text-center text-xs text-white/25">
                  Setup takes about 2 minutes · You can update everything in Settings
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="h-px w-full" style={{
                background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)"
              }} />
            </div>
          </motion.div>
        )}

        {/* ── Guided Activation Panel ── */}
        {mode === "guided" && (
          <motion.div
            key="guided-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm flex flex-col"
            style={{
              background: "linear-gradient(180deg, rgba(10,10,14,0.98) 0%, rgba(14,8,8,0.98) 100%)",
              borderLeft: "1px solid rgba(239,68,68,0.2)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex-none px-5 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono tracking-widest text-red-400/70 uppercase">Guided Activation</span>
                </div>
                <button
                  onClick={handleExploreFirst}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">
                    {currentStep !== "complete" ? STEP_LABELS[currentStep] || currentStep : "Complete"}
                  </span>
                  <span className="text-xs font-mono text-white/30">
                    {currentStep !== "complete" ? `${stepNum} / ${TOTAL_STEPS}` : "✓"}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #EF4444, #FF6B6B)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "kai" ? (
                    <div className="flex gap-2.5">
                      {/* KAI avatar dot */}
                      <div className="flex-none mt-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/85 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

                        {/* Logo upload button */}
                        {msg.showLogoUpload && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const type = msg.logoUploadType || "light";
                                await handleLogoFile(file, type);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", boxShadow: "0 2px 12px rgba(239,68,68,0.3)" }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload Logo
                            </button>
                            {msg.showSkip && (
                              <button
                                onClick={handleSkip}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                Skip for now
                              </button>
                            )}
                          </div>
                        )}

                        {/* Skip button for non-logo skippable steps */}
                        {!msg.showLogoUpload && msg.showSkip && (
                          <button
                            onClick={handleSkip}
                            disabled={isProcessing}
                            className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                          >
                            Skip for now →
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-3.5 py-2 rounded-xl text-sm text-white/80"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex gap-2.5">
                  <div className="flex-none mt-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-none px-4 pb-4 pt-3 border-t border-white/5">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Type your response…"
                  disabled={isProcessing || currentStep === "logo_light" || currentStep === "logo_dark"}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isProcessing || currentStep === "logo_light" || currentStep === "logo_dark"}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  const name = profile.name || "";
  const titleName = profile.title && profile.name ? `${profile.title} ${profile.name}` : name;
  switch (step) {
    case "name": return "Let's start with the basics. **What's your name?**";
    case "title": return `Good to meet you, **${name}**. What's your **title**? *(Sensei, Sifu, Coach, Professor, Master, Instructor...)*`;
    case "programs": return `What **programs** do you teach? *(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, Gymnastics — list as many as you like)*`;
    case "rank": return `What is your current **rank or belt**?`;
    case "school_name": return `What's the **name of your school or dojo**?`;
    case "martial_style": return `What **martial arts style(s)** do you primarily teach?`;
    case "address": return `What's your **street address**?`;
    case "city_state_zip": return `What's your **city, state, and ZIP code**?`;
    case "phone": return `What's your **school phone number**?`;
    case "email": return `What's your **school email address**?`;
    case "website": return `What's your **school website**? *(e.g., https://mydojo.com)*`;
    case "logo_light": return `Now let's brand your dashboard. Upload your **Day Mode logo** — used on light backgrounds. PNG or SVG works best.`;
    case "logo_dark": return `Upload your **Dark Mode logo** — usually a white or light version, used on dark backgrounds.`;
    default: return `Let's start. **What's your name?**`;
  }
}

/** Minimal markdown → HTML for bold and line breaks */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
