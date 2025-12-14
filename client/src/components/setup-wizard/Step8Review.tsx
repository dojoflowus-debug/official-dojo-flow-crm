import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import {
  Loader2,
  CheckCircle2,
  Edit,
  Building2,
  DollarSign,
  Users2,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface Step8ReviewProps {
  onBack: () => void;
  onEditStep: (step: number) => void;
}

export default function Step8Review({ onBack, onEditStep }: Step8ReviewProps) {
  const [avatarName] = useState(() => getAvatarName());
  const navigate = useNavigate();
  const [launchSettings, setLaunchSettings] = useState({
    autoHandleLeads: true,
    autoSendFollowUps: true,
    requireApprovalForDiscounts: true,
  });

  // Fetch all setup data
  const { data: allData, isLoading } = trpc.setupWizard.getAllSetupData.useQuery();
  const completeSetupMutation = trpc.setupWizard.completeSetup.useMutation();

  const handleLaunch = async () => {
    try {
      await completeSetupMutation.mutateAsync();
      // Show success message and redirect
      alert('🎉 DojoFlow is now live! Kai is ready to help you manage your business.');
      navigate('/kai-command');
    } catch (error) {
      console.error('Error completing setup:', error);
      alert('Failed to complete setup. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { settings, locations, programs, team, memberJourney } = allData || {};

  return (
    <div className="space-y-6">
      {/* Kai Orb with Glow */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-30 blur-2xl animate-pulse" />
          {/* Orb */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-4xl shadow-2xl">
            K
          </div>
        </div>
        <h2 className="text-3xl font-bold mt-6 mb-2">{avatarName} is Ready to Launch</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Review your setup below. You can edit any section or launch DojoFlow now.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Snapshot */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-500" />
                Business Snapshot
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(1)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Industry:</span>
              <Badge variant="secondary" className="capitalize">
                {settings?.industry?.replace('_', ' ') || 'Not set'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business Name:</span>
              <span className="font-medium">{settings?.businessName || 'Not set'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Operator:</span>
              <span className="font-medium">{settings?.operatorName || 'Not set'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preferred Name:</span>
              <span className="font-medium">{settings?.preferredName || 'Not set'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Locations
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(3)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locations && locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc: any) => (
                  <div key={loc.id} className="text-sm">
                    <div className="font-medium">{loc.name}</div>
                    <div className="text-muted-foreground text-xs">{loc.address}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No locations added</p>
            )}
          </CardContent>
        </Card>

        {/* Programs Setup */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Programs Setup
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(4)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programs && programs.length > 0 ? (
              <div className="space-y-2">
                {programs.slice(0, 3).map((prog: any) => (
                  <div key={prog.id} className="flex justify-between text-sm">
                    <span className="font-medium">{prog.name}</span>
                    <span className="text-muted-foreground">
                      ${(prog.price / 100).toFixed(0)}/{prog.billing}
                    </span>
                  </div>
                ))}
                {programs.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{programs.length - 3} more programs
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No programs added</p>
            )}
          </CardContent>
        </Card>

        {/* Money & Targets */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Money & Targets
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(5)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Expenses:</span>
              <span className="font-medium">
                $
                {(
                  (settings?.monthlyRent || 0) +
                  (settings?.monthlyUtilities || 0) +
                  (settings?.monthlyPayroll || 0) +
                  (settings?.monthlyMarketing || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Members:</span>
              <span className="font-medium">{settings?.currentMembers || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue Goal:</span>
              <span className="font-medium">
                ${(settings?.revenueGoal || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-blue-500" />
                Team
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(6)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team && team.length > 0 ? (
              <div className="space-y-2">
                {team.slice(0, 3).map((member: any) => (
                  <div key={member.id} className="flex justify-between text-sm">
                    <span className="font-medium">{member.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {team.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{team.length - 3} more team members
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No team members added</p>
            )}
          </CardContent>
        </Card>

        {/* Automations */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Automations
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(7)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contact Preference:</span>
              <Badge variant="secondary" className="uppercase">
                {memberJourney?.contactPreference || 'both'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Response Speed:</span>
              <span className="font-medium">
                {memberJourney?.responseSpeedMinutes || 15} min
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trial Type:</span>
              <span className="font-medium capitalize">
                {memberJourney?.trialType?.replace('_', ' ') || 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pre-Launch Toggles */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle>Launch Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoLeads">Let {avatarName} handle new leads automatically</Label>
              <p className="text-xs text-muted-foreground">
                {avatarName} will respond to new leads based on your greeting template
              </p>
            </div>
            <Switch
              id="autoLeads"
              checked={launchSettings.autoHandleLeads}
              onCheckedChange={(checked) =>
                setLaunchSettings({ ...launchSettings, autoHandleLeads: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoFollowUps">Let {avatarName} send absence follow-ups</Label>
              <p className="text-xs text-muted-foreground">
                Automatically check in with members who miss classes
              </p>
            </div>
            <Switch
              id="autoFollowUps"
              checked={launchSettings.autoSendFollowUps}
              onCheckedChange={(checked) =>
                setLaunchSettings({ ...launchSettings, autoSendFollowUps: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="approvalDiscounts">
                Require my approval for promotions/discounts
              </Label>
              <p className="text-xs text-muted-foreground">
                {avatarName} will ask before offering any discounts
              </p>
            </div>
            <Switch
              id="approvalDiscounts"
              checked={launchSettings.requireApprovalForDiscounts}
              onCheckedChange={(checked) =>
                setLaunchSettings({
                  ...launchSettings,
                  requireApprovalForDiscounts: checked,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleLaunch}
          disabled={completeSetupMutation.isPending}
          className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          size="lg"
        >
          {completeSetupMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          Launch DojoFlow & Activate {avatarName}
        </Button>
      </div>
    </div>
  );
}
