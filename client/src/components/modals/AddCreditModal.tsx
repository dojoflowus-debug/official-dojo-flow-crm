import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'

interface AddCreditModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddCreditModal({ isOpen, onClose }: AddCreditModalProps) {
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<any[]>([])

  useEffect(() => {
    if (!isOpen) return

    const fetchPricing = async () => {
      try {
        const result = await trpc.credits.getCreditTopUpPricing.query()
        if (result && Array.isArray(result)) {
          setPackages(result)
        }
      } catch (err) {
        console.error('Failed to fetch pricing:', err)
        setError('Failed to load credit packages')
      }
    }

    fetchPricing()
  }, [isOpen])

  const handleContinue = async () => {
    if (!selectedId || !user?.activeOrgId) return

    setIsLoading(true)
    setError(null)

    try {
      const pkg = packages.find((p: any) => p.id === selectedId)
      if (!pkg) {
        setError('Package not found')
        setIsLoading(false)
        return
      }

      const result = await trpc.subscription.createCreditTopUpCheckout.mutate({
        organizationId: user.activeOrgId,
        priceId: pkg.priceId,
        credits: pkg.credits,
      })

      if (result && result.url) {
        window.location.href = result.url
      } else {
        setError('Failed to create checkout')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Failed to create checkout')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Credits</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Packages List */}
        <div className="space-y-2 mb-6">
          {packages.length === 0 ? (
            <div className="text-center py-4 text-white/60">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            packages.map((pkg: any) => (
              <label
                key={pkg.id}
                className="flex items-center p-3 rounded border border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  checked={selectedId === pkg.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-white font-semibold">
                    {pkg.credits.toLocaleString()} credits
                  </div>
                  <div className="text-sm text-white/60">
                    ${(pkg.price / 100).toFixed(2)}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedId || isLoading}
            className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
