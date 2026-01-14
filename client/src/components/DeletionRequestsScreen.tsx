import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { BillingDecisionModal } from './BillingDecisionModal';
import { PasswordReAuthModal } from './PasswordReAuthModal';
import { useToast } from '../hooks/useToast';

type ModalState = 'closed' | 'billing-decision' | 'password-reauth' | 'deny-reason';

interface DeletionRequest {
  id: number;
  studentId: number;
  studentName: string;
  studentLastName: string;
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'expired';
  reason: string;
  isPayingMemberAtRequestTime: number;
  billingDecision?: string;
  createdAt: string;
}

export function DeletionRequestsScreen() {
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const { showToast } = useToast();

  const { data: requests, isLoading: isLoadingRequests, refetch } = trpc.students.listDeletionRequests.useQuery(
    { status: 'pending' },
    { enabled: true }
  );

  const approveDeletion = trpc.students.approveDeletion.useMutation();
  const denyDeletion = trpc.students.denyDeletion.useMutation();

  const handleApprove = (request: DeletionRequest) => {
    setSelectedRequest(request);
    if (request.isPayingMemberAtRequestTime) {
      setModalState('billing-decision');
    } else {
      setModalState('password-reauth');
    }
  };

  const handleDeny = (request: DeletionRequest) => {
    setSelectedRequest(request);
    setModalState('deny-reason');
  };

  const handleBillingDecision = (decision: 'cancel_subscription' | 'keep_active' | 'abort') => {
    if (decision === 'abort') {
      // Deny the request
      setModalState('closed');
      handleDeny(selectedRequest!);
    } else {
      setModalState('password-reauth');
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedRequest) return;

    setIsLoading(true);

    try {
      if (modalState === 'password-reauth') {
        // This is for approval
        const billingDecision = selectedRequest.isPayingMemberAtRequestTime
          ? (sessionStorage.getItem('billingDecision') as 'cancel_subscription' | 'keep_active')
          : undefined;

        await approveDeletion.mutateAsync({
          requestId: selectedRequest.id,
          password,
          billingDecision: billingDecision || 'cancel_subscription',
        });

        showToast({
          type: 'success',
          title: 'Deletion Approved',
          message: `Student deletion has been approved and executed.`,
        });
      } else if (modalState === 'deny-reason') {
        await denyDeletion.mutateAsync({
          requestId: selectedRequest.id,
          reason: denyReason,
        });

        showToast({
          type: 'success',
          title: 'Deletion Denied',
          message: 'The deletion request has been denied.',
        });
      }

      setModalState('closed');
      setSelectedRequest(null);
      setDenyReason('');
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'denied':
        return <XCircle className="text-red-600" size={20} />;
      case 'executed':
        return <CheckCircle className="text-blue-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      denied: 'Denied',
      executed: 'Executed',
      expired: 'Expired',
    };
    return labels[status] || status;
  };

  if (isLoadingRequests) {
    return <div className="text-center py-8">Loading deletion requests...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
        <p className="text-gray-700 font-medium">No pending deletion requests</p>
        <p className="text-gray-500 text-sm">All deletion requests have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(request.status)}
                  <h3 className="font-semibold text-gray-900">
                    {request.studentName} {request.studentLastName}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{request.reason}</p>

                {request.isPayingMemberAtRequestTime ? (
                  <div className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded">
                    <AlertCircle size={14} />
                    Paying Member
                  </div>
                ) : null}

                <p className="text-xs text-gray-500 mt-2">
                  Requested: {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(request)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Billing Decision Modal */}
      {modalState === 'billing-decision' && selectedRequest?.isPayingMemberAtRequestTime && (
        <BillingDecisionModal
          studentName={`${selectedRequest.studentName} ${selectedRequest.studentLastName}`}
          onDecision={handleBillingDecision}
          isLoading={isLoading}
        />
      )}

      {/* Password Re-auth Modal */}
      {modalState === 'password-reauth' && (
        <PasswordReAuthModal
          onSubmit={handlePasswordSubmit}
          onCancel={() => {
            setModalState('closed');
            setSelectedRequest(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Deny Reason Modal */}
      {modalState === 'deny-reason' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Deny Deletion Request</h2>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Optional: Provide a reason for denying this request"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-20"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setModalState('closed');
                  setSelectedRequest(null);
                  setDenyReason('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => setModalState('password-reauth')}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Denial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
