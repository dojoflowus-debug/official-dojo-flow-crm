import React, { useEffect, useState } from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiError {
  message: string;
  type: 'timeout' | 'network' | 'validation' | 'server' | 'unknown';
  timestamp: Date;
  retryable: boolean;
}

interface KaiErrorAlertProps {
  error: ApiError | null;
  onDismiss: () => void;
  onRetry?: () => void;
  isDark?: boolean;
  isCinematic?: boolean;
}

export function KaiErrorAlert({
  error,
  onDismiss,
  onRetry,
  isDark = false,
  isCinematic = false
}: KaiErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      setAutoCloseTimer(timer);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    onDismiss();
  };

  if (!error || !isVisible) return null;

  // Determine error icon color and message based on error type
  const getErrorDetails = () => {
    switch (error.type) {
      case 'timeout':
        return {
          title: 'Request Timeout',
          description: 'The AI took too long to respond. Please try again.',
          icon: '⏱️'
        };
      case 'network':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the AI service. Check your connection and try again.',
          icon: '🌐'
        };
      case 'validation':
        return {
          title: 'Invalid Request',
          description: 'Your message could not be processed. Please try a different message.',
          icon: '⚠️'
        };
      case 'server':
        return {
          title: 'Service Error',
          description: 'The AI service encountered an error. Please try again in a moment.',
          icon: '⚙️'
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: error.message || 'An unexpected error occurred. Please try again.',
          icon: '❌'
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div
      className={`fixed top-4 right-4 max-w-md z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div
        className={`rounded-lg border shadow-lg p-4 flex gap-3 ${
          isCinematic
            ? 'bg-black/80 border-red-500/50 backdrop-blur-md'
            : isDark
            ? 'bg-[#18181A] border-red-500/30'
            : 'bg-white border-red-200'
        }`}
      >
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          <AlertCircle
            className={`w-5 h-5 ${
              isCinematic ? 'text-red-400' : isDark ? 'text-red-400' : 'text-red-500'
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-sm mb-1 ${
              isCinematic ? 'text-red-300' : isDark ? 'text-red-400' : 'text-red-700'
            }`}
          >
            {details.title}
          </h3>
          <p
            className={`text-xs leading-relaxed ${
              isCinematic
                ? 'text-white/70'
                : isDark
                ? 'text-white/60'
                : 'text-slate-600'
            }`}
          >
            {details.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {error.retryable && onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className={`h-7 text-xs ${
                  isCinematic
                    ? 'bg-red-500/80 hover:bg-red-600 text-white'
                    : isDark
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className={`h-7 text-xs ${
                isCinematic
                  ? 'text-white/50 hover:text-white/70 hover:bg-white/10'
                  : isDark
                  ? 'text-white/50 hover:text-white/70 hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              Dismiss
            </Button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${
            isCinematic
              ? 'text-white/50 hover:text-white/70'
              : isDark
              ? 'text-white/50 hover:text-white/70'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
