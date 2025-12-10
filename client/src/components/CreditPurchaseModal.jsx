import { useState } from 'react'
import { X, CreditCard, Zap } from 'lucide-react'

const CREDIT_PACKAGES = [
  {
    amount: 500,
    price: 10,
    perCredit: 2.00,
    popular: false
  },
  {
    amount: 1000,
    price: 18,
    perCredit: 1.80,
    popular: false
  },
  {
    amount: 2500,
    price: 40,
    perCredit: 1.60,
    popular: true
  },
  {
    amount: 5000,
    price: 75,
    perCredit: 1.50,
    popular: false
  }
]

export default function CreditPurchaseModal({ isOpen, onClose, organizationId = 1 }) {
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePurchase = async (creditAmount) => {
    setLoading(true)
    setError(null)

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credit_amount: creditAmount,
          email: 'owner@dojo.com',  // TODO: Get from user session
          org_name: 'Default Dojo',  // TODO: Get from organization
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Purchase Credits</h2>
            <p className="text-sm text-slate-400 mt-1">
              Credits never expire and stack with your monthly allocation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        {/* Credit Packages */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.amount}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedPackage === pkg.amount
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                } ${pkg.popular ? 'ring-2 ring-emerald-500/50' : ''}`}
                onClick={() => setSelectedPackage(pkg.amount)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Zap className="h-8 w-8 text-emerald-400" />
                  </div>

                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    {pkg.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400 mb-4">credits</div>

                  <div className="text-2xl font-bold text-white mb-1">
                    ${pkg.price}
                  </div>
                  <div className="text-xs text-slate-400">
                    ${pkg.perCredit.toFixed(2)}/100 credits
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePurchase(pkg.amount)
                    }}
                    disabled={loading}
                    className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPackage === pkg.amount
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-400 font-medium mb-1">
                  Secure Payment via Stripe
                </p>
                <p className="text-xs text-slate-400">
                  All payments are processed securely through Stripe. Credits are added to your account immediately after payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

