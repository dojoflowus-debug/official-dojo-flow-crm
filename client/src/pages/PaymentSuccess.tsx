import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Zap, ArrowRight } from 'lucide-react'

export default function PaymentSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState(null)

  useEffect(() => {
    // Get session_id from URL query params
    const params = new URLSearchParams(location.search)
    const sid = params.get('session_id')
    
    if (sid) {
      setSessionId(sid)
      // TODO: Optionally fetch payment details from backend using session_id
    }
    
    setLoading(false)
    
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/subscription')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [location, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Processing payment...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl border-2 border-emerald-500 p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-400 text-lg">
            Thank you for your purchase
          </p>
        </div>

        {/* Details */}
        <div className="bg-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-400" fill="currentColor" />
            <span className="text-emerald-300 font-semibold">
              Credits Added to Your Account
            </span>
          </div>
          <p className="text-slate-300 text-sm">
            Your credits have been added and are ready to use immediately.
            You can view your updated balance in the subscription dashboard.
          </p>
          
          {sessionId && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <p className="text-xs text-slate-500">
                Transaction ID: {sessionId.substring(0, 20)}...
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            View Subscription Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 px-6 rounded-lg font-semibold transition-all"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-xs text-slate-500 mt-6">
          Redirecting to subscription dashboard in 5 seconds...
        </p>
      </div>
    </div>
  )
}

