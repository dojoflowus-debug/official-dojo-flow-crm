import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react';

interface GoalsMotivationStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function GoalsMotivationStep({ data, onNext, onBack, onSkip, isSubmitting }: GoalsMotivationStepProps) {
  const [goals, setGoals] = useState(data.goals || '');
  const [motivation, setMotivation] = useState(data.motivation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onNext({
      goals: goals || undefined,
      motivation: motivation || undefined,
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
          What are your goals?
        </h2>
        <p className="text-slate-400">
          Help us understand what you want to achieve (optional)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goals */}
        <div>
          <Label htmlFor="goals" className="text-white text-lg mb-2 block">
            Your Goals
          </Label>
          <Textarea
            id="goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="min-h-32 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="e.g., Get in shape, learn self-defense, build confidence..."
          />
          <p className="text-slate-500 text-sm mt-2">
            {goals.length}/500 characters
          </p>
        </div>

        {/* Motivation */}
        <div>
          <Label htmlFor="motivation" className="text-white text-lg mb-2 block">
            Why Join Now?
          </Label>
          <Textarea
            id="motivation"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="min-h-32 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="What motivated you to start your martial arts journey?"
            maxLength={500}
          />
          <p className="text-slate-500 text-sm mt-2">
            {motivation.length}/500 characters
          </p>
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
