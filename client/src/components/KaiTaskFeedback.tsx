import { useState } from 'react';
import { Star, Bug, ThumbsUp, ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface KaiTaskFeedbackProps {
  messageId: string;
  conversationId?: string;
  taskSummary?: string;
  onDismiss?: () => void;
}

export function KaiTaskFeedback({ messageId, conversationId, taskSummary, onDismiss }: KaiTaskFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugCategory, setBugCategory] = useState<string>('wrong_result');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const submitFeedbackMutation = trpc.kai.submitTaskFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, 2000);
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    }
  });

  const handleRating = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      // Auto-submit positive feedback
      submitFeedbackMutation.mutate({
        messageId,
        conversationId,
        rating: stars,
        taskSummary,
      });
    }
  };

  const handleSubmitBug = () => {
    if (!bugDescription.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    submitFeedbackMutation.mutate({
      messageId,
      conversationId,
      rating: rating ?? 1,
      bugReport: {
        category: bugCategory,
        description: bugDescription,
      },
      taskSummary,
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  if (submitted) {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
        <ThumbsUp className="w-3.5 h-3.5" />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  const displayRating = hoverRating ?? rating;

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">How were the results?</span>
        <button
          onClick={handleDismiss}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Star Rating */}
      <div className="px-3 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  displayRating !== null && star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-white/20 hover:text-yellow-400/60'
                }`}
              />
            </button>
          ))}
        </div>

        {rating !== null && rating <= 3 && (
          <button
            onClick={() => setShowBugForm(!showBugForm)}
            className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 transition-colors ml-auto"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Report issue</span>
            {showBugForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {rating === null && (
          <button
            onClick={() => { setRating(1); setShowBugForm(true); }}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400/70 transition-colors ml-auto"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Report a bug</span>
          </button>
        )}
      </div>

      {/* Bug Report Form */}
      {showBugForm && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          {/* Category selector */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'wrong_result', label: 'Wrong result' },
              { value: 'incomplete', label: 'Incomplete' },
              { value: 'error', label: 'Error / crash' },
              { value: 'slow', label: 'Too slow' },
              { value: 'other', label: 'Other' },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setBugCategory(cat.value)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  bugCategory === cat.value
                    ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <textarea
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            placeholder="Describe what went wrong..."
            rows={2}
            className="w-full text-xs bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-white/80 placeholder-white/25 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBugForm(false)}
              className="text-xs text-white/30 hover:text-white/50 transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitBug}
              disabled={submitFeedbackMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-md px-3 py-1 transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {submitFeedbackMutation.isPending ? 'Sending...' : 'Submit report'}
            </button>
          </div>
        </div>
      )}

      {/* Submit low rating without bug form */}
      {rating !== null && rating <= 3 && !showBugForm && (
        <div className="px-3 pb-2.5 flex justify-end">
          <button
            onClick={() => submitFeedbackMutation.mutate({ messageId, conversationId, rating: rating!, taskSummary })}
            disabled={submitFeedbackMutation.isPending}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit rating'}
          </button>
        </div>
      )}
    </div>
  );
}
