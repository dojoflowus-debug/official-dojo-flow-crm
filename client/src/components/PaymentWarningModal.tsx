import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PaymentWarningModalProps {
  studentName: string;
  onContinue: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PaymentWarningModal({
  studentName,
  onContinue,
  onCancel,
  isLoading = false,
}: PaymentWarningModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-900">Billing Alert</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-red-400 hover:text-red-600"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-red-900">
              <span className="font-semibold">{studentName}</span> has an active paid membership.
            </p>
            <p className="text-sm text-red-700">
              Deleting this student will <span className="font-semibold">NOT automatically cancel their billing</span>.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">After approval, you'll choose one of:</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600">A)</span>
                <span><span className="font-medium">Cancel subscription</span> - Billing stops immediately</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600">B)</span>
                <span><span className="font-medium">Keep subscription active</span> - Revoke access but continue billing</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600">C)</span>
                <span><span className="font-medium">Abort</span> - Cancel deletion entirely</span>
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 mt-0.5 flex-shrink-0"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">
              I understand that I must make a billing decision before deletion is finalized
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            disabled={!acknowledged || isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
