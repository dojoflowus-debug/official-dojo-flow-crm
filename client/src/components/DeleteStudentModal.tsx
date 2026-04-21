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
import { Input } from '@/components/ui/input';
import { AlertTriangle, ShieldCheck, Copy, RefreshCw, Trash2, Clock } from 'lucide-react';

interface DeleteStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  onDeleted: () => void;
}

type Step = 'confirm' | 'code-generated' | 'enter-code';

export function DeleteStudentModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  onDeleted,
}: DeleteStudentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('confirm');
  const [generatedCode, setGeneratedCode] = useState<string>('');
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
      setGeneratedCode('');
      setEnteredCode('');
      setTimeLeft(600);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (step === 'code-generated' || step === 'enter-code') {
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
      setGeneratedCode(result.code);
      setExpiresAt(result.expiresAt);
      setTimeLeft(600);
      setStep('code-generated');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: 'Code copied', description: 'Verification code copied to clipboard.' });
  };

  const handleVerifyAndDelete = async () => {
    if (enteredCode.length !== 6) {
      toast({ title: 'Enter the full 6-digit code', variant: 'destructive' });
      return;
    }
    try {
      await verifyMutation.mutateAsync({ studentId, code: enteredCode });
      toast({ title: 'Student deleted', description: `${studentName} has been permanently removed.` });
      onOpenChange(false);
      onDeleted();
    } catch (e: any) {
      toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
      setEnteredCode('');
    }
  };

  // 6-digit OTP-style input handler
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = enteredCode.split('');
    digits[index] = value.slice(-1);
    const newCode = digits.join('').slice(0, 6);
    setEnteredCode(newCode.padEnd(6, '').slice(0, 6));
    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
                To protect against accidental deletions, a <strong>6-digit verification code</strong> will be generated for the account holder. Only someone with that code can complete this deletion.
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
                {generateMutation.isPending ? 'Generating...' : 'Generate Verification Code'}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Show the generated code */}
        {step === 'code-generated' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-semibold">Verification Code Generated</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Share this code with the person authorized to confirm the deletion of <span className="font-semibold text-gray-900">{studentName}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4">
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-gray-900">
                  {generatedCode}
                </span>
                <button onClick={handleCopyCode} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires in <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700'}`}>{formatTime(timeLeft)}</span></span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={handleGenerateCode} disabled={generateMutation.isPending}>
                <RefreshCw className="w-3.5 h-3.5" />
                New Code
              </Button>
              <Button className="flex-1" onClick={() => setStep('enter-code')}>
                Enter Code to Confirm
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
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <DialogTitle className="text-lg font-semibold">Confirm Deletion</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Enter the 6-digit verification code to permanently delete <span className="font-semibold text-gray-900">{studentName}</span>.
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
              <Button variant="outline" className="flex-1" onClick={() => setStep('code-generated')}>
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleVerifyAndDelete}
                disabled={enteredCode.length !== 6 || verifyMutation.isPending}
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
