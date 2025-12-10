import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Step7MemberJourneyProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Step7MemberJourney({ onNext, onBack }: Step7MemberJourneyProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [formData, setFormData] = useState({
    leadGreeting: '',
    contactPreference: 'both' as 'sms' | 'email' | 'both',
    responseSpeedMinutes: 15,
    trialOffer: '',
    trialType: 'free_class' as 'free_class' | 'paid_intro' | 'free_week' | 'assessment',
    trialFollowUp: '',
    welcomeTone: 'detailed' as 'shorter' | 'detailed',
    miss1ClassAction: '',
    miss2WeeksAction: '',
    absenceAlertThreshold: 3,
    renewalReminderWeeks: 2,
    autoBookingPrompts: false,
    encouragementMessages: true,
  });

  // Fetch existing data
  const { data: journeyData, isLoading } = trpc.setupWizard.getMemberJourney.useQuery();
  const updateJourneyMutation = trpc.setupWizard.updateMemberJourney.useMutation();

  useEffect(() => {
    if (journeyData) {
      setFormData({
        leadGreeting: journeyData.leadGreeting || '',
        contactPreference: (journeyData.contactPreference as any) || 'both',
        responseSpeedMinutes: journeyData.responseSpeedMinutes || 15,
        trialOffer: journeyData.trialOffer || '',
        trialType: (journeyData.trialType as any) || 'free_class',
        trialFollowUp: journeyData.trialFollowUp || '',
        welcomeTone: (journeyData.welcomeTone as any) || 'detailed',
        miss1ClassAction: journeyData.miss1ClassAction || '',
        miss2WeeksAction: journeyData.miss2WeeksAction || '',
        absenceAlertThreshold: journeyData.absenceAlertThreshold || 3,
        renewalReminderWeeks: journeyData.renewalReminderWeeks || 2,
        autoBookingPrompts: journeyData.autoBookingPrompts === 1,
        encouragementMessages: journeyData.encouragementMessages === 1,
      });
    }
  }, [journeyData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateJourneyMutation.mutateAsync({
        ...formData,
        autoBookingPrompts: formData.autoBookingPrompts ? 1 : 0,
        encouragementMessages: formData.encouragementMessages ? 1 : 0,
      });
      onNext();
    } catch (error) {
      console.error('Error saving member journey:', error);
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
              <span className="font-semibold">{avatarName} says:</span> "Show me how you want your people treated—from first message to long-time member. I'll follow this playbook on your behalf."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Member Journey & Automations</h2>
          <p className="text-sm text-muted-foreground">
            Configure how {avatarName} handles leads, trials, and member retention
          </p>
        </div>

        {/* Timeline Visual */}
        <div className="flex items-center justify-between py-4 px-2 bg-muted/30 rounded-lg overflow-x-auto">
          {['Lead', 'Trial', 'Member', '30 Days', '90 Days', '6 Months', 'Winback'].map(
            (stage, index) => (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {stage}
                  </span>
                </div>
                {index < 6 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            )
          )}
        </div>

        {/* Lead Handling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leadGreeting">Lead Greeting Template</Label>
              <Textarea
                id="leadGreeting"
                placeholder="Hey [FirstName]! This is {avatarName} with [BusinessName]. I'd love to learn what you're looking for..."
                value={formData.leadGreeting}
                onChange={(e) => handleChange('leadGreeting', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPreference">Preferred Contact</Label>
                <Select
                  value={formData.contactPreference}
                  onValueChange={(value) => handleChange('contactPreference', value)}
                >
                  <SelectTrigger id="contactPreference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">Both SMS & Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseSpeed">Response Speed (minutes)</Label>
                <Input
                  id="responseSpeed"
                  type="number"
                  value={formData.responseSpeedMinutes}
                  onChange={(e) =>
                    handleChange('responseSpeedMinutes', parseInt(e.target.value) || 15)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialOffer">Trial Offer</Label>
              <Input
                id="trialOffer"
                placeholder="e.g., Free week, $29 intro package"
                value={formData.trialOffer}
                onChange={(e) => handleChange('trialOffer', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trial / Intro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trial / Intro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trialType">Trial Type</Label>
              <Select
                value={formData.trialType}
                onValueChange={(value: any) => handleChange('trialType', value)}
              >
                <SelectTrigger id="trialType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_class">Free Class</SelectItem>
                  <SelectItem value="paid_intro">Paid Intro</SelectItem>
                  <SelectItem value="free_week">Free Week</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialFollowUp">Auto Follow-Up Template</Label>
              <Textarea
                id="trialFollowUp"
                placeholder="How was your first class? I'd love to hear your thoughts..."
                value={formData.trialFollowUp}
                onChange={(e) => handleChange('trialFollowUp', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* New Member Onboarding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Member Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcomeTone">Welcome Message Tone</Label>
              <Select
                value={formData.welcomeTone}
                onValueChange={(value: any) => handleChange('welcomeTone', value)}
              >
                <SelectTrigger id="welcomeTone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shorter">Shorter & Concise</SelectItem>
                  <SelectItem value="detailed">Detailed & Warm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="miss1Class">Miss 1 Class Action</Label>
              <Input
                id="miss1Class"
                placeholder="e.g., Send friendly check-in"
                value={formData.miss1ClassAction}
                onChange={(e) => handleChange('miss1ClassAction', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="miss2Weeks">Miss 2+ Weeks Action</Label>
              <Input
                id="miss2Weeks"
                placeholder="e.g., Escalate and offer help"
                value={formData.miss2WeeksAction}
                onChange={(e) => handleChange('miss2WeeksAction', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Long-Term Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Long-Term Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="absenceThreshold">
                  Absence Alert Threshold (classes)
                </Label>
                <Input
                  id="absenceThreshold"
                  type="number"
                  value={formData.absenceAlertThreshold}
                  onChange={(e) =>
                    handleChange('absenceAlertThreshold', parseInt(e.target.value) || 3)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewalReminder">Renewal Reminder (weeks before)</Label>
                <Input
                  id="renewalReminder"
                  type="number"
                  value={formData.renewalReminderWeeks}
                  onChange={(e) =>
                    handleChange('renewalReminderWeeks', parseInt(e.target.value) || 2)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Industry-Specific Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automation Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBooking">Auto-Prompts for Booking</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically remind members to book their next class
                </p>
              </div>
              <Switch
                id="autoBooking"
                checked={formData.autoBookingPrompts}
                onCheckedChange={(checked) =>
                  handleChange('autoBookingPrompts', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="encouragement">Encouragement Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Send motivational messages based on visit frequency
                </p>
              </div>
              <Switch
                id="encouragement"
                checked={formData.encouragementMessages}
                onCheckedChange={(checked) =>
                  handleChange('encouragementMessages', checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateJourneyMutation.isPending}
          className="gap-2"
        >
          {updateJourneyMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
