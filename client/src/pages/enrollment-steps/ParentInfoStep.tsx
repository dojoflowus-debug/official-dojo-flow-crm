import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

interface ParentInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function ParentInfoStep({ data, onNext, onBack, onSkip, isSubmitting }: ParentInfoStepProps) {
  const [requiresGuardian, setRequiresGuardian] = useState(false);
  const [guardianName, setGuardianName] = useState(data.guardianName || '');
  const [guardianRelationship, setGuardianRelationship] = useState(data.guardianRelationship || '');
  const [guardianPhone, setGuardianPhone] = useState(data.guardianPhone || '');
  const [guardianEmail, setGuardianEmail] = useState(data.guardianEmail || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if student is under 18
  useEffect(() => {
    if (data.age && data.age < 18) {
      setRequiresGuardian(true);
    }
  }, [data.age]);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setGuardianPhone(formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (requiresGuardian) {
      if (!guardianName.trim()) {
        newErrors.guardianName = 'Guardian name is required for students under 18';
      }
      
      if (!guardianPhone && !guardianEmail) {
        newErrors.contact = 'Guardian phone or email is required';
      }
      
      if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
        newErrors.guardianEmail = 'Invalid email format';
      }
      
      if (guardianPhone && guardianPhone.replace(/\D/g, '').length !== 10) {
        newErrors.guardianPhone = 'Phone number must be 10 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onNext({
        guardianName: guardianName || undefined,
        guardianRelationship: guardianRelationship || undefined,
        guardianPhone: guardianPhone || undefined,
        guardianEmail: guardianEmail || undefined,
      });
    }
  };

  const handleSkipClick = () => {
    if (!requiresGuardian) {
      onSkip();
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          {requiresGuardian ? 'Parent or Guardian Information' : 'Emergency Contact (Optional)'}
        </h2>
        <p className="text-slate-400">
          {requiresGuardian 
            ? 'Since the student is under 18, we need parent/guardian information'
            : 'You can add emergency contact information or skip this step'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guardian Name */}
        <div>
          <Label htmlFor="guardianName" className="text-white text-lg mb-2 block">
            {requiresGuardian ? 'Parent/Guardian Name' : 'Emergency Contact Name'}
            {requiresGuardian && <span className="text-red-500"> *</span>}
          </Label>
          <Input
            id="guardianName"
            type="text"
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="Enter full name"
          />
          {errors.guardianName && (
            <p className="text-red-400 text-sm mt-2">{errors.guardianName}</p>
          )}
        </div>

        {/* Relationship */}
        <div>
          <Label htmlFor="guardianRelationship" className="text-white text-lg mb-2 block">
            Relationship
          </Label>
          <Input
            id="guardianRelationship"
            type="text"
            value={guardianRelationship}
            onChange={(e) => setGuardianRelationship(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="e.g., Parent, Guardian, Spouse"
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="guardianPhone" className="text-white text-lg mb-2 block">
            Phone Number
          </Label>
          <Input
            id="guardianPhone"
            type="tel"
            value={guardianPhone}
            onChange={handlePhoneChange}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="(555) 123-4567"
            maxLength={14}
          />
          {errors.guardianPhone && (
            <p className="text-red-400 text-sm mt-2">{errors.guardianPhone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="guardianEmail" className="text-white text-lg mb-2 block">
            Email Address
          </Label>
          <Input
            id="guardianEmail"
            type="email"
            value={guardianEmail}
            onChange={(e) => setGuardianEmail(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="email@example.com"
          />
          {errors.guardianEmail && (
            <p className="text-red-400 text-sm mt-2">{errors.guardianEmail}</p>
          )}
        </div>

        {errors.contact && (
          <p className="text-red-400 text-sm">{errors.contact}</p>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          {!requiresGuardian && (
            <Button
              type="button"
              onClick={handleSkipClick}
              variant="outline"
              className="flex-1 h-14 text-lg bg-transparent border-slate-600 text-white hover:bg-slate-800"
            >
              Skip
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold ${!requiresGuardian ? 'flex-1' : 'w-full'}`}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
