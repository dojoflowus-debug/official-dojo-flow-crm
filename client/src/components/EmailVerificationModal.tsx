/**
 * Email Verification Modal
 * 
 * Modal component for email verification during trial sign-up.
 * Displays verification status and handles resend logic.
 */

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  userId: number;
  onVerified: () => void;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  userId,
  onVerified,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');

  const sendVerificationMutation = trpc.emailVerification.sendVerificationEmail.useMutation();
  const resendVerificationMutation = trpc.emailVerification.resendVerificationEmail.useMutation();
  const checkStatusQuery = trpc.emailVerification.getVerificationStatus.useQuery(undefined, {
    enabled: isOpen,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  useEffect(() => {
    if (checkStatusQuery.data?.isVerified) {
      setVerificationStatus('verified');
      setTimeout(() => {
        onVerified();
      }, 2000);
    }
  }, [checkStatusQuery.data?.isVerified, onVerified]);

  useEffect(() => {
    if (!isOpen) return;

    // Send initial verification email
    const sendEmail = async () => {
      setIsLoading(true);
      try {
        await sendVerificationMutation.mutateAsync({
          email,
          userId,
        });
        toast.success('Verification email sent');
      } catch (error) {
        setVerificationStatus('error');
        toast.error('Failed to send verification email');
      } finally {
        setIsLoading(false);
      }
    };

    sendEmail();
  }, [isOpen, email, userId, sendVerificationMutation]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendVerificationMutation.mutateAsync({ email });
      toast.success('Verification email resent');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          {verificationStatus === 'verified' ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : verificationStatus === 'error' ? (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          )}
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {verificationStatus === 'verified'
              ? 'Email Verified!'
              : verificationStatus === 'error'
              ? 'Verification Failed'
              : 'Verify Your Email'}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400">
            {verificationStatus === 'verified'
              ? 'Your email has been verified successfully.'
              : verificationStatus === 'error'
              ? 'There was an error verifying your email.'
              : `We've sent a verification link to ${email}`}
          </p>
        </div>

        {/* Content */}
        <div className="mb-6">
          {verificationStatus === 'pending' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Check your email</strong> and click the verification link. The link will expire in 24 hours.
              </p>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader className="w-4 h-4 animate-spin" />
              Waiting for verification...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {verificationStatus === 'pending' && (
            <>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isLoading
                  ? 'Sending...'
                  : 'Resend Verification Email'}
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </>
          )}

          {verificationStatus === 'verified' && (
            <button
              onClick={onVerified}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {verificationStatus === 'error' && (
            <>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isLoading ? 'Sending...' : 'Try Again'}
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
          Didn't receive the email? Check your spam folder or contact support.
        </p>
      </div>
    </div>
  );
};
