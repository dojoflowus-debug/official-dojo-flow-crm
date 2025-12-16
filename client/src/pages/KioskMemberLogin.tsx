import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useKiosk } from '@/contexts/KioskContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  CheckCircle2,
  ArrowLeft,
  Phone,
  Mail,
  QrCode,
  Flame
} from 'lucide-react';

export default function KioskMemberLogin() {
  const [, setLocation] = useLocation();
  const { isSchoolLocked, schoolName, schoolLogo } = useKiosk();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);

  // TRPC mutations
  const lookupByPhoneMutation = trpc.students.lookupByPhone.useMutation();
  const lookupByEmailMutation = trpc.students.lookupByEmail.useMutation();
  const checkInMutation = trpc.kiosk.recordCheckIn.useMutation();

  // Redirect if not in kiosk mode
  useEffect(() => {
    if (!isSchoolLocked) {
      setLocation('/kiosk');
    }
  }, [isSchoolLocked, setLocation]);

  // Idle timeout - return to welcome screen after 30 seconds of inactivity
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      
      const timer = setTimeout(() => {
        setLocation('/kiosk');
      }, 30000); // 30 seconds
      
      setIdleTimer(timer);
    };

    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    resetIdleTimer();

    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
    };
  }, [setLocation]);

  // Auto-return to welcome screen after successful check-in
  useEffect(() => {
    if (checkedIn) {
      const timer = setTimeout(() => {
        setLocation('/kiosk');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [checkedIn, setLocation]);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSignIn = async () => {
    if (loginMethod === 'phone') {
      if (!phoneNumber.trim()) {
        toast.error('Please enter your phone number');
        return;
      }
      
      try {
        const result = await lookupByPhoneMutation.mutateAsync({ phone: phoneNumber });
        
        if (result.student) {
          const checkInResult = await checkInMutation.mutateAsync({ studentId: result.student.id });
          
          if (checkInResult.success && checkInResult.student) {
            setStudentData({
              name: checkInResult.student.name,
              belt: checkInResult.student.belt_rank || 'White Belt',
              streak: 5,
              class: 'Your next scheduled class'
            });
            setCheckedIn(true);
            toast.success(`Welcome, ${checkInResult.student.name}!`);
          }
        } else {
          toast.error('Member not found. Please check your phone number.');
        }
      } catch (error) {
        console.error('Phone login error:', error);
        toast.error('Sign in failed. Please try again.');
      }
    } else {
      if (!email.trim()) {
        toast.error('Please enter your email');
        return;
      }
      
      try {
        const result = await lookupByEmailMutation.mutateAsync({ email });
        
        if (result.student) {
          const checkInResult = await checkInMutation.mutateAsync({ studentId: result.student.id });
          
          if (checkInResult.success && checkInResult.student) {
            setStudentData({
              name: checkInResult.student.name,
              belt: checkInResult.student.belt_rank || 'White Belt',
              streak: 5,
              class: 'Your next scheduled class'
            });
            setCheckedIn(true);
            toast.success(`Welcome, ${checkInResult.student.name}!`);
          }
        } else {
          toast.error('Member not found. Please check your email.');
        }
      } catch (error) {
        console.error('Email login error:', error);
        toast.error('Sign in failed. Please try again.');
      }
    }
  };

  // Success screen after check-in
  if (checkedIn && studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                You're Checked In!
              </h2>
              <p className="text-xl text-slate-300">
                Welcome back, {studentData.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400 mb-1">Current Belt</p>
                <p className="text-2xl font-bold text-white">{studentData.belt}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-slate-400">Attendance Streak</p>
                </div>
                <p className="text-2xl font-bold text-orange-500">{studentData.streak} days</p>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Returning to welcome screen...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background image */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url(/dojo-background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full">
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-md shadow-2xl">
          {/* Header */}
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/kiosk')}
                className="text-slate-400 hover:text-white h-10 w-10"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              {schoolLogo && (
                <img 
                  src={schoolLogo} 
                  alt="School Logo" 
                  className="h-12 w-12 object-contain rounded-lg"
                />
              )}
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Member Login
              </h1>
              <p className="text-slate-400">
                Sign in to check in or manage your training
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {schoolName}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-6 space-y-6">
            {/* Login Method Toggle */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  loginMethod === 'email'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            {/* Input Field */}
            {loginMethod === 'phone' ? (
              <div>
                <label className="text-white mb-2 block font-medium">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                />
              </div>
            ) : (
              <div>
                <label className="text-white mb-2 block font-medium">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                />
              </div>
            )}

            {/* Sign In Button */}
            <Button
              size="lg"
              onClick={handleSignIn}
              disabled={lookupByPhoneMutation.isPending || lookupByEmailMutation.isPending}
              className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {lookupByPhoneMutation.isPending || lookupByEmailMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* QR Code Placeholder */}
            <div className="pt-4 border-t border-slate-700">
              <button className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors py-3">
                <QrCode className="h-5 w-5" />
                <span>Scan QR Code (Coming Soon)</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 p-6 space-y-3">
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => setLocation('/kiosk/new-student')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                New here?
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setLocation('/login')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Staff Login
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Kiosk Mode Indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-600">
        Kiosk Mode
      </div>
    </div>
  );
}
