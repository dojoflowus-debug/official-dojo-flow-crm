import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface BillingDecisionModalProps {
  studentName: string;
  onDecision: (decision: 'cancel_subscription' | 'keep_active' | 'abort') => void;
  isLoading?: boolean;
}

export function BillingDecisionModal({
  studentName,
  onDecision,
  isLoading = false,
}: BillingDecisionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-900">Billing Decision Required</h2>
          </div>
          <button
            onClick={() => onDecision('abort')}
            className="text-red-400 hover:text-red-600"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            <span className="font-semibold">{studentName}</span> has an active paid membership. Choose how to proceed:
          </p>

          <div className="space-y-3">
            {/* Option A: Cancel Subscription */}
            <button
              onClick={() => onDecision('cancel_subscription')}
              disabled={isLoading}
              className="w-full text-left p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Cancel Subscription</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Billing stops immediately. Student loses access and will not be charged further.
                  </p>
                </div>
              </div>
            </button>

            {/* Option B: Keep Active */}
            <button
              onClick={() => onDecision('keep_active')}
              disabled={isLoading}
              className="w-full text-left p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Keep Subscription Active</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Billing continues but student loses access to the system. Useful for billing disputes.
                  </p>
                </div>
              </div>
            </button>

            {/* Option C: Abort */}
            <button
              onClick={() => onDecision('abort')}
              disabled={isLoading}
              className="w-full text-left p-4 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Abort Deletion</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Cancel the deletion entirely. The student remains active with no changes.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700">
              ℹ️ This decision will be recorded in the audit log for compliance purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
