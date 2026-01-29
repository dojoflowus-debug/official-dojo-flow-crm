import React, { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  CreditCard, Wifi, WifiOff, RefreshCw, Key, Trash2, 
  Copy, CheckCircle2, XCircle, AlertCircle, Zap, 
  TestTube, DollarSign, Globe, Terminal, Clock, Bell,
  Percent, ChevronDown, ChevronUp, FileText, Shield, Building2, ArrowRight
} from 'lucide-react'
import { useModal } from '@/contexts/ModalContext'

// Card component for consistent styling
const SettingsCard = ({ 
  title, 
  icon: Icon, 
  children,
  status,
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  status?: 'connected' | 'disconnected' | 'error'
}) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ 
      fontSize: '16px', 
      fontWeight: '600', 
      color: 'white', 
      marginBottom: '12px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={18} color="white" />
        {title}
      </div>
      {status && (
        <span style={{
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: status === 'connected' ? 'rgba(34, 197, 94, 0.2)' : 
                          status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                          'rgba(255, 255, 255, 0.1)',
          color: status === 'connected' ? '#22c55e' : 
                 status === 'error' ? '#ef4444' : 
                 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {status === 'connected' ? <CheckCircle2 size={12} /> : 
           status === 'error' ? <XCircle size={12} /> : 
           <WifiOff size={12} />}
          {status === 'connected' ? 'Connected' : 
           status === 'error' ? 'Error' : 
           'Disconnected'}
        </span>
      )}
    </div>
    <div style={{
      padding: '24px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {children}
    </div>
  </div>
)

// Input field component
const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  required,
  helpText,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  helpText?: string
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '14px', 
      color: 'rgba(255, 255, 255, 0.7)', 
      marginBottom: '6px',
    }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: disabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
        color: disabled ? 'rgba(255, 255, 255, 0.4)' : 'white',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 200ms ease',
      }}
      onFocus={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = '#ef4444'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
      }}
    />
    {helpText && (
      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
        {helpText}
      </div>
    )}
  </div>
)

// Toggle switch component
const Toggle = ({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) => (
  <label style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }}>
    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{label}</span>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: checked ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 200ms ease',
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '3px',
        left: checked ? '23px' : '3px',
        transition: 'left 200ms ease',
      }} />
    </button>
  </label>
)

// Primary button component
const PrimaryButton = ({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: '10px 20px',
      borderRadius: '8px',
      border: variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
      backgroundColor: variant === 'primary' ? '#ef4444' : 
                       variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 
                       'transparent',
      color: variant === 'danger' ? '#ef4444' : 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 200ms ease',
    }}
    onMouseEnter={(e) => {
      if (!disabled && !loading) {
        e.currentTarget.style.opacity = '0.9'
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = disabled || loading ? '0.6' : '1'
    }}
  >
    {loading && <RefreshCw size={16} className="animate-spin" />}
    {children}
  </button>
)

