import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';
import IndustryMessagePanel from './IndustryMessagePanel';

interface Step1IndustryProps {
  onNext: () => void;
  onIndustrySelect?: (industry: string) => void;
}

export default function Step1Industry({ onNext, onIndustrySelect }: Step1IndustryProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [businessModel, setBusinessModel] = useState<string>('standalone');
  const [usePreset, setUsePreset] = useState(true);
  const [customMessage, setCustomMessage] = useState<string>('');

  // Fetch existing data
  const { data: industryData, isLoading } = trpc.setupWizard.getIndustry.useQuery();
  const updateIndustryMutation = trpc.setupWizard.updateIndustry.useMutation();

  useEffect(() => {
    if (industryData) {
      setSelectedIndustry(industryData.industry || null);
      setBusinessModel(industryData.businessModel || 'standalone');
      setUsePreset(industryData.usePreset === 1);
    }
  }, [industryData]);

  // Industry-specific messages
  const industryMessages: Record<string, string> = {
    martial_arts: "Since you run a martial arts school, I'll help structure lead follow-ups, intro classes, belt-rank onboarding, and long-term retention systems. Let's set up your journey so new students feel guided from white belt onward.",
    fitness: "For a fitness gym, I'll focus on fast response times, smooth intro sign-ups, class-based reminders, and motivation-driven retention. Let's tailor your member journey for high engagement and consistent attendance.",
    yoga: "For a yoga studio, I'll create a calm, supportive journey with gentle reminders, mindful onboarding, and personalized follow-ups. Let's shape an experience centered on peace, progress, and connection.",
    pilates: "Since you selected Pilates/Barre, I'll help you automate intro sessions, reformer schedule follow-ups, and personalized progress coaching. Let's build a journey that supports consistency and core-focused development.",
    other: "Great! I'll create a flexible journey with customizable workflows and messaging. You can adjust every step so it aligns with your specific industry and style.",
  };

  const industries = [
    {
      id: 'martial_arts',
      name: 'Martial Arts/Dojo',
      icon: '/setup-icons/martial-arts.png',
      description: 'Karate, Taekwondo, Jiu-Jitsu, etc',
    },
    {
      id: 'fitness',
      name: 'Fitness Gym',
      icon: '/setup-icons/fitness-gym.png',
      description: 'Inside a Gym',
    },
    {
      id: 'yoga',
      name: 'Yoga Studio',
      icon: '/setup-icons/yoga-studio.png',
      description: 'Pilates / Hybrid',
    },
    {
      id: 'pilates',
      name: 'Pilates / Barre',
      icon: '/setup-icons/pilates-barre.png',
      description: 'Pilates, barre, reformer classes',
    },
    {
      id: 'other',
      name: 'Other Studio',
      icon: '/setup-icons/other-studio.png',
      description: 'Dance, cycling, or other specialty',
    },
  ];

  const handleSave = async () => {
    if (!selectedIndustry) {
      alert('Please select an industry');
      return;
    }

    try {
      await updateIndustryMutation.mutateAsync({
        industry: selectedIndustry as any,
        businessModel: businessModel as any,
        usePreset: usePreset ? 1 : 0,
      });
      onNext();
    } catch (error) {
      console.error('Error saving industry:', error);
      alert('Failed to save. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Choose Your Industry</h2>
        <p className="text-gray-400 text-sm">
          Select the type of business you operate
        </p>
      </div>

      {/* Industry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((industry) => (
          <Card
            key={industry.id}
            className={`cursor-pointer transition-all duration-300 ${
              selectedIndustry === industry.id
                ? 'bg-[#2a1a1a] border-2 border-red-500 shadow-lg shadow-red-500/50'
                : 'bg-[#1a1a1a] border border-gray-700 hover:border-gray-600 hover:shadow-lg'
            }`}
            onClick={() => {
              console.log('[Step1Industry] Industry clicked:', industry.id);
              console.log('[Step1Industry] Available messages:', industryMessages);
              console.log('[Step1Industry] Selected message:', industryMessages[industry.id]);
              setSelectedIndustry(industry.id);
              setCustomMessage(industryMessages[industry.id] || '');
              if (onIndustrySelect) {
                // Convert industry ID to match kaiMessages format (e.g., martial_arts -> martial-arts)
                const industryKey = industry.id.replace(/_/g, '-');
                onIndustrySelect(industryKey);
              }
            }}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src={industry.icon}
                  alt={industry.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
              <h3 className="font-semibold text-white text-lg">{industry.name}</h3>
              <p className="text-sm text-gray-400">{industry.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Message Panel */}
      {selectedIndustry && (
        <IndustryMessagePanel
          industry={industries.find(i => i.id === selectedIndustry)?.name || ''}
          defaultMessage={industryMessages[selectedIndustry] || ''}
          onMessageChange={(msg) => setCustomMessage(msg)}
        />
      )}

      {/* Business Model Dropdown */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <div>
          <Label className="text-white text-base mb-2 block">Business Model</Label>
          <Select value={businessModel} onValueChange={setBusinessModel}>
            <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-gray-700">
              <SelectItem value="standalone" className="text-white">
                Standalone Location
              </SelectItem>
              <SelectItem value="franchise" className="text-white">
                Franchise
              </SelectItem>
              <SelectItem value="multi_location" className="text-white">
                Multi-Location Chain
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Configure Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <Label htmlFor="preset-toggle" className="text-white cursor-pointer">
              Let {avatarName} auto-configure industry presets
            </Label>
          </div>
          <Switch
            id="preset-toggle"
            checked={usePreset}
            onCheckedChange={setUsePreset}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      </div>
    </div>
  );
}
