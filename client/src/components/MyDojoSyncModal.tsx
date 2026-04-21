/**
 * IntegrationsModal (formerly MyDojoSyncModal)
 *
 * A generic integrations hub that lets each organization connect
 * their own external tools: GoHighLevel, Mindbody, Zen Planner,
 * custom webhooks, and more.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import {
  X,
  CheckCircle2,
  Webhook,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface IntegrationsModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncComplete?: () => void
}

interface Connector {
  id: string
  name: string
  description: string
  category: string
  logo: string
  color: string
  docsUrl?: string
  webhookPath?: string
  apiKeyLabel?: string
  comingSoon?: boolean
}

const CONNECTORS: Connector[] = [
  {
    id: 'ghl',
    name: 'GoHighLevel',
    description: 'Sync leads from GHL funnels, automations, and pipelines directly into DojoFlow.',
    category: 'CRM & Marketing',
    logo: '⚡',
    color: 'from-orange-500 to-yellow-500',
    docsUrl: 'https://highlevel.com',
    webhookPath: '/api/webhooks/lead',
    apiKeyLabel: 'API Key (x-api-key header)',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect DojoFlow to 5,000+ apps via Zapier automations.',
    category: 'CRM & Marketing',
    logo: '⚙️',
    color: 'from-orange-400 to-red-400',
    docsUrl: 'https://zapier.com',
    webhookPath: '/api/webhooks/lead',
    apiKeyLabel: 'API Key (x-api-key header)',
  },
  {
    id: 'mindbody',
    name: 'Mindbody',
    description: 'Import clients and class bookings from Mindbody into your DojoFlow roster.',
    category: 'Studio Management',
    logo: '🧘',
    color: 'from-blue-500 to-cyan-500',
    comingSoon: true,
  },
  {
    id: 'zenplanner',
    name: 'Zen Planner',
    description: 'Pull member data and attendance records from Zen Planner automatically.',
    category: 'Studio Management',
    logo: '🥋',
    color: 'from-purple-500 to-indigo-500',
    comingSoon: true,
  },
  {
    id: 'jackrabbit',
    name: 'Jackrabbit',
    description: 'Sync student enrollments and billing data from Jackrabbit Class.',
    category: 'Studio Management',
    logo: '🐇',
    color: 'from-green-500 to-teal-500',
    comingSoon: true,
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Send lead data from any website, form, or tool to DojoFlow via HTTP POST.',
    category: 'Developer',
    logo: '🔗',
    color: 'from-slate-500 to-slate-700',
    webhookPath: '/api/webhooks/lead',
    apiKeyLabel: 'API Key (x-api-key header)',
  },
]

export default function MyDojoSyncModal({ isOpen, onClose }: IntegrationsModalProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark' || theme === 'cinematic'
  const { toast } = useToast()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const baseUrl = window.location.origin

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} copied`, description: 'Pasted to clipboard.' })
    })
  }

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (!isOpen) return null

  const categories = [...new Set(CONNECTORS.map(c => c.category))]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-[#111111] border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#FF7043] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Integrations
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                Connect your external tools to DojoFlow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universal webhook info box */}
        <div className={`mx-6 mt-5 p-4 rounded-xl border ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Webhook className={`w-4 h-4 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
              Your Universal Lead Webhook
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className={`flex-1 text-xs px-3 py-2 rounded-lg font-mono truncate ${
              isDarkMode ? 'bg-black/40 text-green-400' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {baseUrl}/api/webhooks/lead
            </code>
            <button
              onClick={() => handleCopy(`${baseUrl}/api/webhooks/lead`, 'Webhook URL')}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
            POST JSON with <code className="font-mono">firstName</code>, <code className="font-mono">lastName</code>, <code className="font-mono">email</code>, <code className="font-mono">phone</code>, <code className="font-mono">source</code> — include your API key in the <code className="font-mono">x-api-key</code> header.
          </p>
        </div>

        {/* Connector cards by category */}
        <div className="px-6 pb-6 mt-5 space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
                isDarkMode ? 'text-white/30' : 'text-slate-400'
              }`}>
                {category}
              </h3>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === category).map(connector => (
                  <div
                    key={connector.id}
                    className={`rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${connector.comingSoon ? 'opacity-60' : ''}`}
                  >
                    <button
                      className="w-full flex items-center gap-4 px-4 py-3 text-left"
                      onClick={() => !connector.comingSoon && handleToggle(connector.id)}
                      disabled={connector.comingSoon}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${connector.color} flex items-center justify-center text-xl flex-shrink-0`}>
                        {connector.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {connector.name}
                          </span>
                          {connector.comingSoon && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                          {connector.description}
                        </p>
                      </div>
                      {!connector.comingSoon && (
                        expandedId === connector.id
                          ? <ChevronUp className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
                          : <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
                      )}
                    </button>

                    {expandedId === connector.id && !connector.comingSoon && (
                      <div className={`px-4 pb-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                        <div className="pt-3 space-y-3">
                          {connector.webhookPath && (
                            <div>
                              <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                                Webhook URL
                              </label>
                              <div className="flex items-center gap-2">
                                <code className={`flex-1 text-xs px-3 py-2 rounded-lg font-mono truncate ${
                                  isDarkMode ? 'bg-black/40 text-green-400' : 'bg-slate-50 text-slate-700 border border-slate-200'
                                }`}>
                                  {baseUrl}{connector.webhookPath}
                                </code>
                                <button
                                  onClick={() => handleCopy(`${baseUrl}${connector.webhookPath}`, 'Webhook URL')}
                                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-500'}`}
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {connector.apiKeyLabel && (
                            <div>
                              <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                                {connector.apiKeyLabel}
                              </label>
                              <p className={`text-xs ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                                Go to <strong>Settings → API Keys</strong> to generate or view your organization's API key.
                              </p>
                            </div>
                          )}

                          {connector.docsUrl && (
                            <a
                              href={connector.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#E53935] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View {connector.name} docs
                            </a>
                          )}

                          <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            Webhook endpoint active — ready to receive data
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 px-6 py-4 border-t flex items-center justify-between ${
          isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-xs ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
            Need a custom integration? Contact support.
          </p>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
