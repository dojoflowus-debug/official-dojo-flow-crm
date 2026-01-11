import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { DeletionConfirmationModal } from './DeletionConfirmationModal';
import { PaymentWarningModal } from './PaymentWarningModal';
import { PasswordReAuthModal } from './PasswordReAuthModal';
import { useToast } from '../hooks/useToast';

interface StudentDeletionButtonProps {
  studentId: number;
  studentName: string;
  membershipStatus?: string;
  hasPermission: boolean;
  onDeleted?: () => void;
}

type ModalState = 'closed' | 'confirmation' | 'payment-warning' | 'password-reauth';

export function StudentDeletionButton({
  studentId,
  studentName,
  membershipStatus,
  hasPermission,
  onDeleted,
}: StudentDeletionButtonProps) {
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const { showToast } = useToast();

  const isPayingMember = membershipStatus === 'Active' || membershipStatus === 'Premium';
  const requestDeletion = trpc.students.requestDeletion.useMutation();

  if (!hasPermission) {
    return null;
  }

  const handleConfirmation = () => {
    if (isPayingMember) {
      setModalState('payment-warning');
    } else {
      setModalState('password-reauth');
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!reason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestDeletion.mutateAsync({
        studentId,
        reason: reason.trim(),
        password,
      });

      showToast({
        type: 'success',
        title: 'Deletion Request Submitted',
        message: 'Your deletion request has been submitted for owner approval.',
      });

      setModalState('closed');
      setReason('');
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit deletion request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setModalState('closed');
    setError(null);
    setReason('');
  };

  return (
    <>
      {/* Danger Zone Button */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Danger Zone</h3>
        <button
          onClick={() => setModalState('confirmation')}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors"
        >
          <Trash2 size={18} />
          Request Deletion
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalState === 'confirmation' && (
        <DeletionConfirmationModal
          studentName={studentName}
          isPayingMember={isPayingMember}
          onConfirm={handleConfirmation}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Payment Warning Modal */}
      {modalState === 'payment-warning' && (
        <PaymentWarningModal
          studentName={studentName}
          onContinue={() => setModalState('password-reauth')}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Deletion Reason Modal */}
      {modalState === 'password-reauth' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reason for Deletion</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                Please provide a reason for requesting this student's deletion.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Student has moved away, requested by parent, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => setModalState('password-reauth')}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? 'Processing...' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Re-auth Modal */}
      {modalState === 'password-reauth' && reason && (
        <PasswordReAuthModal
          onSubmit={handlePasswordSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          error={error}
        />
      )}
    </>
  );
}
