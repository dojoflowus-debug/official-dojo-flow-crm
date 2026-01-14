import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { trpc } from '@/lib/trpc';
import { Loader2, DollarSign, TrendingUp, Users, Target } from 'lucide-react';

interface Step5FinancialsProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Financials({ onNext, onBack }: Step5FinancialsProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [formData, setFormData] = useState({
    monthlyRent: 0,
    monthlyUtilities: 0,
    monthlyPayroll: 0,
    monthlyMarketing: 0,
    currentMembers: 0,
    revenueGoal: 0,
    maxClassSize: 20,
    nonNegotiables: '',
    focusSlider: 50, // 0=stability, 100=aggressive growth
    riskComfort: 50, // 0=strict, 100=flexible
  });

  // Fetch existing data
  const { data: financialsData, isLoading } = trpc.setupWizard.getFinancials.useQuery();
  const updateFinancialsMutation = trpc.setupWizard.updateFinancials.useMutation();

  useEffect(() => {
    if (financialsData) {
      setFormData({
        monthlyRent: financialsData.monthlyRent || 0,
        monthlyUtilities: financialsData.monthlyUtilities || 0,
        monthlyPayroll: financialsData.monthlyPayroll || 0,
        monthlyMarketing: financialsData.monthlyMarketing || 0,
        currentMembers: financialsData.currentMembers || 0,
        revenueGoal: financialsData.revenueGoal || 0,
        maxClassSize: financialsData.maxClassSize || 20,
        nonNegotiables: financialsData.nonNegotiables || '',
        focusSlider: financialsData.focusSlider || 50,
        riskComfort: financialsData.riskComfort || 50,
      });
    }
  }, [financialsData]);

  const handleChange = (field: string, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateFinancialsMutation.mutateAsync(formData);
      onNext();
    } catch (error) {
      console.error('Error saving financials:', error);
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

  const totalMonthlyExpenses =
    formData.monthlyRent +
    formData.monthlyUtilities +
    formData.monthlyPayroll +
    formData.monthlyMarketing;

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
              <span className="font-semibold">{avatarName} says:</span> "Now tell me how your business really works. Rent, payroll, and goals help me suggest pricing, promotions, and class caps that make financial sense, not just emotional sense."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Money, Targets & Constraints</h2>
          <p className="text-sm text-muted-foreground">
            Give {avatarName} the financial context to advise you properly
          </p>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-500" />
                Monthly Rent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.monthlyRent || ''}
                onChange={(e) =>
                  handleChange('monthlyRent', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Monthly Utilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.monthlyUtilities || ''}
                onChange={(e) =>
                  handleChange('monthlyUtilities', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                Monthly Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.monthlyPayroll || ''}
                onChange={(e) =>
                  handleChange('monthlyPayroll', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Monthly Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.monthlyMarketing || ''}
                onChange={(e) =>
                  handleChange('monthlyMarketing', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>
        </div>

        {/* Total Expenses Summary */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Monthly Expenses</span>
              <span className="text-2xl font-bold">
                ${totalMonthlyExpenses.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Current State & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Current Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.currentMembers || ''}
                onChange={(e) =>
                  handleChange('currentMembers', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                Revenue Goal (12mo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="0"
                value={formData.revenueGoal || ''}
                onChange={(e) =>
                  handleChange('revenueGoal', parseInt(e.target.value) || 0)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-500" />
                Max Class Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="20"
                value={formData.maxClassSize || ''}
                onChange={(e) =>
                  handleChange('maxClassSize', parseInt(e.target.value) || 20)
                }
                className="text-2xl font-bold h-14"
              />
            </CardContent>
          </Card>
        </div>

        {/* Non-Negotiables */}
        <div className="space-y-2">
          <Label htmlFor="nonNegotiables">
            What are your non-negotiables?
          </Label>
          <Textarea
            id="nonNegotiables"
            placeholder="Examples:&#10;• Never discount more than 20%&#10;• I prefer quality over large classes&#10;• Do not auto-extend contracts without confirmation"
            value={formData.nonNegotiables}
            onChange={(e) => handleChange('nonNegotiables', e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Focus Slider */}
        <div className="space-y-3">
          <Label>Business Focus</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-24">Stability</span>
            <Slider
              value={[formData.focusSlider]}
              onValueChange={(value) => handleChange('focusSlider', value[0])}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-32 text-right">
              Aggressive Growth
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {formData.focusSlider < 33 ? 'Stability-focused' : formData.focusSlider < 67 ? 'Balanced' : 'Growth-focused'}
          </p>
        </div>

        {/* Risk Comfort Slider */}
        <div className="space-y-3">
          <Label>Risk Comfort on Discounts</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-24">Strict</span>
            <Slider
              value={[formData.riskComfort]}
              onValueChange={(value) => handleChange('riskComfort', value[0])}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-32 text-right">
              Flexible
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {formData.riskComfort < 33 ? 'Conservative' : formData.riskComfort < 67 ? 'Moderate' : 'Flexible'}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateFinancialsMutation.isPending}
          className="gap-2"
        >
          {updateFinancialsMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Continue to Team
        </Button>
      </div>
    </div>
  );
}
