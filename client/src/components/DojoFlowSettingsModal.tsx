import React, { useState, useEffect } from 'react'
import { X, User, Building2, BarChart3, CreditCard, Calendar, Database, Palette, Puzzle, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

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
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">School Profile</h2>
            <p className="text-zinc-400">Configure your dojo's name, address, phone, and branding.</p>
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
        return (
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Connectors</h2>
            <p className="text-zinc-400">Connect third-party services and integrations.</p>
          </div>
        )
      
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
