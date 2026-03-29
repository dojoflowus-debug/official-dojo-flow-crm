/**
 * Call Credit Tracker Component
 * 
 * Displays real-time call duration and credit consumption during active calls.
 * Shows estimated cost and allows users to see credit impact before ending calls.
 */

import React, { useState, useEffect } from 'react';
import { Phone, Clock, Zap, AlertCircle } from 'lucide-react';

interface CallCreditTrackerProps {
  callId: string;
  recipientPhone: string;
  organizationId: number;
  startTime: Date;
  onCallEnd?: (durationSeconds: number) => void;
  compact?: boolean;
}

interface CallStats {
  durationSeconds: number;
  durationMinutes: number;
  estimatedCreditsUsed: number;
  setupCredits: number;
  totalCredits: number;
  costPerMinute: number;
}

const CALL_SETUP_CREDITS = 5;
const CALL_PER_MINUTE_CREDITS = 10;

export const CallCreditTracker: React.FC<CallCreditTrackerProps> = ({
  callId,
  recipientPhone,
  organizationId,
  startTime,
  onCallEnd,
  compact = false,
}) => {
  const [stats, setStats] = useState<CallStats>({
    durationSeconds: 0,
    durationMinutes: 0,
    estimatedCreditsUsed: CALL_SETUP_CREDITS,
    setupCredits: CALL_SETUP_CREDITS,
    totalCredits: CALL_SETUP_CREDITS,
    costPerMinute: CALL_PER_MINUTE_CREDITS,
  });

  const [isActive, setIsActive] = useState(true);

  // Update call duration and credits every second
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const durationMinutes = durationSeconds / 60;

      // Round up to nearest minute for billing
      const roundedMinutes = Math.ceil(durationMinutes);
      const minimumMinutes = Math.max(roundedMinutes, 1);

      // Calculate credits
      const durationCredits = minimumMinutes * CALL_PER_MINUTE_CREDITS;
      const totalCredits = CALL_SETUP_CREDITS + durationCredits;

      setStats({
        durationSeconds,
        durationMinutes,
        estimatedCreditsUsed: durationCredits,
        setupCredits: CALL_SETUP_CREDITS,
        totalCredits,
        costPerMinute: CALL_PER_MINUTE_CREDITS,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleEndCall = () => {
    setIsActive(false);
    if (onCallEnd) {
      onCallEnd(stats.durationSeconds);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <Phone className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDuration(stats.durationSeconds)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.totalCredits} credits
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
        >
          End
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Phone className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div className="absolute inset-0 animate-pulse bg-red-600 dark:bg-red-400 rounded-full opacity-25"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Call
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {recipientPhone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
              {formatDuration(stats.durationSeconds)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Call Duration</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
        {/* Duration */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.ceil(stats.durationMinutes)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Minutes</p>
        </div>

        {/* Credits Used */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.estimatedCreditsUsed}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Duration Credits</p>
        </div>

        {/* Total Credits */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalCredits}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Credits</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Setup Cost</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.setupCredits} credits
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Duration ({Math.ceil(stats.durationMinutes)} min @ {stats.costPerMinute}/min)
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.estimatedCreditsUsed} credits
          </span>
        </div>

        <div className="flex justify-between items-center py-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-3 rounded">
          <span className="font-semibold text-gray-900 dark:text-white">Total Cost</span>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {stats.totalCredits} credits
          </span>
        </div>
      </div>

      {/* Cost Per Minute Info */}
      <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 Each minute of call time costs {CALL_PER_MINUTE_CREDITS} credits. Setup cost is {CALL_SETUP_CREDITS} credits.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
        <button
          onClick={handleEndCall}
          disabled={!isActive}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          End Call
        </button>
        <button
          onClick={() => setIsActive(!isActive)}
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
        >
          {isActive ? 'Pause' : 'Resume'}
        </button>
      </div>
    </div>
  );
};

export default CallCreditTracker;
