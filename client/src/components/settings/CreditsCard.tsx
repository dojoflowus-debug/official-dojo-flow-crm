/**
 * CreditsCard — displays real Manus platform credits fetched from the Forge API.
 * Falls back gracefully when the API is unavailable.
 */

import { CreditCard, RefreshCw, ExternalLink, Zap } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'

function CreditRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            fontSize: highlight ? '18px' : '14px',
            fontWeight: highlight ? '600' : '400',
            color: highlight ? 'white' : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {value}
        </span>
        {sub && (
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '2px' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f97316' : '#22c55e'
  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginTop: '4px',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

export function CreditsCard() {
  const { user } = useAuth()
  const orgId = user?.activeOrgId

  const {
    data: manusCredits,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.credits.getManusBalance.useQuery(undefined, {
    enabled: !!orgId,
    refetchInterval: 60_000,
  })

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} color="white" />
          Credits
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          title="Refresh credits"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: isRefetching ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '14px',
            }}
          >
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Loading credits…
          </div>
        ) : !manusCredits?.available ? (
          /* Forge API not configured — show graceful fallback */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Zap size={16} color="rgba(239,68,68,0.8)" />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                Credit data unavailable — Forge API not configured in this environment.
              </span>
            </div>
            <a
              href="https://manus.im/pricing"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'rgba(239, 68, 68, 0.8)',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={13} />
              Manage credits on Manus
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Free credits */}
            <CreditRow
              label="Free credits"
              value={fmt(manusCredits.freeCredits)}
              highlight
            />

            {/* Monthly credits with progress bar */}
            <div>
              <CreditRow
                label="Monthly credits"
                value={`${fmt(manusCredits.monthlyCreditsTotal - manusCredits.monthlyCreditsUsed)} / ${fmt(manusCredits.monthlyCreditsTotal)}`}
              />
              <ProgressBar
                used={manusCredits.monthlyCreditsUsed}
                total={manusCredits.monthlyCreditsTotal}
              />
            </div>

            {/* Daily refresh */}
            <CreditRow
              label="Daily refresh credits"
              value={fmt(manusCredits.dailyRefreshCredits)}
              sub={`Refreshes to ${fmt(manusCredits.dailyRefreshLimit)} at 23:00 every day`}
              highlight
            />

            {/* Total available */}
            <div
              style={{
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                Total available
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                {fmt(manusCredits.totalAvailable)}
              </span>
            </div>

            {/* Add credits CTA */}
            <a
              href={manusCredits.addCreditsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'rgba(239, 68, 68, 0.9)',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.backgroundColor = 'rgba(239, 68, 68, 0.25)'
                el.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'
                el.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <ExternalLink size={13} />
              Add Credits on Manus
            </a>
          </div>
        )}
      </div>

      {/* Spin keyframe injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
