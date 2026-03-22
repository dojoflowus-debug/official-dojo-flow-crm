/**
 * CreativeBriefPanel — Conversational Brief Gathering for Kai Creative
 *
 * Kai guides the user through 2–3 quick questions before generating.
 * Tone: friendly, confident, collaborative — never robotic or error-like.
 *
 * HARD EXECUTION GATE (invisible to user):
 *   1. program/purpose  — what are we promoting?
 *   2. audience/age     — who is this for?
 *   3. key content      — phone, offer, or schedule
 *
 * The gate is enforced silently. Users see questions, not errors.
 */
import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface CreativeBriefPanelProps {
  prompt: string;
  onBriefComplete: (enrichedPrompt: string, answers: Record<string, string>) => void;
  isDark: boolean;
}

export function CreativeBriefPanel({
  prompt,
  onBriefComplete,
  isDark,
}: CreativeBriefPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const briefQuery = trpc.kaiCreative.analyzeBrief.useQuery(
    { prompt: prompt.trim() || "create a flyer", answers, fastMode: false },
    { enabled: true, staleTime: 3000 }
  );
  const analysis = briefQuery.data;
  const analysisExt = analysis as any;

  const nextQuestion = analysis?.questions.find(
    (q) => !answeredIds.includes(q.id)
  ) ?? null;

  useEffect(() => {
    if (nextQuestion && activeQuestionId !== nextQuestion.id) {
      setActiveQuestionId(nextQuestion.id);
      setCustomInput("");
    }
  }, [nextQuestion?.id]);

  // Gate check: only fire onBriefComplete when ALL THREE required fields are confirmed
  useEffect(() => {
    if (analysisExt?.canGenerate && analysis?.enrichedBrief) {
      const t = setTimeout(() => {
        onBriefComplete(analysis.enrichedBrief, answers);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [analysisExt?.canGenerate]);

  const handleChipSelect = useCallback(
    (questionId: string, value: string) => {
      const newAnswers = { ...answers, [questionId]: value };
      setAnswers(newAnswers);
      setAnsweredIds((prev) => [...prev.filter((id) => id !== questionId), questionId]);
      setCustomInput("");
    },
    [answers]
  );

  const handleCustomSubmit = useCallback(
    (questionId: string) => {
      if (!customInput.trim()) return;
      handleChipSelect(questionId, customInput.trim());
    },
    [customInput, handleChipSelect]
  );

  const handleSkipOptional = useCallback(
    (questionId: string) => {
      setAnsweredIds((prev) => [...prev.filter((id) => id !== questionId), questionId]);
    },
    []
  );

  const base = isDark
    ? "bg-[#0f0f0f] border-white/10 text-white"
    : "bg-white border-slate-200 text-slate-900";
  const muted = isDark ? "text-white/50" : "text-slate-400";
  const chipBase = isDark
    ? "border-white/15 text-white/70 hover:border-red-500/60 hover:text-white bg-white/5 hover:bg-red-600/10"
    : "border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-700 bg-slate-50 hover:bg-red-50";
  const chipActive = "bg-red-600 border-red-500 text-white shadow-sm";

  // ── Loading state ──────────────────────────────────────────────────────────
  if (briefQuery.isLoading) {
    return (
      <div className={`rounded-2xl border p-5 ${base} animate-pulse`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-7 h-7 rounded-full ${isDark ? "bg-red-500/20" : "bg-red-100"}`} />
          <div className={`h-4 rounded-full w-32 ${isDark ? "bg-white/10" : "bg-slate-100"}`} />
        </div>
        <div className={`h-3 rounded-full w-3/4 mb-2 ${isDark ? "bg-white/8" : "bg-slate-100"}`} />
        <div className={`h-3 rounded-full w-1/2 ${isDark ? "bg-white/8" : "bg-slate-100"}`} />
      </div>
    );
  }

  if (!analysis) return null;

  // ── Gate passed — ready to generate ───────────────────────────────────────
  if (analysisExt?.canGenerate) {
    const confirmedItems = [
      analysisExt.programConfirmed && analysis.detectedProgram ? analysis.detectedProgram : null,
      analysisExt.audienceConfirmed && analysis.detectedAudience ? analysis.detectedAudience : null,
    ].filter(Boolean);

    return (
      <div className={`rounded-2xl border p-4 ${base}`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs">✓</span>
          </div>
          <p className="text-sm font-semibold text-emerald-400">
            Let's build this — generating now…
          </p>
        </div>
        {confirmedItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-8">
            {confirmedItems.map((item) => (
              <span key={item as string} className={`text-xs px-2.5 py-0.5 rounded-full border ${
                isDark
                  ? "border-emerald-500/30 text-emerald-400/80 bg-emerald-500/8"
                  : "border-emerald-200 text-emerald-700 bg-emerald-50"
              }`}>
                {item as string}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Smart opening: no program detected yet, show program chips ─────────────
  const showSmartOpening = !analysis.detectedProgram && answeredIds.length === 0;
  const smartPrograms = analysisExt?.availablePrograms as string[] | undefined;
  const defaultPrograms = ["Little Ninjas", "Dragon Kids", "Kickboxing", "Summer Camp", "Adult Karate"];

  if (showSmartOpening) {
    const programs = (smartPrograms && smartPrograms.length > 0) ? smartPrograms : defaultPrograms;
    const formatType = prompt.toLowerCase().includes("instagram") ? "post"
      : prompt.toLowerCase().includes("banner") ? "banner"
      : prompt.toLowerCase().includes("rack card") ? "rack card"
      : prompt.toLowerCase().includes("ad") ? "ad"
      : "flyer";

    return (
      <div className={`rounded-2xl border ${base} overflow-hidden`}>
        {/* Kai header */}
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? "border-white/8" : "border-slate-100"}`}>
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-red-400 text-xs font-bold">K</span>
          </div>
          <span className="text-sm font-semibold">Kai</span>
          <span className={`text-xs ${muted}`}>Creative Assistant</span>
        </div>

        {/* Conversational message */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-medium mb-0.5">
            Got it — let's build this together.
          </p>
          <p className={`text-xs mb-4 ${muted}`}>
            What are we creating a {formatType} for?
          </p>

          {/* Program chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {programs.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipSelect("program", chip)}
                className={`text-sm px-4 py-2 rounded-full border font-medium transition-all duration-150 hover:scale-105 active:scale-95 ${
                  isDark
                    ? "border-red-500/35 text-white bg-red-600/8 hover:bg-red-600 hover:border-red-500 hover:text-white"
                    : "border-red-200 text-red-700 bg-red-50 hover:bg-red-600 hover:border-red-600 hover:text-white"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim())
                  handleChipSelect("program", customInput.trim());
              }}
              placeholder="Or describe something else…"
              className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none transition-colors ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder-white/25 focus:border-red-500/40"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-300"
              }`}
            />
            <button
              onClick={() => {
                if (customInput.trim()) handleChipSelect("program", customInput.trim());
              }}
              disabled={!customInput.trim()}
              className="text-xs px-3 py-2 rounded-xl bg-red-600 text-white font-medium disabled:opacity-35 hover:bg-red-700 transition-colors"
            >
              Use this
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className={`px-4 py-2.5 flex items-center gap-1.5`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${
              i === 0
                ? "w-4 bg-red-500"
                : isDark ? "w-2 bg-white/15" : "w-2 bg-slate-200"
            }`} />
          ))}
          <span className={`text-xs ml-1 ${muted}`}>Step 1 of 3</span>
        </div>
      </div>
    );
  }

  // ── Guided Mode — show next question in chat-bubble style ──────────────────
  const totalSteps = 3;
  const completedSteps = [
    analysisExt?.programConfirmed,
    analysisExt?.audienceConfirmed,
    analysisExt?.keyContentConfirmed,
  ].filter(Boolean).length;

  return (
    <div className={`rounded-2xl border ${base} overflow-hidden`}>
      {/* Kai header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? "border-white/8" : "border-slate-100"}`}>
        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-red-400 text-xs font-bold">K</span>
        </div>
        <span className="text-sm font-semibold">Kai</span>
        {/* Confirmed answers as small pills */}
        <div className="flex items-center gap-1 ml-auto">
          {answeredIds.map((id) => (
            <span key={id} className={`text-xs px-2 py-0.5 rounded-full border ${
              isDark
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-emerald-200 text-emerald-700 bg-emerald-50"
            }`}>
              ✓ {answers[id]?.length > 14 ? answers[id].slice(0, 14) + "…" : answers[id]}
            </span>
          ))}
        </div>
      </div>

      {/* Current question */}
      {nextQuestion && (
        <div className="px-4 pt-4 pb-2">
          {/* Chat bubble style question */}
          <div className={`rounded-xl px-3.5 py-3 mb-3 ${
            isDark ? "bg-white/5 border border-white/8" : "bg-slate-50 border border-slate-100"
          }`}>
            <p className="text-sm font-medium">{nextQuestion.question}</p>
            <p className={`text-xs mt-0.5 ${muted}`}>{nextQuestion.hint}</p>
          </div>

          {/* Suggestion chips */}
          {nextQuestion.chips && nextQuestion.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {nextQuestion.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipSelect(nextQuestion.id, chip)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 ${
                    answers[nextQuestion.id] === chip ? chipActive : chipBase
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomSubmit(nextQuestion.id);
              }}
              placeholder="Or type your own answer…"
              className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none transition-colors ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder-white/25 focus:border-red-500/40"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-300"
              }`}
            />
            <button
              onClick={() => handleCustomSubmit(nextQuestion.id)}
              disabled={!customInput.trim()}
              className="text-xs px-3 py-2 rounded-xl bg-red-600 text-white font-medium disabled:opacity-35 hover:bg-red-700 transition-colors"
            >
              Add
            </button>
            {!nextQuestion.required && (
              <button
                onClick={() => handleSkipOptional(nextQuestion.id)}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors ${
                  isDark
                    ? "border-white/10 text-white/35 hover:text-white/60"
                    : "border-slate-200 text-slate-400 hover:text-slate-600"
                }`}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={`px-4 py-2.5 flex items-center gap-1.5`}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i < completedSteps
              ? "w-5 bg-emerald-500"
              : i === completedSteps
              ? "w-5 bg-red-500"
              : isDark ? "w-2 bg-white/15" : "w-2 bg-slate-200"
          }`} />
        ))}
        <span className={`text-xs ml-1 ${muted}`}>
          {completedSteps < totalSteps
            ? `Step ${completedSteps + 1} of ${totalSteps}`
            : "Almost ready…"}
        </span>
      </div>
    </div>
  );
}
