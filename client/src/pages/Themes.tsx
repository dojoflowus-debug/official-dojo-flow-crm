import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SimpleLayout from '@/components/SimpleLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Sparkles, LayoutDashboard, Moon, Sun } from 'lucide-react'

export default function Themes({ theme, toggleTheme }) {
  const navigate = useNavigate()
  
  // Create setTheme wrapper for compatibility
  const setTheme = (newTheme) => {
    if (newTheme !== theme) {
      toggleTheme()
    }
  }
  
  // Load preferred view from localStorage
  const [preferredView, setPreferredView] = useState(() => {
    const saved = localStorage.getItem('preferredView')
    return saved || 'crm' // default to CRM Dashboard
  })

  // Save preferred view to localStorage
  useEffect(() => {
    localStorage.setItem('preferredView', preferredView)
  }, [preferredView])

  const handleViewSwitch = () => {
    if (preferredView === 'kai') {
      navigate('/kai-dashboard')
    } else {
      navigate('/crm-dashboard')
    }
  }

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }

  return (
    <SimpleLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Themes & Preferences</h1>
          <p className="text-muted-foreground">
            Customize your DojoFlow experience with view and theme preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* View Switcher Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Dashboard View
              </CardTitle>
              <CardDescription>
                Choose your preferred dashboard interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* View Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kai Dashboard Option */}
                <button
                  onClick={() => setPreferredView('kai')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    preferredView === 'kai'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${
                      preferredView === 'kai' ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Sparkles className={`h-8 w-8 ${
                        preferredView === 'kai' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Kai Dashboard</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        AI-powered interface with voice interaction
                      </p>
                    </div>
                    {preferredView === 'kai' && (
                      <div className="text-xs font-medium text-primary">
                        ✓ Currently Selected
                      </div>
                    )}
                  </div>
                </button>

                {/* CRM Dashboard Option */}
                <button
                  onClick={() => setPreferredView('crm')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    preferredView === 'crm'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${
                      preferredView === 'crm' ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <LayoutDashboard className={`h-8 w-8 ${
                        preferredView === 'crm' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">CRM Dashboard</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Traditional interface with detailed stats
                      </p>
                    </div>
                    {preferredView === 'crm' && (
                      <div className="text-xs font-medium text-primary">
                        ✓ Currently Selected
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Switch Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleViewSwitch}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  Switch to {preferredView === 'kai' ? 'Kai' : 'CRM'} Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Toggle Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                Appearance
              </CardTitle>
              <CardDescription>
                Choose between light and dark mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {theme === 'dark' ? (
                      <Moon className="h-6 w-6 text-foreground" />
                    ) : (
                      <Sun className="h-6 w-6 text-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' 
                        ? 'Reduce eye strain in low-light environments'
                        : 'Bright interface for well-lit spaces'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  id="theme-toggle"
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Your preferences are saved automatically</h4>
                  <p className="text-sm text-muted-foreground">
                    All theme and view settings are stored locally and will persist across sessions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleLayout>
  )
}
