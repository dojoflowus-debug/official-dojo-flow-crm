import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useKiosk } from '@/contexts/KioskContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  UserPlus,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export default function KioskNewStudent() {
  const navigate = useNavigate();
  const { isSchoolLocked, schoolId, schoolName, schoolLogo } = useKiosk();
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    parentGuardianName: '',
    phoneNumber: '',
    email: '',
    interests: {
      karate: false,
      jiuJitsu: false,
      kickboxing: false,
      kidsProgram: false,
    },
  });

  // TRPC mutation
  const createKioskIntakeMutation = trpc.kiosk.createNewStudentIntake.useMutation();

  // Redirect if not in kiosk mode
  useEffect(() => {
    if (!isSchoolLocked) {
      navigate('/kiosk');
    }
  }, [isSchoolLocked, navigate]);

  // Idle timeout - return to welcome screen after 60 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const resetIdleTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      
      timer = setTimeout(() => {
        navigate('/kiosk');
      }, 60000); // 60 seconds (longer for form filling)
    };

    const handleInteraction = () => {
      resetIdleTimer();
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keypress', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    // Start initial timer
    resetIdleTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [navigate]);

  // Auto-return to welcome screen after successful submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/kiosk');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || 
        !formData.parentGuardianName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createKioskIntakeMutation.mutateAsync({
        schoolId: schoolId || '1',
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        parentGuardianName: formData.parentGuardianName,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        interests: Object.entries(formData.interests)
          .filter(([_, checked]) => checked)
          .map(([interest]) => interest),
      });

      setSubmitted(true);
      toast.success('Thank you! Our staff will finish your enrollment.');
    } catch (error) {
      console.error('Intake submission error:', error);
      toast.error('Submission failed. Please try again or see staff.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        [interest]: checked,
      },
    }));
  };

  // Success screen after submission
  if (submitted) {
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
                Thank You!
              </h2>
              <p className="text-xl text-slate-300 mb-4">
                Your information has been received.
              </p>
              <p className="text-lg text-slate-400">
                Our staff will finish your enrollment and contact you soon.
              </p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/kiosk')}
              className="text-slate-400 hover:text-white h-12 w-12"
            >
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">New Student</h1>
              <p className="text-lg text-slate-400">{schoolName}</p>
            </div>
          </div>
          {schoolLogo && (
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="h-16 w-16 object-contain rounded-lg"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-lg text-white">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-lg text-white">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-lg text-white">
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              {/* Parent/Guardian Name */}
              <div className="space-y-2">
                <Label htmlFor="parentGuardianName" className="text-lg text-white">
                  Parent/Guardian Name *
                </Label>
                <Input
                  id="parentGuardianName"
                  type="text"
                  value={formData.parentGuardianName}
                  onChange={(e) => handleInputChange('parentGuardianName', e.target.value)}
                  className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-lg text-white">
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg text-white">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-14 text-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Program Interests (Optional) */}
              <div className="space-y-3">
                <Label className="text-lg text-white">
                  Program Interests (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50">
                    <Checkbox
                      id="karate"
                      checked={formData.interests.karate}
                      onCheckedChange={(checked) => handleInterestChange('karate', checked as boolean)}
                    />
                    <label htmlFor="karate" className="text-lg text-white cursor-pointer">
                      Karate
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50">
                    <Checkbox
                      id="jiuJitsu"
                      checked={formData.interests.jiuJitsu}
                      onCheckedChange={(checked) => handleInterestChange('jiuJitsu', checked as boolean)}
                    />
                    <label htmlFor="jiuJitsu" className="text-lg text-white cursor-pointer">
                      Jiu-Jitsu
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50">
                    <Checkbox
                      id="kickboxing"
                      checked={formData.interests.kickboxing}
                      onCheckedChange={(checked) => handleInterestChange('kickboxing', checked as boolean)}
                    />
                    <label htmlFor="kickboxing" className="text-lg text-white cursor-pointer">
                      Kickboxing
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50">
                    <Checkbox
                      id="kidsProgram"
                      checked={formData.interests.kidsProgram}
                      onCheckedChange={(checked) => handleInterestChange('kidsProgram', checked as boolean)}
                    />
                    <label htmlFor="kidsProgram" className="text-lg text-white cursor-pointer">
                      Kids Program
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={createKioskIntakeMutation.isPending}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-xl py-8"
              >
                <UserPlus className="h-8 w-8 mr-3" />
                {createKioskIntakeMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>

              <p className="text-sm text-slate-400 text-center">
                * Required fields
              </p>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
