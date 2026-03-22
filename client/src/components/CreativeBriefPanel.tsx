/**
 * CreativeBriefPanel — Guided Mode UI for Kai Creative
 *
 * Shows a conversational brief-gathering flow before generation.
 * Displays one question at a time with chip options for quick selection.
 * Includes a Fast Mode toggle to skip questions when prompt is already complete.
 */

import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface CreativeBriefPanelProps {
  prompt: string;
  fastMode: boolean;
  onFastModeToggle: (v: boolean) => void;
  onBriefComplete: (enrichedPrompt: string, answers: Record<string, string>) => void;
  onSkip: () => void;
  isDark: boolean;
}

export function CreativeBriefPanel({
  prompt,
  fastMode,
  onFastModeToggle,
  onBriefComplete,
  onSkip,
  isDark,
}: CreativeBriefPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Fetch brief analysis
  const briefQuery = trpc.kaiCreative.analyzeBrief.useQuery(
    { prompt: prompt.trim() || "create a flyer", answers, fastMode },
    { enabled: prompt.length >= 0, staleTime: 5000 }
  );

  const analysis = briefQuery.data;

  // Find the next unanswered question
  const nextQuestion = analysis?.questions.find(
    (q) => !answeredIds.includes(q.id)
  ) ?? null;

  // Auto-set active question when it changes
  useEffect(() => {
    if (nextQuestion && activeQuestionId !== nextQuestion.id) {
      setActiveQuestionId(nextQuestion.id);
      setCustomInput("");
    }
  }, [nextQuestion?.id]);

  // If brief is complete, fire onBriefComplete
  useEffect(() => {
    if (analysis?.isComplete && analysis.enrichedBrief) {
      // Small delay so user sees the "ready" state
      const t = setTimeout(() => {
        onBriefComplete(analysis.enrichedBrief, answers);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [analysis?.isComplete]);

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

  const handleSkipQuestion = useCallback(
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
    ? "border-white/15 text-white/70 hover:border-red-500/50 hover:text-white bg-white/5"
    : "border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-700 bg-slate-50";
  const chipActive = "bg-red-600 border-red-500 text-white";

  if (briefQuery.isLoading) {
    return (
      <div className={`rounded-xl border p-4 ${base} animate-pulse`}>
        <div className={`h-4 rounded w-3/4 mb-2 ${isDark ? "bg-white/10" : "bg-slate-100"}`} />
        <div className={`h-4 rounded w-1/2 ${isDark ? "bg-white/10" : "bg-slate-100"}`} />
      </div>
    );
  }

  if (!analysis) return null;

  // ── Fast Mode or complete — show ready state ──────────────────────────────
  if (analysis.isComplete) {
    return (
      <div className={`rounded-xl border p-4 ${base}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-500 mb-2">
          <span>✓</span>
          <span>Brief complete — generating with your brand data</span>
        </div>
        {analysis.detectedProgram && (
          <p className={`text-xs ${muted}`}>
            Program: <span className="font-medium text-white/70">{analysis.detectedProgram}</span>
            {analysis.detectedAudience && (
              <> · Audience: <span className="font-medium text-white/70">{analysis.detectedAudience}</span></>
            )}
          </p>
        )}
      </div>
    );
  }

  // ── Guided Mode — show questions ──────────────────────────────────────────
  return (
    <div className={`rounded-xl border ${base} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-sm">✦</span>
          <span className="text-sm font-semibold">Creative Brief</span>
          {!analysis?.detectedProgram ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              Program required
            </span>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-500"}`}>
              Guided Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Fast Mode toggle — only shown when program is already confirmed */}
          {analysis?.detectedProgram && (
            <button
              onClick={() => onFastModeToggle(!fastMode)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                fastMode ? "text-red-500" : muted
              } hover:text-red-500`}
              title="Fast Mode: skip optional questions and generate immediately"
            >
              <span className={`w-7 h-4 rounded-full flex items-center transition-colors ${
                fastMode ? "bg-red-600" : isDark ? "bg-white/10" : "bg-slate-200"
              }`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${
                  fastMode ? "translate-x-3" : "translate-x-0"
                }`} />
              </span>
              Fast Mode
            </button>
          )}
          {/* Skip button — only shown when program is already confirmed in the prompt */}
          {analysis?.detectedProgram && (
            <button
              onClick={onSkip}
              className={`text-xs ${muted} hover:text-red-500 transition-colors`}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* Answered questions (collapsed) */}
      {answeredIds.length > 0 && (
        <div className={`px-4 py-2 border-b ${isDark ? "border-white/5" : "border-slate-50"}`}>
          <div className="flex flex-wrap gap-1.5">
            {answeredIds.map((id) => (
              <span
                key={id}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  isDark ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-emerald-300 text-emerald-700 bg-emerald-50"
                }`}
              >
                ✓ {answers[id] || "skipped"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active question */}
      {nextQuestion && (
        <div className="px-4 py-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-red-500 mt-0.5 text-sm">?</span>
            <div>
              <p className="text-sm font-medium">{nextQuestion.question}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>{nextQuestion.hint}</p>
            </div>
          </div>

          {/* Chip options */}
          {nextQuestion.chips && nextQuestion.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {nextQuestion.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipSelect(nextQuestion.id, chip)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    answers[nextQuestion.id] === chip ? chipActive : chipBase
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Custom text input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomSubmit(nextQuestion.id);
              }}
              placeholder="Or type your own answer…"
              className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-colors ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-red-500/50"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-400"
              }`}
            />
            <button
              onClick={() => handleCustomSubmit(nextQuestion.id)}
              disabled={!customInput.trim()}
              className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white font-medium disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              Add
            </button>
            {!nextQuestion.required && (
              <button
                onClick={() => handleSkipQuestion(nextQuestion.id)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-slate-200 text-slate-400 hover:text-slate-600"
                }`}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {analysis.questions.length > 0 && (
        <div className={`px-4 py-2 border-t ${isDark ? "border-white/5" : "border-slate-50"}`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {analysis.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`h-1 rounded-full transition-all ${
                    answeredIds.includes(q.id)
                      ? "w-4 bg-emerald-500"
                      : q.id === nextQuestion?.id
                      ? "w-4 bg-red-500"
                      : "w-2 " + (isDark ? "bg-white/15" : "bg-slate-200")
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs ${muted}`}>
              {answeredIds.length}/{analysis.questions.length} answered
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
