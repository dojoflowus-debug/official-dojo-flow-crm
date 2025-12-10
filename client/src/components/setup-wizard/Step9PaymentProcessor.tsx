import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { trpc } from '@/lib/trpc';
import { Loader2, CreditCard, DollarSign, Check } from 'lucide-react';

interface Step9PaymentProcessorProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Step9PaymentProcessor({ onNext, onBack }: Step9PaymentProcessorProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [formData, setFormData] = useState({
    processor: 'stripe', // stripe, square, clover, pc_bancard, none
    apiKey: '',
    merchantId: '',
    setupLater: false,
  });

  // Fetch existing data
  const { data: paymentData, isLoading } = trpc.setupWizard.getPaymentProcessor.useQuery();
  const updatePaymentMutation = trpc.setupWizard.updatePaymentProcessor.useMutation();

  useEffect(() => {
    if (paymentData) {
      setFormData({
        processor: paymentData.processor || 'stripe',
        apiKey: paymentData.apiKey || '',
        merchantId: paymentData.merchantId || '',
        setupLater: paymentData.setupLater || false,
      });
    }
  }, [paymentData]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updatePaymentMutation.mutateAsync(formData);
      onNext();
    } catch (error) {
      console.error('Error saving payment processor:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleSkip = async () => {
    try {
      await updatePaymentMutation.mutateAsync({
        ...formData,
        setupLater: true,
      });
      onNext();
    } catch (error) {
      console.error('Error skipping payment processor:', error);
      alert('Failed to skip. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const processors = [
    {
      value: 'stripe',
      label: 'Stripe',
      description: 'Industry-leading payment processing with 2.9% + 30¢ per transaction',
      icon: CreditCard,
    },
    {
      value: 'square',
      label: 'Square',
      description: 'All-in-one payments with 2.6% + 10¢ per transaction',
      icon: DollarSign,
    },
    {
      value: 'clover',
      label: 'Clover',
      description: 'Point-of-sale system with integrated payments',
      icon: Check,
    },
    {
      value: 'pc_bancard',
      label: 'PC Bancard',
      description: 'Martial arts industry specialist with competitive rates',
      icon: CreditCard,
    },
    {
      value: 'none',
      label: 'Set Up Later',
      description: 'Skip for now and configure payment processing later',
      icon: null,
    },
  ];

  const selectedProcessor = processors.find((p) => p.value === formData.processor);
  const showCredentials = formData.processor !== 'none';

  return (
    <div className="space-y-6">
      {/* Kai Bubble */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{avatarName} says:</span> "Let's set up your payment processor so you can accept payments from students. Choose the provider that works best for your business, or skip this step and set it up later."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Payment Processor Setup</h2>
          <p className="text-sm text-muted-foreground">
            Configure how you'll accept payments from students
          </p>
        </div>

        {/* Processor Selection */}
        <div className="space-y-3">
          <Label>Select Your Payment Processor</Label>
          <RadioGroup
            value={formData.processor}
            onValueChange={(value) => handleChange('processor', value)}
          >
            <div className="space-y-3">
              {processors.map((processor) => (
                <div
                  key={processor.value}
                  className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.processor === processor.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleChange('processor', processor.value)}
                >
                  <RadioGroupItem
                    value={processor.value}
                    id={processor.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {processor.icon && <processor.icon className="h-5 w-5 text-primary" />}
                      <Label
                        htmlFor={processor.value}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {processor.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {processor.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Credentials Input (only if not "none") */}
        {showCredentials && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedProcessor?.label} Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  API Key / Secret Key
                  {formData.processor !== 'none' && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk_test_..."
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  required={formData.processor !== 'none'}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your {selectedProcessor?.label} dashboard under API settings
                </p>
              </div>

              {formData.processor === 'stripe' && (
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Publishable Key (Optional)</Label>
                  <Input
                    id="merchantId"
                    type="text"
                    placeholder="pk_test_..."
                    value={formData.merchantId}
                    onChange={(e) => handleChange('merchantId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for client-side payment forms
                  </p>
                </div>
              )}

              {formData.processor === 'square' && (
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Application ID (Optional)</Label>
                  <Input
                    id="merchantId"
                    type="text"
                    placeholder="sq0idp-..."
                    value={formData.merchantId}
                    onChange={(e) => handleChange('merchantId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your Square Developer Dashboard
                  </p>
                </div>
              )}

              {formData.processor === 'clover' && (
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Merchant ID (Optional)</Label>
                  <Input
                    id="merchantId"
                    type="text"
                    placeholder="MERCHANT_ID"
                    value={formData.merchantId}
                    onChange={(e) => handleChange('merchantId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your Clover Dashboard
                  </p>
                </div>
              )}

              {formData.processor === 'pc_bancard' && (
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Merchant ID (Optional)</Label>
                  <Input
                    id="merchantId"
                    type="text"
                    placeholder="Enter your PC Bancard Merchant ID"
                    value={formData.merchantId}
                    onChange={(e) => handleChange('merchantId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact PC Bancard support to obtain your merchant credentials
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  🔒 Your payment credentials are encrypted and stored securely. We never store credit card information directly.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          {formData.processor !== 'none' && (
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={updatePaymentMutation.isPending}
            >
              Skip for Now
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={
              updatePaymentMutation.isPending ||
              (showCredentials && !formData.apiKey && formData.processor !== 'none')
            }
            className="gap-2"
          >
            {updatePaymentMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Continue to Review
          </Button>
        </div>
      </div>
    </div>
  );
}
