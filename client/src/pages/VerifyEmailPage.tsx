/**
 * Verify Email Page
 * 
 * Page for verifying email via token link from verification email.
 * Handles token validation and redirects to dashboard on success.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  const verifyMutation = trpc.emailVerification.verifyEmail.useMutation();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const result = await verifyMutation.mutateAsync({ token });

        if (result.success) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          toast.success('Email verified successfully');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/owner/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Failed to verify email');
          toast.error(result.message || 'Email verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
        toast.error('Email verification error');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, verifyMutation, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          {status === 'loading' && (
            <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>
        </div>

        {/* Message */}
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
          {message}
        </p>

        {/* Status Indicator */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your email has been verified. You will be redirected to your dashboard shortly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                {message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/owner/dashboard')}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-6">
          If you didn't request this verification, you can ignore this email.
        </p>
      </div>
    </div>
  );
};
