import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sparkles,
  X,
  ArrowRight,
  Users,
  UserPlus,
  Calendar,
  CreditCard,
  Settings,
  BarChart3,
  MessageSquare,
  Search,
  Zap,
} from 'lucide-react'

interface KaiCommandOverlayProps {
  isOpen: boolean
  onClose: () => void
}

// Quick actions for Kai Command
const QUICK_ACTIONS = [
  { id: 'students', label: 'View Students', icon: Users, href: '/students' },
  { id: 'leads', label: 'View Leads', icon: UserPlus, href: '/leads' },
  { id: 'classes', label: 'View Classes', icon: Calendar, href: '/classes' },
  { id: 'billing', label: 'View Billing', icon: CreditCard, href: '/billing' },
  { id: 'reports', label: 'View Reports', icon: BarChart3, href: '/reports' },
]

const KAI_SUGGESTIONS = [
  'Show me students at risk',
  'What leads need follow-up?',
  'Generate a revenue report',
  'Who missed class this week?',
  'Summarize today\'s schedule',
]

export default function KaiCommandOverlay({ isOpen, onClose }: KaiCommandOverlayProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'cinematic'
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Filter actions based on query
  const filteredActions = query
    ? QUICK_ACTIONS.filter(action => 
        action.label.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_ACTIONS
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredActions[selectedIndex]) {
        navigate(filteredActions[selectedIndex].href)
        onClose()
      } else if (query.trim()) {
        // Navigate to full Kai Command with query
        navigate(`/kai?q=${encodeURIComponent(query)}`)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filteredActions, selectedIndex, query, navigate, onClose])
  
  const handleActionClick = (href: string) => {
    navigate(href)
    onClose()
  }
  
  const handleFullKaiCommand = () => {
    navigate(query ? `/kai?q=${encodeURIComponent(query)}` : '/kai')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "max-w-2xl p-0 gap-0 overflow-hidden",
        isDark 
          ? "bg-[#111113] border-white/10" 
          : "bg-white border-gray-200"
      )}>
        <DialogTitle className="sr-only">Kai Command</DialogTitle>
        
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <div className={cn(
            "p-2 rounded-lg",
            isDark ? "bg-red-500/20" : "bg-red-50"
          )}>
            <Sparkles className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Kai anything or search..."
              className={cn(
                "border-0 bg-transparent text-lg focus-visible:ring-0 px-0",
                isDark ? "text-white placeholder:text-white/40" : "text-gray-900 placeholder:text-gray-400"
              )}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={isDark ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-gray-600"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="p-2">
          <div className={cn(
            "px-3 py-2 text-xs font-medium uppercase tracking-wider",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            Quick Actions
          </div>
          
          <div className="space-y-1">
            {filteredActions.map((action, index) => {
              const Icon = action.icon
              const isSelected = index === selectedIndex
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isSelected
                      ? isDark
                        ? "bg-white/10 text-white"
                        : "bg-gray-100 text-gray-900"
                      : isDark
                        ? "text-white/70 hover:bg-white/5 hover:text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <ArrowRight className={cn(
                    "h-4 w-4 opacity-0 transition-opacity",
                    isSelected && "opacity-100"
                  )} />
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Kai Suggestions */}
        <div className={cn(
          "p-2 border-t",
          isDark ? "border-white/10" : "border-gray-100"
        )}>
          <div className={cn(
            "px-3 py-2 text-xs font-medium uppercase tracking-wider",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            Try asking Kai
          </div>
          
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {KAI_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion)
                  handleFullKaiCommand()
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  isDark
                    ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-t",
          isDark ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"
        )}>
          <div className={cn(
            "flex items-center gap-4 text-xs",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded border font-mono",
                isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
              )}>↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded border font-mono",
                isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
              )}>Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded border font-mono",
                isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
              )}>Esc</kbd>
              Close
            </span>
          </div>
          
          <Button
            size="sm"
            onClick={handleFullKaiCommand}
            className="gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            <Zap className="h-4 w-4" />
            Full Kai Command
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
