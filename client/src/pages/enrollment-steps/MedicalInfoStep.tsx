import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react';

interface MedicalInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function MedicalInfoStep({ data, onNext, onBack, onSkip, isSubmitting }: MedicalInfoStepProps) {
  const [allergies, setAllergies] = useState(data.allergies || '');
  const [medicalConditions, setMedicalConditions] = useState(data.medicalConditions || '');
  const [emergencyContactName, setEmergencyContactName] = useState(data.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(data.emergencyContactPhone || '');

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
    setEmergencyContactPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onNext({
      allergies: allergies || undefined,
      medicalConditions: medicalConditions || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
    });
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
          Medical Information
        </h2>
        <p className="text-slate-400">
          Help us keep you safe during training (optional but recommended)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Allergies */}
        <div>
          <Label htmlFor="allergies" className="text-white text-lg mb-2 block">
            Allergies
          </Label>
          <Textarea
            id="allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="min-h-24 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="List any allergies (food, medication, environmental)"
            maxLength={500}
          />
        </div>

        {/* Medical Conditions */}
        <div>
          <Label htmlFor="medicalConditions" className="text-white text-lg mb-2 block">
            Medical Conditions
          </Label>
          <Textarea
            id="medicalConditions"
            value={medicalConditions}
            onChange={(e) => setMedicalConditions(e.target.value)}
            className="min-h-24 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="Any medical conditions we should be aware of?"
            maxLength={500}
          />
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-white text-lg mb-4">Emergency Contact</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="emergencyContactName" className="text-white mb-2 block">
                Name
              </Label>
              <Input
                id="emergencyContactName"
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="Emergency contact name"
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyContactPhone" className="text-white mb-2 block">
                Phone Number
              </Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={handlePhoneChange}
                className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={onSkip}
            variant="outline"
            className="flex-1 h-14 text-lg bg-transparent border-slate-600 text-white hover:bg-slate-800"
          >
            Skip
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
