import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  DollarSign,
  Lock
} from 'lucide-react'

export default function Step4Payment({ data, updateData }) {
  const [selectedProvider, setSelectedProvider] = useState(data.payment.provider || '')
  const [formData, setFormData] = useState(data.payment)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load existing settings
  useEffect(() => {
    loadExistingSettings()
  }, [])

  const loadExistingSettings = async () => {
    try {
      const response = await fetch('/api/settings/school')
      if (response.ok) {
        const settings = await response.json()
        if (settings.payment_provider) {
          setSelectedProvider(settings.payment_provider)
          setFormData({
            provider: settings.payment_provider,
            stripe_publishable_key: settings.stripe_publishable_key || '',
            square_location_id: settings.square_location_id || '',
            // API keys are never sent from backend for security
            stripe_api_key: '',
            stripe_webhook_secret: '',
            square_access_token: ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider)
    setFormData({ ...formData, provider })
    updateData('payment', { ...formData, provider })
    setTestResult(null)
  }

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData('payment', newData)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const testData = {
        provider: selectedProvider
      }

      if (selectedProvider === 'stripe') {
        testData.api_key = formData.stripe_api_key
      } else if (selectedProvider === 'square') {
        testData.access_token = formData.square_access_token
      }

      const response = await fetch('/api/settings/payment/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTestResult({
          success: true,
          message: result.message,
          details: result.account_name || result.merchant_name
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Connection failed'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error. Please try again.'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/payment/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        console.log('Payment settings saved successfully')
      } else {
        alert('Failed to save payment settings')
      }
    } catch (error) {
      console.error('Error saving payment settings:', error)
      alert('Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save when test is successful
  useEffect(() => {
    if (testResult?.success) {
      handleSave()
    }
  }, [testResult])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Gateway</h2>
        <p className="text-muted-foreground">
          Connect your payment processor to accept payments from students. You can skip this step and set it up later.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <Label>Choose your payment provider:</Label>
        <div className="grid grid-cols-3 gap-4">
          <Card
            className={`cursor-pointer transition-all ${
              selectedProvider === 'stripe'
                ? 'border-red-500 bg-red-500/5'
                : 'border-border/40 hover:border-border'
            }`}
            onClick={() => handleProviderSelect('stripe')}
          >
            <CardContent className="p-6 text-center">
              <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                selectedProvider === 'stripe' ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <h3 className="font-semibold">Stripe</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Popular & easy
              </p>
              {selectedProvider === 'stripe' && (
                <CheckCircle2 className="h-5 w-5 text-red-500 mx-auto mt-2" />
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedProvider === 'square'
                ? 'border-red-500 bg-red-500/5'
                : 'border-border/40 hover:border-border'
            }`}
            onClick={() => handleProviderSelect('square')}
          >
            <CardContent className="p-6 text-center">
              <DollarSign className={`h-8 w-8 mx-auto mb-2 ${
                selectedProvider === 'square' ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <h3 className="font-semibold">Square</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All-in-one
              </p>
              {selectedProvider === 'square' && (
                <CheckCircle2 className="h-5 w-5 text-red-500 mx-auto mt-2" />
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedProvider === 'manual'
                ? 'border-red-500 bg-red-500/5'
                : 'border-border/40 hover:border-border'
            }`}
            onClick={() => handleProviderSelect('manual')}
          >
            <CardContent className="p-6 text-center">
              <Lock className={`h-8 w-8 mx-auto mb-2 ${
                selectedProvider === 'manual' ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <h3 className="font-semibold">Manual</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Track manually
              </p>
              {selectedProvider === 'manual' && (
                <CheckCircle2 className="h-5 w-5 text-red-500 mx-auto mt-2" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stripe Configuration */}
      {selectedProvider === 'stripe' && (
        <Card className="border-border/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Configuration
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Publishable Key *</Label>
                <Input
                  placeholder="pk_live_..."
                  value={formData.stripe_publishable_key}
                  onChange={(e) => handleChange('stripe_publishable_key', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Starts with pk_live_ or pk_test_
                </p>
              </div>

              <div className="space-y-2">
                <Label>Secret Key *</Label>
                <Input
                  type="password"
                  placeholder="sk_live_..."
                  value={formData.stripe_api_key}
                  onChange={(e) => handleChange('stripe_api_key', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Starts with sk_live_ or sk_test_ (encrypted and secure)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (optional)</Label>
                <Input
                  type="password"
                  placeholder="whsec_..."
                  value={formData.stripe_webhook_secret}
                  onChange={(e) => handleChange('stripe_webhook_secret', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For webhook event verification
                </p>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={testing || !formData.stripe_api_key}
                variant="outline"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Square Configuration */}
      {selectedProvider === 'square' && (
        <Card className="border-border/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Square Configuration
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Token *</Label>
                <Input
                  type="password"
                  placeholder="sq0atp-..."
                  value={formData.square_access_token}
                  onChange={(e) => handleChange('square_access_token', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  From Square Developer Dashboard (encrypted and secure)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Location ID (optional)</Label>
                <Input
                  placeholder="L..."
                  value={formData.square_location_id}
                  onChange={(e) => handleChange('square_location_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Square location identifier
                </p>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={testing || !formData.square_access_token}
                variant="outline"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Payment Info */}
      {selectedProvider === 'manual' && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You've selected manual payment tracking. You can record payments manually in the system without automatic processing. You can set up a payment gateway later from Settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testResult && (
        <Alert className={testResult.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            <p className="font-semibold">{testResult.message}</p>
            {testResult.details && (
              <p className="text-sm mt-1">Account: {testResult.details}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {saving && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
    </div>
  )
}

