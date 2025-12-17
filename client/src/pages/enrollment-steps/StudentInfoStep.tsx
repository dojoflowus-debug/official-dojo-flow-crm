import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function StudentInfoStep({ data, onNext, isSubmitting }: StudentInfoStepProps) {
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(data.dateOfBirth || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const dob = new Date(dateOfBirth);
      const age = Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      onNext({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        age,
      });
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Let's start with your name
        </h2>
        <p className="text-slate-400">
          We'll use this information to create your student profile
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName" className="text-white text-lg mb-2 block">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="Enter your first name"
            autoFocus
          />
          {errors.firstName && (
            <p className="text-red-400 text-sm mt-2">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName" className="text-white text-lg mb-2 block">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="text-red-400 text-sm mt-2">{errors.lastName}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <Label htmlFor="dateOfBirth" className="text-white text-lg mb-2 block">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white"
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && (
            <p className="text-red-400 text-sm mt-2">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