// Dual Pricing Card Component
const DualPricingCard = ({ isConnected }: { isConnected: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Dual pricing state
  const [enabled, setEnabled] = useState(false)
  const [posEnabled, setPosEnabled] = useState(false)
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(false)
  const [cashDiscountPercent, setCashDiscountPercent] = useState('3.99')
  const [receiptDisclosureText, setReceiptDisclosureText] = useState(
    'A discount is applied for cash or check payments. The listed price is the card price.'
  )
  const [complianceAcknowledged, setComplianceAcknowledged] = useState(false)
  
  // Fetch dual pricing settings
  const dualPricingQuery = trpc.paymentProvider.getDualPricingSettings.useQuery(undefined, {
    enabled: isConnected,
  })
  
  // Update mutation
  const updateMutation = trpc.paymentProvider.updateDualPricingSettings.useMutation()
  
  // Sync state with query data
  useEffect(() => {
    if (dualPricingQuery.data) {
      setEnabled(dualPricingQuery.data.enabled)
      setPosEnabled(dualPricingQuery.data.posEnabled)
      setSubscriptionsEnabled(dualPricingQuery.data.subscriptionsEnabled)
      setCashDiscountPercent(dualPricingQuery.data.cashDiscountPercent.toString())
      setReceiptDisclosureText(dualPricingQuery.data.receiptDisclosureText)
      setComplianceAcknowledged(dualPricingQuery.data.complianceAcknowledged)
    }
  }, [dualPricingQuery.data])
  
  const handleSave = async () => {
    if (!complianceAcknowledged && enabled) {
      toast.error('Please acknowledge the compliance requirements before enabling dual pricing')
      return
    }
    
    setSaving(true)
    try {
      await updateMutation.mutateAsync({
        enabled,
        posEnabled,
        subscriptionsEnabled,
        cashDiscountPercent: parseFloat(cashDiscountPercent),
        receiptDisclosureText,
        complianceAcknowledged,
      })
      toast.success('Dual pricing settings saved')
      dualPricingQuery.refetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  // Calculate example prices
  const exampleCardPrice = 10000 // $100.00 in cents
  const discountAmount = Math.round(exampleCardPrice * (parseFloat(cashDiscountPercent) / 100))
  const exampleCashPrice = exampleCardPrice - discountAmount
  
  return (
    <SettingsCard title="Dual Pricing / Cash Discount" icon={Percent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info Banner */}
        <div style={{ 
          padding: '12px', 
          borderRadius: '8px', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ fontSize: '13px', color: '#60a5fa', marginBottom: '4px', fontWeight: '500' }}>
            What is Dual Pricing?
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Dual pricing displays both a card price and a discounted cash price. Customers who pay with cash or check receive a discount (typically 3.99%). This is compliant when properly disclosed.
          </div>
        </div>
        
        {/* Main Toggle */}
        <Toggle
          label="Enable dual pricing"
          checked={enabled}
          onChange={setEnabled}
          disabled={!isConnected}
        />
        
        {enabled && (
          <>
            {/* Context Toggles */}
            <div style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'white', marginBottom: '12px' }}>
                Apply To
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Toggle
                  label="POS Transactions"
                  checked={posEnabled}
                  onChange={setPosEnabled}
                />
                <Toggle
                  label="Subscription Payments"
                  checked={subscriptionsEnabled}
                  onChange={setSubscriptionsEnabled}
                />
              </div>
            </div>
            
            {/* Discount Percentage */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '8px' 
              }}>
                Cash Discount Percentage
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={cashDiscountPercent}
                  onChange={(e) => setCashDiscountPercent(e.target.value)}
                  min="0"
                  max="10"
                  step="0.01"
                  style={{
                    width: '100px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>%</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                PC Bank Cards default: 3.99%
              </div>
            </div>
            
            {/* Price Preview */}
            <div style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              <div style={{ fontSize: '13px', color: '#22c55e', marginBottom: '8px', fontWeight: '500' }}>
                Example Pricing Display
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Card Price</div>
                  <div style={{ fontSize: '18px', color: 'white', fontWeight: '600' }}>
                    ${(exampleCardPrice / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Cash Price</div>
                  <div style={{ fontSize: '18px', color: '#22c55e', fontWeight: '600' }}>
                    ${(exampleCashPrice / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Savings</div>
                  <div style={{ fontSize: '18px', color: '#f59e0b', fontWeight: '600' }}>
                    ${(discountAmount / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Receipt Disclosure Text */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '8px' 
              }}>
                Receipt Disclosure Text
              </label>
              <textarea
                value={receiptDisclosureText}
                onChange={(e) => setReceiptDisclosureText(e.target.value)}
                rows={3}
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                This text will appear on receipts and checkout screens
              </div>
            </div>
            
            {/* Compliance Checklist */}
            <div style={{ 
              borderRadius: '8px', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="#f59e0b" />
                  Compliance Checklist
                </div>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {expanded && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '12px' }}>
                    Dual pricing / cash discounting has specific compliance requirements. Please ensure you follow these guidelines:
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {[
                      'Post clear signage at your location showing both cash and card prices',
                      'Display both prices on all menus, price lists, and invoices',
                      'Include disclosure text on all receipts',
                      'Train staff to explain the pricing clearly to customers',
                      'Follow your state/local regulations on cash discounting',
                      'Comply with card network rules (Visa, Mastercard, etc.)',
                    ].map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                      <strong>Important:</strong> Dual pricing is legal in most states when properly disclosed, but regulations vary. Consult with your payment processor and legal advisor to ensure compliance in your jurisdiction.
                    </div>
                  </div>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={complianceAcknowledged}
                      onChange={(e) => setComplianceAcknowledged(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      I acknowledge that I am responsible for ensuring compliance with all applicable laws and regulations regarding dual pricing.
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            {/* Save Button */}
            <PrimaryButton
              onClick={handleSave}
              loading={saving}
              disabled={!complianceAcknowledged}
            >
              <CheckCircle2 size={16} />
              Save Dual Pricing Settings
            </PrimaryButton>
          </>
        )}
        
        {!enabled && (
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Enable dual pricing to offer cash discounts to your customers.
          </div>
        )}
      </div>
    </SettingsCard>
  )
}

export function PaymentsSettingsTab() {
  // Connection form state
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX')
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  
  // UI state
  const [testing, setTesting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [rotatingKeys, setRotatingKeys] = useState(false)
  const [showRotateForm, setShowRotateForm] = useState(false)
  const [newPublicKey, setNewPublicKey] = useState('')
  const [newSecretKey, setNewSecretKey] = useState('')
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [sendingTestEvent, setSendingTestEvent] = useState(false)
  const [runningAuthTest, setRunningAuthTest] = useState(false)
  
  // Billing settings state
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [billingCadence, setBillingCadence] = useState<'monthly' | 'weekly' | 'custom'>('monthly')
  const [retryAttempts, setRetryAttempts] = useState(3)
  const [autoEmailReceipts, setAutoEmailReceipts] = useState(true)
  const [sendFailedPaymentNotices, setSendFailedPaymentNotices] = useState(true)
  const [posTrackingEnabled, setPosTrackingEnabled] = useState(false)
  const [posMode, setPosMode] = useState<'standalone_terminal' | 'integrated_checkout' | null>(null)
  
  // tRPC queries and mutations
  const statusQuery = trpc.paymentProvider.getStatus.useQuery()
  const eventsQuery = trpc.paymentProvider.getEvents.useQuery({ limit: 10 })
  const testConnectionMutation = trpc.paymentProvider.testConnection.useMutation()
  const connectMutation = trpc.paymentProvider.connect.useMutation()
  const disconnectMutation = trpc.paymentProvider.disconnect.useMutation()
  const rotateKeysMutation = trpc.paymentProvider.rotateKeys.useMutation()
  const updateBillingSettingsMutation = trpc.paymentProvider.updateBillingSettings.useMutation()
  const sendTestEventMutation = trpc.paymentProvider.sendTestEvent.useMutation()
  const runAuthTestMutation = trpc.paymentProvider.runAuthTest.useMutation()
  
  // Load billing settings from status
  useEffect(() => {
    if (statusQuery.data?.billingSettings) {
      const settings = statusQuery.data.billingSettings
      setRecurringEnabled(!!settings.recurringEnabled)
      setBillingCadence(settings.billingCadence || 'monthly')
      setRetryAttempts(settings.retryAttempts || 3)
      setAutoEmailReceipts(!!settings.autoEmailReceipts)
      setSendFailedPaymentNotices(!!settings.sendFailedPaymentNotices)
      setPosTrackingEnabled(!!settings.posTrackingEnabled)
      setPosMode(settings.posMode || null)
    }
  }, [statusQuery.data?.billingSettings])
  
  const isConnected = statusQuery.data?.connected
  const connectionStatus = statusQuery.isError ? 'error' : isConnected ? 'connected' : 'disconnected'
  
  // Webhook URL
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/fluidpay`
    : '/api/webhooks/fluidpay'
  
  // Test connection handler
  const handleTestConnection = async () => {
    if (!publicKey || !secretKey) {
      toast.error('Please enter both public and secret keys')
      return
    }
    
    setTesting(true)
    try {
      const result = await testConnectionMutation.mutateAsync({
        publicKey,
        secretKey,
        environment,
      })
      
      if (result.success) {
        toast.success('Connection test successful!', {
          description: `Gateway: ${result.health?.gatewayReachable ? '✓' : '✗'} | Auth: ${result.health?.authOk ? '✓' : '✗'} | Vault: ${result.health?.vaultEnabled ? '✓' : '✗'}`,
        })
      } else {
        toast.error('Connection test failed', { description: result.message })
      }
    } catch (error: any) {
      toast.error('Connection test failed', { description: error.message })
    } finally {
      setTesting(false)
    }
  }
  
  // Connect handler
  const handleConnect = async () => {
    if (!publicKey || !secretKey) {
      toast.error('Please enter both public and secret keys')
      return
    }
    
    setConnecting(true)
    try {
      const result = await connectMutation.mutateAsync({
        publicKey,
        secretKey,
        environment,
        merchantId: merchantId || undefined,
        terminalId: terminalId || undefined,
      })
      
      toast.success('FluidPay connected successfully!')
      statusQuery.refetch()
      
      // Clear form
      setPublicKey('')
      setSecretKey('')
    } catch (error: any) {
      toast.error('Failed to connect', { description: error.message })
    } finally {
      setConnecting(false)
    }
  }
  
  // Disconnect handler
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect FluidPay? This will remove your stored credentials.')) {
      return
    }
    
    setDisconnecting(true)
    try {
      await disconnectMutation.mutateAsync()
      toast.success('FluidPay disconnected')
      statusQuery.refetch()
    } catch (error: any) {
      toast.error('Failed to disconnect', { description: error.message })
    } finally {
      setDisconnecting(false)
    }
  }
  
  // Rotate keys handler
  const handleRotateKeys = async () => {
    if (!newPublicKey || !newSecretKey) {
      toast.error('Please enter both new public and secret keys')
      return
    }
    
    setRotatingKeys(true)
    try {
      await rotateKeysMutation.mutateAsync({
        publicKey: newPublicKey,
        secretKey: newSecretKey,
      })
      toast.success('Keys rotated successfully')
      statusQuery.refetch()
      setShowRotateForm(false)
      setNewPublicKey('')
      setNewSecretKey('')
    } catch (error: any) {
      toast.error('Failed to rotate keys', { description: error.message })
    } finally {
      setRotatingKeys(false)
    }
  }
  
  // Copy webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    toast.success('Webhook URL copied to clipboard')
    setTimeout(() => setCopiedWebhook(false), 2000)
  }
  
  // Save billing settings
  const handleSaveBillingSettings = async () => {
    try {
      await updateBillingSettingsMutation.mutateAsync({
        recurringEnabled,
        billingCadence,
        retryAttempts,
        autoEmailReceipts,
        sendFailedPaymentNotices,
        posTrackingEnabled,
        posMode,
      })
      toast.success('Billing settings saved')
    } catch (error: any) {
      toast.error('Failed to save settings', { description: error.message })
    }
  }
  
  // Send test event
  const handleSendTestEvent = async () => {
    setSendingTestEvent(true)
    try {
      await sendTestEventMutation.mutateAsync()
      toast.success('Test event sent')
      eventsQuery.refetch()
    } catch (error: any) {
      toast.error('Failed to send test event', { description: error.message })
    } finally {
      setSendingTestEvent(false)
    }
  }
  
  // Run auth test
  const handleRunAuthTest = async () => {
    setRunningAuthTest(true)
    try {
      const result = await runAuthTestMutation.mutateAsync()
      if (result.success) {
        toast.success('$1 auth test passed!', { description: result.message })
      } else {
        toast.error('Auth test failed', { description: result.message })
      }
    } catch (error: any) {
      toast.error('Auth test failed', { description: error.message })
    } finally {
      setRunningAuthTest(false)
    }
  }
  
  const { openSettings } = useModal()
  const pcBankCardStatus = trpc.pcBankCard.getStatus.useQuery()
  
  const handleOpenPCBankCard = () => {
    openSettings('pc-bank-card')
  }
  
  const getProcessorCTA = () => {
    const status = pcBankCardStatus.data?.status
    if (!status || status === 'DRAFT') return pcBankCardStatus.data?.currentStep > 1 ? 'Continue Application' : 'Apply Now'
    if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') return 'View Status'
    if (status === 'APPROVED') return 'Manage'
    if (status === 'NEEDS_CHANGES') return 'Resubmit'
    return 'Apply Now'
  }
  
  const getProcessorStatus = () => {
    const status = pcBankCardStatus.data?.status
    if (!status) return { label: 'Not Started', color: 'rgba(255, 255, 255, 0.3)' }
    if (status === 'DRAFT') return { label: 'Draft', color: '#f59e0b' }
    if (status === 'SUBMITTED') return { label: 'Submitted', color: '#3b82f6' }
    if (status === 'UNDER_REVIEW') return { label: 'Under Review', color: '#8b5cf6' }
    if (status === 'APPROVED') return { label: 'Approved', color: '#22c55e' }
    if (status === 'NEEDS_CHANGES') return { label: 'Needs Changes', color: '#ef4444' }
    return { label: 'Not Started', color: 'rgba(255, 255, 255, 0.3)' }
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Payment Processors Section */}
      <div>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Building2 size={20} />
          Payment Processors
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* FluidPay Card */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CreditCard size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                  FluidPay
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Accept credit/debit card payments
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: isConnected ? '#22c55e' : 'rgba(255, 255, 255, 0.6)',
              }}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <button style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              Manage
              <ArrowRight size={14} />
            </button>
          </div>
          
          {/* PC Bank Card */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={handleOpenPCBankCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Building2 size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                  PC Bank Card
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Premium processor onboarding
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: `${getProcessorStatus().color}33`,
                color: getProcessorStatus().color,
              }}>
                {getProcessorStatus().label}
              </span>
            </div>
            <button style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}>
              {getProcessorCTA()}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* FluidPay Configuration Section */}
      <div>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CreditCard size={20} />
          FluidPay Configuration
        </h3>
      </div>
      
      {/* Card 1: Payment Provider */}
      <SettingsCard title="Payment Provider" icon={CreditCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CreditCard size={24} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
              PC Bank Cards (FluidPay)
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Accept credit/debit card payments through FluidPay gateway
            </div>
          </div>
        </div>
      </SettingsCard>
      
      {/* Card 2: Connect FluidPay */}
      <SettingsCard 
        title="Connect FluidPay" 
        icon={Wifi} 
        status={connectionStatus}
      >
        {!isConnected ? (
          <>
            {/* Environment Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '8px' 
              }}>
                Environment
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['SANDBOX', 'PRODUCTION'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setEnvironment(env)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: environment === env ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: environment === env ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      color: environment === env ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {env === 'SANDBOX' ? '🧪 Sandbox' : '🚀 Production'}
                  </button>
                ))}
              </div>
            </div>
            
            <InputField
              label="Public Key"
              value={publicKey}
              onChange={setPublicKey}
              placeholder="Enter your FluidPay public key"
              required
            />
            
            <InputField
              label="Secret Key"
              value={secretKey}
              onChange={setSecretKey}
              type="password"
              placeholder="Enter your FluidPay secret key"
              required
              helpText="Your secret key will be encrypted and stored securely"
            />
            
            <InputField
              label="Merchant ID"
              value={merchantId}
              onChange={setMerchantId}
              placeholder="Optional - for webhook routing"
            />
            
            <InputField
              label="Terminal ID"
              value={terminalId}
              onChange={setTerminalId}
              placeholder="Optional - for POS transactions"
            />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <PrimaryButton
                onClick={handleTestConnection}
                loading={testing}
                variant="secondary"
              >
                <Wifi size={16} />
                Test Connection
              </PrimaryButton>
              
              <PrimaryButton
                onClick={handleConnect}
                loading={connecting}
                disabled={!publicKey || !secretKey}
              >
                <CheckCircle2 size={16} />
                Save & Enable
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            {/* Connected State */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Environment</span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: statusQuery.data?.environment === 'PRODUCTION' ? '#22c55e' : '#f59e0b' 
                }}>
                  {statusQuery.data?.environment === 'PRODUCTION' ? '🚀 Production' : '🧪 Sandbox'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Public Key</span>
                <span style={{ fontSize: '14px', color: 'white', fontFamily: 'monospace' }}>
                  ****{statusQuery.data?.publicKeyLast4}
                </span>
              </div>
              
              {statusQuery.data?.merchantId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Merchant ID</span>
                  <span style={{ fontSize: '14px', color: 'white' }}>{statusQuery.data.merchantId}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Last Verified</span>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {statusQuery.data?.lastVerifiedAt 
                    ? new Date(statusQuery.data.lastVerifiedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
            
            {/* Rotate Keys Form */}
            {showRotateForm && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'white', marginBottom: '12px' }}>
                  Rotate API Keys
                </div>
                <InputField
                  label="New Public Key"
                  value={newPublicKey}
                  onChange={setNewPublicKey}
                  placeholder="Enter new public key"
                  required
                />
                <InputField
                  label="New Secret Key"
                  value={newSecretKey}
                  onChange={setNewSecretKey}
                  type="password"
                  placeholder="Enter new secret key"
                  required
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <PrimaryButton
                    onClick={handleRotateKeys}
                    loading={rotatingKeys}
                    disabled={!newPublicKey || !newSecretKey}
                  >
                    <Key size={16} />
                    Rotate Keys
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => {
                      setShowRotateForm(false)
                      setNewPublicKey('')
                      setNewSecretKey('')
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </PrimaryButton>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <PrimaryButton
                onClick={() => setShowRotateForm(!showRotateForm)}
                variant="secondary"
              >
                <Key size={16} />
                Rotate Keys
              </PrimaryButton>
              
              <PrimaryButton
                onClick={handleDisconnect}
                loading={disconnecting}
                variant="danger"
              >
                <Trash2 size={16} />
                Disconnect
              </PrimaryButton>
            </div>
          </>
        )}
      </SettingsCard>
      
      {/* Card 3: Recurring Billing */}
      <SettingsCard title="Recurring Billing" icon={Clock}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Toggle
            label="Enable recurring billing"
            checked={recurringEnabled}
            onChange={setRecurringEnabled}
            disabled={!isConnected}
          />
          
          {recurringEnabled && (
            <>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  marginBottom: '8px' 
                }}>
                  Billing Cadence
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['monthly', 'weekly', 'custom'] as const).map((cadence) => (
                    <button
                      key={cadence}
                      onClick={() => setBillingCadence(cadence)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: billingCadence === cadence ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: billingCadence === cadence ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        color: billingCadence === cadence ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cadence}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Retry attempts:</span>
                <select
                  value={retryAttempts}
                  onChange={(e) => setRetryAttempts(Number(e.target.value))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              
              <Toggle
                label="Auto-email receipts"
                checked={autoEmailReceipts}
                onChange={setAutoEmailReceipts}
              />
              
              <Toggle
                label="Send failed payment notices"
                checked={sendFailedPaymentNotices}
                onChange={setSendFailedPaymentNotices}
              />
            </>
          )}
          
          <div style={{ marginTop: '8px' }}>
            <PrimaryButton
              onClick={handleSaveBillingSettings}
              disabled={!isConnected}
            >
              Save Settings
            </PrimaryButton>
          </div>
        </div>
      </SettingsCard>
      
      {/* Card 4: POS Transactions */}
      <SettingsCard title="POS Transactions" icon={Terminal}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Toggle
            label="Enable POS tracking"
            checked={posTrackingEnabled}
            onChange={setPosTrackingEnabled}
            disabled={!isConnected}
          />
          
          {posTrackingEnabled && (
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '8px' 
              }}>
                POS Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPosMode('standalone_terminal')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: posMode === 'standalone_terminal' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: posMode === 'standalone_terminal' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    color: posMode === 'standalone_terminal' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    flex: 1,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>Standalone Terminal</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Use separate card reader</div>
                </button>
                <button
                  onClick={() => setPosMode('integrated_checkout')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: posMode === 'integrated_checkout' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: posMode === 'integrated_checkout' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    color: posMode === 'integrated_checkout' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    flex: 1,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>Integrated Checkout</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>In-app payment flow</div>
                </button>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '8px' }}>
            <PrimaryButton
              onClick={handleSaveBillingSettings}
              disabled={!isConnected}
            >
              Save Settings
            </PrimaryButton>
          </div>
        </div>
      </SettingsCard>
      
      {/* Card 5: Webhooks & Events */}
      <SettingsCard title="Webhooks & Events" icon={Globe}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Webhook URL */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '8px' 
            }}>
              Webhook URL
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <code style={{ 
                flex: 1, 
                fontSize: '13px', 
                color: 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {webhookUrl}
              </code>
              <button
                onClick={handleCopyWebhook}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: copiedWebhook ? '#22c55e' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {copiedWebhook ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              Add this URL to your FluidPay dashboard webhook settings
            </div>
          </div>
          
          {/* Recent Events */}
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Recent Events</span>
              <button
                onClick={() => eventsQuery.refetch()}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            
            {eventsQuery.data?.events && eventsQuery.data.events.length > 0 ? (
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                {eventsQuery.data.events.map((event, index) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: index < eventsQuery.data.events.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: event.status === 'processed' ? '#22c55e' : 
                                        event.status === 'failed' ? '#ef4444' : 
                                        '#f59e0b',
                      }} />
                      <span style={{ fontSize: '13px', color: 'white', fontFamily: 'monospace' }}>
                        {event.eventType}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      {event.receivedAt ? new Date(event.receivedAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                No webhook events received yet
              </div>
            )}
          </div>
        </div>
      </SettingsCard>
      
      {/* Card 6: Dual Pricing / Cash Discount */}
      <DualPricingCard isConnected={isConnected} />
      
      {/* Card 7: Testing Mode */}
      <SettingsCard title="Testing Mode" icon={TestTube}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} color="#f59e0b" />
            <span style={{ fontSize: '13px', color: '#f59e0b' }}>
              Testing tools are only available in Sandbox mode
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <PrimaryButton
              onClick={handleSendTestEvent}
              loading={sendingTestEvent}
              disabled={!isConnected}
              variant="secondary"
            >
              <Zap size={16} />
              Send Test Event
            </PrimaryButton>
            
            <PrimaryButton
              onClick={handleRunAuthTest}
              loading={runningAuthTest}
              disabled={!isConnected || statusQuery.data?.environment !== 'SANDBOX'}
              variant="secondary"
            >
              <DollarSign size={16} />
              $1 Auth Test
            </PrimaryButton>
          </div>
          
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            The $1 auth test creates a temporary authorization that is immediately voided. Only available in Sandbox mode.
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}

export default PaymentsSettingsTab
