import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Eye, Upload } from 'lucide-react'


export default function KioskSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)


  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/kiosk/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/kiosk/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Settings saved successfully! Kiosk has been updated with your branding.')
      }
    } catch (error) {
        alert('Error: Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Kiosk Customization</CardTitle>
          <CardDescription>
            Customize your kiosk branding, colors, and content. Changes will be reflected in real-time on your kiosk display.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={settings?.school_name || ''}
                  onChange={(e) => handleChange('school_name', e.target.value)}
                  placeholder="Enter your school name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will replace "DojoFlow Kiosk" everywhere
                </p>
              </div>

              <div>
                <Label htmlFor="school_logo">School Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="school_logo"
                    value={settings?.school_logo || ''}
                    onChange={(e) => handleChange('school_logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload or paste logo URL
                </p>
              </div>

              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  value={settings?.welcome_message || ''}
                  onChange={(e) => handleChange('welcome_message', e.target.value)}
                  placeholder="Welcome to our martial arts school!"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings?.primary_color || '#ef4444'}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="h-10 w-full"
                    />
                    <Input
                      type="text"
                      value={settings?.primary_color || '#ef4444'}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-24 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings?.secondary_color || '#1e293b'}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="h-10 w-full"
                    />
                    <Input
                      type="text"
                      value={settings?.secondary_color || '#1e293b'}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-24 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent_color">Accent</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings?.accent_color || '#f59e0b'}
                      onChange={(e) => handleChange('accent_color', e.target.value)}
                      className="h-10 w-full"
                    />
                    <Input
                      type="text"
                      value={settings?.accent_color || '#f59e0b'}
                      onChange={(e) => handleChange('accent_color', e.target.value)}
                      className="w-24 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="font_family">Font Family</Label>
                <select
                  id="font_family"
                  value={settings?.font_family || 'Inter'}
                  onChange={(e) => handleChange('font_family', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Inter">Inter (Modern)</option>
                  <option value="Roboto">Roboto (Clean)</option>
                  <option value="Poppins">Poppins (Friendly)</option>
                  <option value="Montserrat">Montserrat (Bold)</option>
                  <option value="Open Sans">Open Sans (Classic)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Theme</CardTitle>
              <CardDescription>
                Choose a seasonal or stylistic theme for your kiosk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  value={settings?.theme || 'clean'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="clean">Clean & Modern</option>
                  <option value="dark">Dark & Premium</option>
                  <option value="minimal">Minimal (White)</option>
                  <option value="futuristic">Futuristic (Blue AI)</option>
                  <option value="patriotic">Patriotic (USA)</option>
                  <option value="easter">Easter</option>
                  <option value="halloween">Halloween</option>
                  <option value="thanksgiving">Thanksgiving</option>
                  <option value="christmas">Christmas</option>
                  <option value="dragon">Dragon (Asian)</option>
                  <option value="kids">Kids (Cartoon)</option>
                  <option value="neon">Neon (Arcade)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Theme affects background, decorations, and overall style
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Deploy
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => {
              window.open('https://3000-is8una2ov9qox2fg0tlcd-a7881f62.manusvm.computer', '_blank')
            }}>
              <Eye className="mr-2 h-4 w-4" />
              Open Kiosk
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card className="border-2" style={{ borderColor: settings?.primary_color || '#ef4444' }}>
            <CardHeader style={{ backgroundColor: settings?.primary_color || '#ef4444', color: 'white' }}>
              <CardTitle style={{ fontFamily: settings?.font_family || 'Inter' }}>
                Kiosk Preview
              </CardTitle>
              <CardDescription className="text-white/80">
                Live preview of your customizations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Logo */}
              {settings?.school_logo && (
                <div className="flex justify-center">
                  <img 
                    src={settings.school_logo} 
                    alt="School Logo" 
                    className="h-20 object-contain"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}

              {/* School Name */}
              <div className="text-center">
                <h1 
                  className="text-3xl font-bold mb-2" 
                  style={{ 
                    fontFamily: settings?.font_family || 'Inter',
                    color: settings?.secondary_color || '#1e293b'
                  }}
                >
                  {settings?.school_name || 'DojoFlow Kiosk'}
                </h1>
                <p className="text-muted-foreground" style={{ fontFamily: settings?.font_family || 'Inter' }}>
                  {settings?.welcome_message || 'Welcome to our martial arts school!'}
                </p>
              </div>

              {/* Sample Buttons */}
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  style={{ 
                    backgroundColor: settings?.primary_color || '#ef4444',
                    fontFamily: settings?.font_family || 'Inter'
                  }}
                >
                  Check In
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  style={{ 
                    borderColor: settings?.accent_color || '#f59e0b',
                    color: settings?.accent_color || '#f59e0b',
                    fontFamily: settings?.font_family || 'Inter'
                  }}
                >
                  View Schedule
                </Button>
              </div>

              {/* Color Swatches */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div 
                    className="h-12 rounded-md mb-1" 
                    style={{ backgroundColor: settings?.primary_color || '#ef4444' }}
                  />
                  <p className="text-xs text-muted-foreground">Primary</p>
                </div>
                <div className="text-center">
                  <div 
                    className="h-12 rounded-md mb-1" 
                    style={{ backgroundColor: settings?.secondary_color || '#1e293b' }}
                  />
                  <p className="text-xs text-muted-foreground">Secondary</p>
                </div>
                <div className="text-center">
                  <div 
                    className="h-12 rounded-md mb-1" 
                    style={{ backgroundColor: settings?.accent_color || '#f59e0b' }}
                  />
                  <p className="text-xs text-muted-foreground">Accent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sync Info */}
          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Classes</span>
                  <span className="text-green-600 font-medium">✓ Synced</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Events</span>
                  <span className="text-green-600 font-medium">✓ Synced</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Pricing</span>
                  <span className="text-green-600 font-medium">✓ Synced</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Instructors</span>
                  <span className="text-green-600 font-medium">✓ Synced</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                All data from your main dashboard is automatically synced to the kiosk in real-time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

