import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldCheck, RefreshCw, Trash2, Clock, Mail } from 'lucide-react';

interface DeleteStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  onDeleted: () => void;
}

type Step = 'confirm' | 'code-sent' | 'enter-code';

export function DeleteStudentModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  onDeleted,
}: DeleteStudentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('confirm');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const generateMutation = trpc.students.generateDeleteCode.useMutation();
  const verifyMutation = trpc.students.verifyAndDelete.useMutation();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep('confirm');
      setMaskedEmail('');
      setEnteredCode('');
      setTimeLeft(600);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (step === 'code-sent' || step === 'enter-code') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            toast({ title: 'Code expired', description: 'Please generate a new verification code.', variant: 'destructive' });
            setStep('confirm');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleGenerateCode = async () => {
    try {
      const result = await generateMutation.mutateAsync({ studentId });
      setMaskedEmail(result.maskedEmail);
      setExpiresAt(result.expiresAt);
      setTimeLeft(600);
      setStep('code-sent');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleVerifyAndDelete = async () => {
    const cleanCode = enteredCode.replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      toast({ title: 'Enter the full 6-digit code', variant: 'destructive' });
      return;
    }
    try {
      await verifyMutation.mutateAsync({ studentId, code: cleanCode });
      toast({ title: 'Student deleted', description: `${studentName} has been permanently removed.` });
      onOpenChange(false);
      onDeleted();
    } catch (e: any) {
      toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
      setEnteredCode('');
      // Clear OTP inputs
      inputRefs.current.forEach((el) => { if (el) el.value = ''; });
      inputRefs.current[0]?.focus();
    }
  };

  // 6-digit OTP-style input handler
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    // Build a clean array of exactly 6 slots (empty string = unfilled)
    const digits = Array.from({ length: 6 }, (_, i) => enteredCode[i] || '');
    digits[index] = value.slice(-1);
    setEnteredCode(digits.join(''));
    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!enteredCode[index] && index > 0) {
        // Move back and clear previous digit
        const digits = Array.from({ length: 6 }, (_, i) => enteredCode[i] || '');
        digits[index - 1] = '';
        setEnteredCode(digits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current digit
        const digits = Array.from({ length: 6 }, (_, i) => enteredCode[i] || '');
        digits[index] = '';
        setEnteredCode(digits.join(''));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">

        {/* Step 1: Confirm intent */}
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <DialogTitle className="text-lg font-semibold">Delete Student</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                You are about to permanently delete <span className="font-semibold text-gray-900">{studentName}</span>. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                To protect against accidental deletions, a <strong>6-digit verification code</strong> will be sent to the account holder's email. Only someone with that code can complete this deletion.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleGenerateCode}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Code sent to email */}
        {step === 'code-sent' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-semibold">Check Your Email</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                A 6-digit verification code has been sent to the account holder's email.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-blue-800 font-medium">Code sent to</p>
              <p className="text-base font-mono font-semibold text-blue-900 mt-0.5">{maskedEmail}</p>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-blue-600">
                <Clock className="w-3 h-3" />
                <span>Expires in <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span></span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-2">
              Didn't receive it? Check your spam folder or resend below.
            </p>

            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={handleGenerateCode} disabled={generateMutation.isPending}>
                <RefreshCw className="w-3.5 h-3.5" />
                {generateMutation.isPending ? 'Resending...' : 'Resend Code'}
              </Button>
              <Button className="flex-1" onClick={() => setStep('enter-code')}>
                Enter Code
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Enter the code to confirm deletion */}
        {step === 'enter-code' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                </div>
                <DialogTitle className="text-lg font-semibold">Confirm Deletion</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Enter the 6-digit code sent to <span className="font-mono font-semibold">{maskedEmail}</span> to permanently delete <span className="font-semibold text-gray-900">{studentName}</span>.
              </DialogDescription>
            </DialogHeader>

            {/* OTP-style 6-digit input */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={enteredCode[i] || ''}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="w-11 h-14 text-center text-2xl font-mono font-bold border-2 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                  style={{ borderColor: enteredCode[i] ? '#ef4444' : '#d1d5db' }}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Code expires in <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700'}`}>{formatTime(timeLeft)}</span></span>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('code-sent')}>
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleVerifyAndDelete}
                disabled={enteredCode.replace(/[^0-9]/g, '').length !== 6 || verifyMutation.isPending}
              >
                {verifyMutation.isPending ? 'Deleting...' : 'Delete Student'}
              </Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
