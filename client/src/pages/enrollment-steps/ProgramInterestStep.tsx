import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

interface ProgramInterestStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const PROGRAMS = [
  { id: 'karate', name: 'Karate', description: 'Traditional Japanese martial art' },
  { id: 'taekwondo', name: 'Taekwondo', description: 'Korean martial art with dynamic kicks' },
  { id: 'jiu-jitsu', name: 'Brazilian Jiu-Jitsu', description: 'Ground fighting and grappling' },
  { id: 'mma', name: 'Mixed Martial Arts', description: 'Combination of multiple disciplines' },
  { id: 'kickboxing', name: 'Kickboxing', description: 'Stand-up combat sport' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'No prior experience' },
  { id: 'intermediate', name: 'Intermediate', description: '1-3 years experience' },
  { id: 'advanced', name: 'Advanced', description: '3+ years experience' },
];

export default function ProgramInterestStep({ data, onNext, onBack, isSubmitting }: ProgramInterestStepProps) {
  const [programInterest, setProgramInterest] = useState(data.programInterest || '');
  const [experienceLevel, setExperienceLevel] = useState(data.experienceLevel || 'beginner');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!programInterest) {
      newErrors.programInterest = 'Please select a program';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onNext({
        programInterest,
        experienceLevel,
      });
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
          What program interests you?
        </h2>
        <p className="text-slate-400">
          Choose the martial art you'd like to learn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Program Selection */}
        <div>
          <Label className="text-white text-lg mb-4 block">
            Select Program <span className="text-red-500">*</span>
          </Label>
          <div className="grid gap-3">
            {PROGRAMS.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => setProgramInterest(program.name)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  programInterest === program.name
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-white">{program.name}</div>
                <div className="text-sm text-slate-400 mt-1">{program.description}</div>
              </button>
            ))}
          </div>
          {errors.programInterest && (
            <p className="text-red-400 text-sm mt-2">{errors.programInterest}</p>
          )}
        </div>

        {/* Experience Level */}
        <div>
          <Label className="text-white text-lg mb-4 block">
            Experience Level
          </Label>
          <div className="grid gap-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setExperienceLevel(level.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  experienceLevel === level.id
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-white">{level.name}</div>
                <div className="text-sm text-slate-400 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
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
