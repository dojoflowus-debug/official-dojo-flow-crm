import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  MapPin, 
  Calendar, 
  CreditCard,
  CheckCircle2,
  Edit
} from 'lucide-react'

export default function Step5Review({ data, onComplete }) {
  const [settings, setSettings] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    try {
      const [settingsRes, classesRes] = await Promise.all([
        fetch('/api/settings/school'),
        fetch('/api/settings/class-schedules')
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading your settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Complete</h2>
        <p className="text-muted-foreground">
          Review your settings below. You can edit any section later from the Settings menu.
        </p>
      </div>

      {/* School Information */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">School Information</h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          
          {settings ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">School Name:</span>
                <span className="font-medium">{settings.school_name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Email:</span>
                <span className="font-medium">{settings.contact_email || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Phone:</span>
                <span className="font-medium">{settings.contact_phone || 'Not set'}</span>
              </div>
              {settings.website && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website:</span>
                  <span className="font-medium">{settings.website}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone:</span>
                <span className="font-medium">{settings.timezone}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No school information set</p>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Location</h3>
            </div>
            {settings?.address_line1 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {settings?.address_line1 ? (
            <div className="text-sm">
              <p>{settings.address_line1}</p>
              {settings.address_line2 && <p>{settings.address_line2}</p>}
              <p>
                {settings.city}, {settings.state} {settings.zip_code}
              </p>
              <p>{settings.country}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No location set</p>
          )}
        </CardContent>
      </Card>

      {/* Class Schedule */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Class Schedule</h3>
            </div>
            {classes.length > 0 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {classes.length > 0 ? (
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="text-sm flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="font-medium">{cls.class_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][cls.day_of_week]} • {cls.start_time} - {cls.end_time}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
                    {cls.class_type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No classes scheduled</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Gateway */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Payment Gateway</h3>
            </div>
            {settings?.payment_provider && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {settings?.payment_provider ? (
            <div className="text-sm">
              <p className="font-medium capitalize">{settings.payment_provider}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {settings.payment_provider === 'stripe' && 'Stripe payment processing enabled'}
                {settings.payment_provider === 'square' && 'Square payment processing enabled'}
                {settings.payment_provider === 'manual' && 'Manual payment tracking'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment gateway configured</p>
          )}
        </CardContent>
      </Card>

      {/* Completion Message */}
      <Card className="border-green-500/40 bg-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">You're all set!</h3>
              <p className="text-sm text-muted-foreground">
                Your DojoFlow system is configured and ready to use. Click "Complete Setup" below to start managing your dojo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

