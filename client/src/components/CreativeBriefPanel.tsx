/**
 * CreativeBriefPanel — Hard-Gated Brief Gathering for Kai Creative
 *
 * HARD EXECUTION GATE: Kai MUST NOT generate until ALL THREE fields are confirmed:
 *   1. program/purpose  — what are we promoting?
 *   2. audience/age     — who is this for?
 *   3. key content      — phone, offer, or schedule
 *
 * Removed bypass paths:
 *   - NO "Skip →" button (was allowing generation without audience/content)
 *   - NO Fast Mode toggle (was bypassing required fields when score >= 60)
 *   - NO score-based auto-complete (replaced by 3-field hard gate)
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

  const base = isDark ? "bg-[#0f0f0f] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900";
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

  // Gate passed — show ready state
  if (analysisExt?.canGenerate) {
    return (
      <div className={`rounded-xl border p-4 ${base}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-500 mb-2">
          <span>✓</span>
          <span>Ready to generate — all required info confirmed</span>
        </div>
        <div className={`flex flex-wrap gap-3 text-xs ${muted}`}>
          {analysisExt.programConfirmed && analysis.detectedProgram && (
            <span>Program: <span className="font-medium text-emerald-400">{analysis.detectedProgram}</span></span>
          )}
          {analysisExt.audienceConfirmed && analysis.detectedAudience && (
            <span>Audience: <span className="font-medium text-emerald-400">{analysis.detectedAudience}</span></span>
          )}
          {analysisExt.keyContentConfirmed && (
            <span className="font-medium text-emerald-400">Key content ✓</span>
          )}
        </div>
      </div>
    );
  }

  // Smart opening: no program detected yet
  const showSmartOpening = !analysis.detectedProgram && answeredIds.length === 0;
  const smartPrograms = analysisExt?.availablePrograms as string[] | undefined;

  if (showSmartOpening && smartPrograms && smartPrograms.length > 0) {
    const formatType = prompt.toLowerCase().includes("instagram") ? "post"
      : prompt.toLowerCase().includes("banner") ? "banner"
      : prompt.toLowerCase().includes("ad") ? "ad"
      : "flyer";
    return (
      <div className={`rounded-xl border ${base} overflow-hidden`}>
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <span className="text-red-500 text-sm">✦</span>
          <span className="text-sm font-semibold">Kai Creative</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
            Step 1 of 3 — Program required
          </span>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm font-medium mb-1">I can create a {formatType} for:</p>
          <p className={`text-xs mb-3 ${muted}`}>Choose a program — 3 quick questions before generating</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {smartPrograms.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipSelect("program", chip)}
                className={`text-sm px-4 py-2 rounded-full border font-medium transition-all hover:scale-105 active:scale-95 ${
                  isDark
                    ? "border-red-500/40 text-white bg-red-600/10 hover:bg-red-600 hover:border-red-500 hover:text-white"
                    : "border-red-300 text-red-700 bg-red-50 hover:bg-red-600 hover:border-red-600 hover:text-white"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && customInput.trim()) handleChipSelect("program", customInput.trim()); }}
              placeholder="Or type a different program…"
              className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-colors ${
                isDark ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-red-500/50"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-400"
              }`}
            />
            <button
              onClick={() => { if (customInput.trim()) handleChipSelect("program", customInput.trim()); }}
              disabled={!customInput.trim()}
              className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white font-medium disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              Use this
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guided Mode — show remaining required questions
  return (
    <div className={`rounded-xl border ${base} overflow-hidden`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-sm">✦</span>
          <span className="text-sm font-semibold">Creative Brief</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: "Program", confirmed: analysisExt?.programConfirmed },
            { label: "Audience", confirmed: analysisExt?.audienceConfirmed },
            { label: "Content", confirmed: analysisExt?.keyContentConfirmed },
          ].map(({ label, confirmed }) => (
            <span
              key={label}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                confirmed
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : isDark ? "bg-white/5 text-white/30 border-white/10"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {confirmed ? "✓" : "·"} {label}
            </span>
          ))}
        </div>
      </div>

      {answeredIds.length > 0 && (
        <div className={`px-4 py-2 border-b ${isDark ? "border-white/5" : "border-slate-50"}`}>
          <div className="flex flex-wrap gap-1.5">
            {answeredIds.map((id) => (
              <span key={id} className={`text-xs px-2.5 py-1 rounded-full border ${
                isDark ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-emerald-300 text-emerald-700 bg-emerald-50"
              }`}>
                ✓ {answers[id] || "answered"}
              </span>
            ))}
          </div>
        </div>
      )}

      {nextQuestion && (
        <div className="px-4 py-4">
          <div className="flex items-start gap-2 mb-3">
            <span className={`mt-0.5 text-sm font-bold ${nextQuestion.required ? "text-red-500" : "text-amber-500"}`}>
              {nextQuestion.required ? "!" : "?"}
            </span>
            <div>
              <p className="text-sm font-medium">{nextQuestion.question}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>{nextQuestion.hint}</p>
              {nextQuestion.required && (
                <p className="text-xs mt-1 text-red-400 font-medium">Required — cannot generate without this</p>
              )}
            </div>
          </div>
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
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit(nextQuestion.id); }}
              placeholder="Or type your own answer…"
              className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-colors ${
                isDark ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-red-500/50"
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
                onClick={() => handleSkipOptional(nextQuestion.id)}
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

      {analysis.questions.length > 0 && (
        <div className={`px-4 py-2 border-t ${isDark ? "border-white/5" : "border-slate-50"}`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {analysis.questions.map((q) => (
                <div key={q.id} className={`h-1.5 rounded-full transition-all ${
                  answeredIds.includes(q.id) ? "w-5 bg-emerald-500"
                  : q.id === nextQuestion?.id ? "w-5 bg-red-500"
                  : "w-2 " + (isDark ? "bg-white/15" : "bg-slate-200")
                }`} />
              ))}
            </div>
            <span className={`text-xs ${muted}`}>{answeredIds.length}/{analysis.questions.length} answered</span>
            {analysisExt?.missingFields?.length > 0 && (
              <span className="text-xs text-red-400 ml-auto">
                Still needed: {analysisExt.missingFields.join(", ")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
