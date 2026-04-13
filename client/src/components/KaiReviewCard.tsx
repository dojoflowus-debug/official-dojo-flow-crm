/**
 * KaiReviewCard.tsx
 * Post-task review card rendered in Kai chat after a task completes.
 * Shows a 5-star rating, optional feedback textarea, and a refund claim option.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface KaiReviewCardProps {
  taskSummary?: string;
  taskType?: string;
  creditsUsed?: number;
  conversationId?: string;
  isDark?: boolean;
  isCinematic?: boolean;
  onDismiss?: () => void;
  onSubmitted?: (rating: number, ticketNumber?: string) => void;
}

const STAR_LABELS = ["", "Poor", "Below average", "Okay", "Good", "Excellent"];

export function KaiReviewCard({
  taskSummary,
  taskType,
  creditsUsed = 0,
  conversationId,
  isDark = false,
  isCinematic = false,
  onDismiss,
  onSubmitted,
}: KaiReviewCardProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [requestRefund, setRequestRefund] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const submitReview = trpc.kaiReview.submitReview.useMutation();

  const activeRating = hovered || selected;

  // Theme classes
  const cardBg = isCinematic
    ? "bg-[#0a0f1a]/80 border-cyan-500/20"
    : isDark
    ? "bg-gray-800/90 border-gray-600/30"
    : "bg-white border-gray-200";

  const titleColor = isCinematic
    ? "text-cyan-300"
    : isDark
    ? "text-gray-100"
    : "text-gray-800";

  const subtitleColor = isCinematic
    ? "text-cyan-400/60"
    : isDark
    ? "text-gray-400"
    : "text-gray-500";

  const starActive = isCinematic ? "#22d3ee" : "#f59e0b";
  const starInactive = isCinematic ? "#1e3a4a" : isDark ? "#374151" : "#e5e7eb";

  const textareaClass = isCinematic
    ? "bg-cyan-950/30 border-cyan-500/20 text-cyan-100 placeholder-cyan-700 focus:border-cyan-400"
    : isDark
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-gray-400"
    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-gray-400";

  const btnPrimary = isCinematic
    ? "bg-cyan-500 hover:bg-cyan-400 text-black"
    : isDark
    ? "bg-indigo-500 hover:bg-indigo-400 text-white"
    : "bg-indigo-600 hover:bg-indigo-700 text-white";

  const btnSecondary = isCinematic
    ? "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30"
    : isDark
    ? "border border-gray-600 text-gray-300 hover:bg-gray-700"
    : "border border-gray-200 text-gray-600 hover:bg-gray-50";

  async function handleSubmit() {
    if (!selected) return;

    try {
      const result = await submitReview.mutateAsync({
        starRating: selected,
        feedback: feedback.trim() || undefined,
        taskSummary,
        taskType,
        creditsUsed,
        conversationId,
        requestRefund,
        creditsRequested: requestRefund ? creditsUsed : 0,
      });

      setSubmitted(true);

      if (result.ticketCreated && result.ticketNumber) {
        toast.success(
          `Ticket ${result.ticketNumber} created — we'll review your feedback shortly.`,
          { duration: 6000 }
        );
      } else if (selected >= 4) {
        toast.success("Thanks for the great feedback! 🙏");
      } else {
        toast.success("Feedback received — we'll use this to improve Kai.");
      }

      onSubmitted?.(selected, result.ticketNumber ?? undefined);
    } catch (err) {
      toast.error("Failed to submit review. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div
        className={`mt-3 p-4 rounded-xl border ${cardBg} flex items-center gap-3`}
      >
        <span className="text-2xl">
          {selected >= 4 ? "🌟" : selected >= 3 ? "👍" : "📋"}
        </span>
        <div>
          <p className={`text-sm font-semibold ${titleColor}`}>
            {selected >= 4
              ? "Thanks for the great rating!"
              : selected <= 2
              ? "Support ticket created — we'll follow up soon."
              : "Feedback received — thanks!"}
          </p>
          <p className={`text-xs mt-0.5 ${subtitleColor}`}>
            {selected <= 2
              ? "Our team will review your experience and reach out."
              : "Your feedback helps us make Kai better every day."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 p-4 rounded-xl border w-full ${cardBg}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className={`text-sm font-semibold ${titleColor}`}>
            How did Kai do?
          </p>
          {taskSummary && (
            <p className={`text-xs mt-0.5 ${subtitleColor} line-clamp-2`}>
              {taskSummary}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`shrink-0 text-xs ${subtitleColor} hover:opacity-70 mt-0.5`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              setSelected(star);
              setShowFeedbackForm(true);
            }}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill={star <= activeRating ? starActive : starInactive}
              className="transition-colors duration-100"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        {activeRating > 0 && (
          <span className={`ml-2 text-xs font-medium ${subtitleColor}`}>
            {STAR_LABELS[activeRating]}
          </span>
        )}
      </div>

      {/* Feedback form — shown after a star is selected */}
      {showFeedbackForm && (
        <div className="mt-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              selected <= 2
                ? "What went wrong? (optional — helps us fix it)"
                : "Any additional comments? (optional)"
            }
            rows={3}
            maxLength={2000}
            className={`w-full text-xs rounded-lg border px-3 py-2 resize-none outline-none transition-colors ${textareaClass}`}
          />

          {/* Refund claim — only shown for low ratings or if credits were used */}
          {(selected <= 2 || creditsUsed > 0) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requestRefund}
                onChange={(e) => setRequestRefund(e.target.checked)}
                className="rounded"
              />
              <span className={`text-xs ${subtitleColor}`}>
                Request a credit refund
                {creditsUsed > 0 ? ` (${creditsUsed} credit${creditsUsed !== 1 ? "s" : ""} used)` : ""}
              </span>
            </label>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!selected || submitReview.isLoading}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitReview.isLoading
                ? "Submitting…"
                : selected <= 2
                ? "Submit & Create Ticket"
                : "Submit Review"}
            </button>
            <button
              onClick={onDismiss}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${btnSecondary}`}
            >
              Skip
            </button>
          </div>

          {selected <= 2 && (
            <p className={`text-xs ${subtitleColor} text-center`}>
              A support ticket will be automatically created for our team to review.
            </p>
          )}
        </div>
      )}

      {/* Quick-submit for high ratings (no form needed) */}
      {!showFeedbackForm && (
        <p className={`text-xs ${subtitleColor} mt-1`}>
          Tap a star to rate this task
        </p>
      )}
    </div>
  );
}
