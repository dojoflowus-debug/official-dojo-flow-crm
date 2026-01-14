import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Step0KaiAppearanceProps {
  onNext: () => void;
  onAppearanceSelect?: (appearance: 'default' | 'orb' | 'particles') => void;
  avatarName?: string;
  speechComplete?: boolean;
}

export default function Step0KaiAppearance({ onNext, onAppearanceSelect, avatarName = 'Kai', speechComplete = true }: Step0KaiAppearanceProps) {
  const [selectedAppearance, setSelectedAppearance] = useState<'default' | 'orb' | 'particles'>('default');
  const [enableImmediately, setEnableImmediately] = useState(true);

  const handleAppearanceSelect = (appearance: 'default' | 'orb' | 'particles') => {
    setSelectedAppearance(appearance);
    if (onAppearanceSelect) {
      onAppearanceSelect(appearance);
    }
  };

  const handleContinue = () => {
    // Save appearance preference
    localStorage.setItem('kaiAppearance', selectedAppearance);
    if (enableImmediately) {
      localStorage.setItem('kaiAppearanceEnabled', 'true');
    }
    onNext();
  };

  const appearances = [
    {
      id: 'default' as const,
      name: 'Default',
      description: 'Simple glowing orb',
      image: '/kai-appearance-default.png',
    },
    {
      id: 'orb' as const,
      name: 'Orb',
      description: 'Plasma particles',
      image: '/kai-appearance-plasma.png',
    },
    {
      id: 'particles' as const,
      name: 'Particles',
      description: 'Waveform energy',
      image: '/kai-appearance-vortex.png',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8">
      {/* Progress indicator */}
      <div className="absolute top-8 right-8 text-gray-400 text-sm">
        Step 3 of 8
      </div>

      <div className="w-full max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-5xl font-bold text-white">Choose {avatarName}'s Appearance</h2>
          <p className="text-gray-300 text-lg">Select an appearance for {avatarName}</p>
        </div>

        {/* Appearance Options */}
        <div className="grid grid-cols-3 gap-8 pt-4">
          {appearances.map((appearance) => (
            <button
              key={appearance.id}
              onClick={() => handleAppearanceSelect(appearance.id)}
              className={`group relative p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                selectedAppearance === appearance.id
                  ? 'border-red-500 bg-gradient-to-br from-red-900/20 to-transparent shadow-[0_0_50px_rgba(239,68,68,0.6)]'
                  : 'border-gray-800 hover:border-red-400/50 bg-transparent'
              }`}
            >
              <div className="flex flex-col items-center gap-6">
                {/* Preview Image */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/50">
                  <img
                    src={appearance.image}
                    alt={appearance.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title and Description */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold text-white">{appearance.name}</h3>
                  <p className="text-gray-400 text-sm">{appearance.description}</p>
                </div>

                {/* Selected Indicator */}
                {selectedAppearance === appearance.id && (
                  <div className="absolute top-6 right-6">
                    <CheckCircle2 className="h-8 w-8 text-red-500" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Enable Immediately Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <label htmlFor="enable-immediately" className="text-gray-300 text-base cursor-pointer">
            Enable this look immediately
          </label>
          <Switch
            id="enable-immediately"
            checked={enableImmediately}
            onCheckedChange={setEnableImmediately}
            className="data-[state=checked]:bg-red-500"
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleContinue}
            disabled={!speechComplete}
            size="lg"
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-16 py-6 text-lg font-semibold rounded-full"
          >
            Continue to Setup
          </Button>
        </div>
      </div>
    </div>
  );
}
