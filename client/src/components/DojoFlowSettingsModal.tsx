import { useState, useEffect, useCallback } from 'react'
import { X, User, Building2, BarChart3, CreditCard, Calendar, Database, Palette, Puzzle, ChevronRight, ChevronDown, Copy, RefreshCw, CheckCircle, Key, Code, Globe } from 'lucide-react'
import KaiWebsiteAnalyzer from './KaiWebsiteAnalyzer'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'

function ConnectorsSection() {
  const { data, refetch } = trpc.kai.settings.getWidgetKey.useQuery()
  const regenerate = trpc.kai.settings.regenerateWidgetKey.useMutation({ onSuccess: () => refetch() })
  const [copied, setCopied] = useState<'key' | 'snippet' | null>(null)

  const orgId = data?.organizationId
  const apiKey = data?.widgetApiKey

  const embedSnippet = apiKey && orgId ? `<iframe\n  src="https://dojo-flow.ai/lead-capture?org=${orgId}"\n  data-api-key="${apiKey}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border-radius:12px;"\n></iframe>` : ''

  const copy = (text: string, type: 'key' | 'snippet') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Connectors</h2>
      <p className="text-zinc-400 mb-8">Connect third-party services and embed the KAI lead capture widget on your website.</p>

      {/* Widget API Key */}
      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Widget API Key</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">This key authenticates lead submissions from your website. Keep it private — only share it in server-side code or trusted embed configurations.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-3 text-sm text-zinc-200 font-mono truncate">
            {apiKey ?? 'Loading...'}
          </code>
          <button
            onClick={() => apiKey && copy(apiKey, 'key')}
            className="flex items-center gap-1.5 px-3 py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm transition-colors"
            title="Copy API key"
          >
            {copied === 'key' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { if (confirm('Regenerate API key? The old key will stop working immediately.')) regenerate.mutate() }}
            className="flex items-center gap-1.5 px-3 py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm transition-colors"
            title="Regenerate key"
          >
            <RefreshCw className={cn('w-4 h-4', regenerate.isPending && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Embed Snippet */}
      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Website Embed Snippet</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">Paste this into your website to embed the KAI lead capture chat. Leads will appear instantly in your DojoFlow Leads page.</p>
        <div className="relative">
          <pre className="bg-zinc-900 border border-zinc-600 rounded-lg p-4 text-xs text-zinc-300 font-mono whitespace-pre overflow-x-auto">{embedSnippet || 'Loading...'}</pre>
          <button
            onClick={() => embedSnippet && copy(embedSnippet, 'snippet')}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs transition-colors"
          >
            {copied === 'snippet' ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'snippet' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DojoFlowSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: string
}

type SectionId = 
  | 'account' 
  | 'school-profile' 
  | 'usage' 
  | 'billing' 
  | 'payments'
  | 'payment-methods'
  | 'processors'
  | 'pc-bank-card'
  | 'scheduled-tasks'
  | 'data-controls'
  | 'personalization'
  | 'connectors'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ComponentType<any>
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'school-profile', label: 'School Profile', icon: Building2 },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { 
    id: 'payments', 
    label: 'Payments', 
    icon: CreditCard,
    children: [
      { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
      { 
        id: 'processors', 
        label: 'Processors', 
        icon: Puzzle,
        children: [
          { id: 'pc-bank-card', label: 'PC Bank Card', icon: CreditCard }
        ]
      }
    ]
  },
  { id: 'scheduled-tasks', label: 'Scheduled Tasks', icon: Calendar },
  { id: 'data-controls', label: 'Data Controls', icon: Database },
  { id: 'personalization', label: 'Personalization', icon: Palette },
  { id: 'connectors', label: 'Connectors', icon: Puzzle },
]

export default function DojoFlowSettingsModal({ isOpen, onClose, initialSection = 'account' }: DojoFlowSettingsModalProps) {
  const { user } = useAuth()
  const [selectedSection, setSelectedSection] = useState<SectionId>(initialSection as SectionId)
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['payments', 'processors']))
  const [showWebsiteAnalyzerInSettings, setShowWebsiteAnalyzerInSettings] = useState(false)
  const [websiteAnalyzerRescanMode, setWebsiteAnalyzerRescanMode] = useState(false)
  const { data: schoolProfile } = trpc.schoolProfile.get.useQuery(undefined, { enabled: selectedSection === 'school-profile' })

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.has(item.id)
    const isSelected = selectedSection === item.id

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id)
            } else {
              setSelectedSection(item.id)
            }
          }}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
            depth > 0 && "ml-4",
            isSelected 
              ? "bg-red-500/10 text-red-500 font-medium" 
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (selectedSection) {
      case 'account':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Account</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <p className="text-sm text-zinc-400">Name: {user?.name || 'N/A'}</p>
                <p className="text-sm text-zinc-400 mt-2">Email: {user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        )
      
      case 'school-profile':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">School Profile</h2>
            <p className="text-zinc-400 mb-6">Configure your dojo's name, address, phone, and branding.</p>
            {/* Kai Website Analyzer CTA */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Auto-populate from your website</p>
                    <p className="text-zinc-400 text-xs mt-0.5">Kai will scan your school website and fill in your name, address, phone, logo, programs, schedules, and more automatically.</p>
                    {schoolProfile?.website && (
                      <p className="text-zinc-500 text-xs mt-1">Last saved: <span className="text-blue-400">{schoolProfile.website}</span></p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setWebsiteAnalyzerRescanMode(false); setShowWebsiteAnalyzerInSettings(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-all whitespace-nowrap"
                  >
                    Scan Website
                  </button>
                  {schoolProfile?.website && (
                    <button
                      onClick={() => { setWebsiteAnalyzerRescanMode(true); setShowWebsiteAnalyzerInSettings(true); }}
                      className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white border border-white/10 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 justify-center"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-scan
                    </button>
                  )}
                </div>
              </div>
            </div>
            {showWebsiteAnalyzerInSettings && (
              <KaiWebsiteAnalyzer
                rescanMode={websiteAnalyzerRescanMode}
                initialUrl={websiteAnalyzerRescanMode ? (schoolProfile?.website ?? '') : ''}
                onClose={() => { setShowWebsiteAnalyzerInSettings(false); setWebsiteAnalyzerRescanMode(false); }}
              />
            )}
          </div>
        )
      
      case 'usage':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Usage</h2>
            <p className="text-zinc-400">View your usage statistics and analytics.</p>
          </div>
        )
      
      case 'billing':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Billing</h2>
            <p className="text-zinc-400">Manage your subscription and invoices.</p>
          </div>
        )
      
      case 'payment-methods':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Payment Methods</h2>
            <p className="text-zinc-400">Manage credit cards and payment methods for your students.</p>
          </div>
        )
      
      case 'pc-bank-card':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">PC Bank Card</h2>
            <p className="text-zinc-400 mb-6">Complete your processor onboarding to accept payments.</p>
            <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <p className="text-sm text-zinc-400">PC Bank Card onboarding wizard will appear here.</p>
            </div>
          </div>
        )
      
      case 'scheduled-tasks':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Scheduled Tasks</h2>
            <p className="text-zinc-400">Manage automated tasks and workflows.</p>
          </div>
        )
      
      case 'data-controls':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Data Controls</h2>
            <p className="text-zinc-400">Export, import, and manage your data.</p>
          </div>
        )
      
      case 'personalization':
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Personalization</h2>
            <p className="text-zinc-400">Customize your DojoFlow experience.</p>
          </div>
        )
      
      case 'connectors':
        return <ConnectorsSection />
      
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Settings</h2>
            <p className="text-zinc-400">Select a section from the sidebar.</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[85vh] mx-4 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          {/* Header */}
          <div className="px-4 py-5 border-b border-zinc-800">
            <h1 className="text-lg font-bold text-zinc-100">Settings</h1>
            <p className="text-xs text-zinc-500 mt-1">Manage your DojoFlow configuration</p>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map(item => renderNavItem(item))}
          </div>
        </div>
        
        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col">
          {/* Header with Close Button */}
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
