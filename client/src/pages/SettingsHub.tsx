import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Settings,
  Palette,
  Monitor,
  Sparkles,
  CreditCard,
  Shield,
  Plug,
  Bell,
  MapPin,
  Clock,
  Building2,
  Users,
  Mail,
  Smartphone,
  Wrench,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SettingCard {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  category: 'general' | 'appearance' | 'business' | 'security' | 'integrations'
  status?: 'complete' | 'incomplete' | 'warning'
  badge?: string
}

const SETTINGS_CARDS: SettingCard[] = [
  // General Settings
  {
    id: 'general',
    title: 'General Settings',
    description: 'Business information, locations, and operating hours',
    icon: Wrench,
    href: '/setup-wizard',
    category: 'general',
    status: 'incomplete'
  },
  {
    id: 'locations',
    title: 'Locations',
    description: 'Manage your dojo locations and facilities',
    icon: MapPin,
    href: '/setup-wizard',
    category: 'general',
    badge: 'Coming Soon'
  },
  
  // Appearance
  {
    id: 'themes',
    title: 'Themes & Branding',
    description: 'Customize colors, logos, and visual identity',
    icon: Palette,
    href: '/themes',
    category: 'appearance'
  },
  
  // Business Operations
  {
    id: 'kiosk',
    title: 'Kiosk Setup',
    description: 'Configure self-service kiosks for each location',
    icon: Monitor,
    href: '/settings/kiosk',
    category: 'business',
    badge: 'Per-Location'
  },
  {
    id: 'ai-setup',
    title: 'AI/Kai Setup',
    description: 'Train Kai with your business knowledge and preferences',
    icon: Sparkles,
    href: '/ai-setup',
    category: 'business'
  },
  
  // Billing & Subscription
  {
    id: 'subscription',
    title: 'Subscription & Billing',
    description: 'Manage your DojoFlow plan and payment methods',
    icon: CreditCard,
    href: '/subscription',
    category: 'business'
  },
  
  // Security
  {
    id: 'security',
    title: 'Security & Roles',
    description: 'User permissions, access control, and authentication',
    icon: Shield,
    href: '/security',
    category: 'security'
  },
  
  // Integrations
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect third-party services and webhooks',
    icon: Plug,
    href: '/settings/webhooks',
    category: 'integrations'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email, SMS, and push notification preferences',
    icon: Bell,
    href: '/settings/communication',
    category: 'integrations'
  }
]

const CATEGORIES = [
  { id: 'general', name: 'General', icon: Settings },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'business', name: 'Business', icon: Building2 },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'integrations', name: 'Integrations', icon: Plug }
] as const

export default function SettingsHub() {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'cinematic'

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'incomplete':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getCardsByCategory = (categoryId: string) => {
    return SETTINGS_CARDS.filter(card => card.category === categoryId)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-lg">
            Manage your dojo's configuration, appearance, and integrations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Setup Progress</p>
                  <p className="text-2xl font-bold">60%</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Locations</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Integrations</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Plug className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        {CATEGORIES.map(category => {
          const cards = getCardsByCategory(category.id)
          if (cards.length === 0) return null

          const CategoryIcon = category.icon

          return (
            <div key={category.id} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <CategoryIcon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold">{category.name}</h2>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(card => {
                  const Icon = card.icon
                  
                  return (
                    <Link key={card.id} to={card.href}>
                      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex items-center gap-2">
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                              {getStatusIcon(card.status)}
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          <CardTitle className="mt-4">{card.title}</CardTitle>
                          <CardDescription>{card.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Help Section */}
        <Card className={`border-2 ${isDark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                <Info className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Ask Kai for guidance on any settings or configuration. Kai can help you set up your dojo, 
                  customize your kiosks, and integrate with your favorite tools.
                </p>
                <Link 
                  to="/kai-command" 
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask Kai for Help
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
