import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';
import LogoUpload from './LogoUpload';
import { getAvatarName } from '@/../../shared/utils';

interface Step2BrandProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Brand({ onNext, onBack }: Step2BrandProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [formData, setFormData] = useState({
    businessName: '',
    dbaName: '',
    operatorName: '',
    preferredName: '',
    pronounsTone: 'casual' as 'formal' | 'casual' | 'energetic' | 'calm',
    timezone: 'America/New_York',
    primaryColor: '#ef4444',
    secondaryColor: '#f97316',
    logoSquare: '', // Light mode logo
    logoHorizontal: '', // Dark mode logo
  });

  // Fetch existing data
  const { data: brandData, isLoading } = trpc.setupWizard.getBrand.useQuery();
  const updateBrandMutation = trpc.setupWizard.updateBrand.useMutation();

  useEffect(() => {
    if (brandData) {
      setFormData({
        businessName: brandData.businessName || '',
        dbaName: brandData.dbaName || '',
        operatorName: brandData.operatorName || '',
        preferredName: brandData.preferredName || '',
        pronounsTone: (brandData.pronounsTone as any) || 'casual',
        timezone: brandData.timezone || 'America/New_York',
        primaryColor: brandData.primaryColor || '#ef4444',
        secondaryColor: brandData.secondaryColor || '#f97316',
        logoSquare: brandData.logoSquare || '',
        logoHorizontal: brandData.logoHorizontal || '',
      });
    }
  }, [brandData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.businessName || !formData.operatorName) {
      alert('Please fill in required fields (Business Name and Operator Name)');
      return;
    }

    try {
      await updateBrandMutation.mutateAsync(formData);
      onNext();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Failed to save. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kai Bubble */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{avatarName} says:</span> "Awesome, now I want to introduce you the way you like. How should I refer to you and your brand when I talk to members and staff?"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Form */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Business Identity</h2>
            <p className="text-sm text-muted-foreground">
              Tell {avatarName} about your brand so it can represent you correctly.
            </p>
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">
              Business Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessName"
              placeholder="e.g., Elite Martial Arts Academy"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
            />
          </div>

          {/* DBA Name */}
          <div className="space-y-2">
            <Label htmlFor="dbaName">DBA / Public-Facing Name</Label>
            <Input
              id="dbaName"
              placeholder="e.g., Elite Dojo"
              value={formData.dbaName}
              onChange={(e) => handleChange('dbaName', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if same as business name
            </p>
          </div>

          {/* Operator Name */}
          <div className="space-y-2">
            <Label htmlFor="operatorName">
              Operator Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="operatorName"
              placeholder="e.g., Vincent Holmes"
              value={formData.operatorName}
              onChange={(e) => handleChange('operatorName', e.target.value)}
            />
          </div>

          {/* Preferred Name */}
          <div className="space-y-2">
            <Label htmlFor="preferredName">What should I call you?</Label>
            <Input
              id="preferredName"
              placeholder="e.g., Master Holmes, Coach Vincent, or just Vincent"
              value={formData.preferredName}
              onChange={(e) => handleChange('preferredName', e.target.value)}
            />
          </div>

          {/* Pronouns/Tone */}
          <div className="space-y-2">
            <Label htmlFor="pronounsTone">{avatarName}'s Tone with You</Label>
            <Select
              value={formData.pronounsTone}
              onValueChange={(value) => handleChange('pronounsTone', value)}
            >
              <SelectTrigger id="pronounsTone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="energetic">Energetic</SelectItem>
                <SelectItem value="calm">Calm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleChange('timezone', value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                <SelectItem value="America/Phoenix">Arizona (MST)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska (AKT)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii (HST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <LogoUpload
            lightModeUrl={formData.logoSquare}
            darkModeUrl={formData.logoHorizontal}
            onLightModeUpload={(url) => handleChange('logoSquare', url)}
            onDarkModeUpload={(url) => handleChange('logoHorizontal', url)}
          />
        </div>

        {/* Right Side: Live Preview */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
            <p className="text-sm text-muted-foreground">
              See how {avatarName} will introduce your brand
            </p>
          </div>

          <Card
            className="border-2"
            style={{
              borderColor: formData.primaryColor,
              background: `linear-gradient(135deg, ${formData.primaryColor}10, ${formData.secondaryColor}10)`,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                  }}
                >
                  K
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-bold text-lg">
                    Welcome to {formData.businessName || '[Business Name]'}!
                  </h4>
                  <p className="text-sm">
                    I'm {avatarName}, your AI assistant. I'll call you{' '}
                    <span className="font-semibold">
                      {formData.preferredName || formData.operatorName || '[Name]'}
                    </span>{' '}
                    and keep things running smoothly with a{' '}
                    <span className="font-semibold">{formData.pronounsTone}</span> tone.
                  </p>
                  <div className="pt-2 text-xs text-muted-foreground">
                    Time Zone: {formData.timezone}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            !formData.businessName ||
            !formData.operatorName ||
            updateBrandMutation.isPending
          }
          className="gap-2"
        >
          {updateBrandMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Continue to Locations
        </Button>
      </div>
    </div>
  );
}
