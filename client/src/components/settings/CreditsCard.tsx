/**
 * CreditsCard — displays real DojoFlow AI credits from the database.
 * Shows current balance, usage, and allows purchasing credit packages.
 */

import { useState } from 'react'
import { CreditCard, RefreshCw, Zap, Plus, Check, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'
import { toast } from 'sonner'

const CREDIT_PACKAGES = [
  { id: 'starter', label: 'Starter', credits: 1000, price: '$49', priceNum: 49, popular: false, description: '~1,000 AI messages' },
  { id: 'growth', label: 'Growth', credits: 3000, price: '$99', priceNum: 99, popular: true, description: '~3,000 AI messages' },
  { id: 'pro', label: 'Pro', credits: 7500, price: '$199', priceNum: 199, popular: false, description: '~7,500 AI messages' },
  { id: 'scale', label: 'Scale', credits: 20000, price: '$449', priceNum: 449, popular: false, description: '~20,000 AI messages' },
]

function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f97316' : '#22c55e'
  return (
    <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

function AddCreditsModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selected, setSelected] = useState<string | null>('growth')
  const [confirming, setConfirming] = useState(false)

  const utils = trpc.useUtils()
  const addCreditsMutation = trpc.credits.adminAddCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.amountAdded.toLocaleString()} credits added! New balance: ${data.newBalance.toLocaleString()}`)
      utils.credits.getBalance.invalidate()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      toast.error(`Failed to add credits: ${err.message}`)
      setConfirming(false)
    },
  })

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selected)

  const handlePurchase = () => {
    if (!selectedPkg) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    addCreditsMutation.mutate({
      amount: selectedPkg.credits,
      source: 'top_up',
      description: `Credit package: ${selectedPkg.label} (${selectedPkg.credits.toLocaleString()} credits)`,
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '480px', maxWidth: '90vw',
          backgroundColor: 'oklch(0.12 0.006 25)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Add Credits</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
              Credits power Kai AI, SMS, email, and automation features
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Package grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {CREDIT_PACKAGES.map(pkg => {
            const isSelected = selected === pkg.id
            return (
              <button
                key={pkg.id}
                onClick={() => { setSelected(pkg.id); setConfirming(false) }}
                style={{
                  position: 'relative',
                  padding: '16px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid rgba(239,68,68,0.7)' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease',
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(239,68,68,0.9)', color: 'white',
                    fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{pkg.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1 }}>{pkg.credits.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>credits</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>{pkg.description}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: isSelected ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.7)', marginTop: '8px' }}>{pkg.price}</div>
              </button>
            )
          })}
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={!selectedPkg || addCreditsMutation.isPending}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: confirming ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
            color: 'white',
            fontSize: '15px',
            fontWeight: '700',
            cursor: selectedPkg && !addCreditsMutation.isPending ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms ease',
            opacity: !selectedPkg ? 0.5 : 1,
          }}
        >
          {addCreditsMutation.isPending ? (
            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
          ) : confirming ? (
            <><Check size={16} /> Confirm — Add {selectedPkg?.credits.toLocaleString()} credits for {selectedPkg?.price}</>
          ) : (
            <><Plus size={16} /> Add {selectedPkg?.credits.toLocaleString()} credits for {selectedPkg?.price}</>
          )}
        </button>
        {confirming && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '8px' }}>
            Click again to confirm the purchase
          </p>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function CreditsCard() {
  const { user } = useAuth()
  const orgId = user?.activeOrgId
  const [showAddCredits, setShowAddCredits] = useState(false)

  const utils = trpc.useUtils()
  const {
    data: balance,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: !!orgId,
    refetchInterval: 30_000,
  })

  const fmt = (n: number) => n.toLocaleString()
  const creditsRemaining = balance?.creditsRemaining ?? 0
  const creditsUsed = balance?.creditsUsed ?? 0
  const planAllowance = balance?.planAllowance ?? 0
  const totalCredits = creditsRemaining + creditsUsed
  const warningLevel = balance?.warningLevel ?? 'none'

  const warningColor =
    warningLevel === 'blocking' || warningLevel === 'critical'
      ? '#ef4444'
      : warningLevel === 'warning'
      ? '#f97316'
      : '#22c55e'

  return (
    <div>
      {/* Section header */}
      <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} color="white" />
          Credits
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}
        >
          <RefreshCw size={14} style={{ animation: isRefetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Loading credits…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Balance highlight */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Available credits</span>
              <span style={{ fontSize: '28px', fontWeight: '700', color: warningColor }}>{fmt(creditsRemaining)}</span>
            </div>

            {/* Usage bar */}
            {totalCredits > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  <span>{fmt(creditsUsed)} used</span>
                  <span>{fmt(totalCredits)} total</span>
                </div>
                <ProgressBar used={creditsUsed} total={totalCredits} />
              </div>
            )}

            {/* Warning banner */}
            {(warningLevel === 'warning' || warningLevel === 'critical' || warningLevel === 'blocking') && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: warningLevel === 'blocking' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.1)',
                border: `1px solid ${warningLevel === 'blocking' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.2)'}`,
              }}>
                <Zap size={14} color={warningColor} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {warningLevel === 'blocking'
                    ? 'Credits exhausted — AI features are paused. Add credits to resume.'
                    : warningLevel === 'critical'
                    ? 'Critical: Very low credits. Add more to avoid interruption.'
                    : 'Low credits — consider topping up soon.'}
                </span>
              </div>
            )}

            {/* Credit cost reference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '4px' }}>CREDIT COSTS</div>
              {[
                { label: 'Kai AI message', cost: '1 credit' },
                { label: 'SMS message', cost: '1 credit' },
                { label: 'Email', cost: '2 credits' },
                { label: 'Phone call (per min)', cost: '10 credits' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{item.cost}</span>
                </div>
              ))}
            </div>

            {/* Add credits button */}
            <button
              onClick={() => setShowAddCredits(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: 'rgba(239,68,68,0.9)',
                fontSize: '14px', fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)' }}
            >
              <Plus size={15} />
              Add Credits
            </button>
          </div>
        )}
      </div>

      {showAddCredits && (
        <AddCreditsModal
          onClose={() => setShowAddCredits(false)}
          onSuccess={() => utils.credits.getBalance.invalidate()}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
