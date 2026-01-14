import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Mail, Phone, Globe, Clock, User, Cloud, Thermometer } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { trpc } from '@/lib/trpc'

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
]

export default function Step1SchoolInfo({ data, updateData }) {
  const [formData, setFormData] = useState(data.schoolInfo)

  // Load existing settings from database
  const { data: settings, isLoading } = trpc.settings.getSettings.useQuery()
  const updateSettingsMutation = trpc.settings.updateSettings.useMutation()

  // Load settings into form when available
  useEffect(() => {
    if (settings && settings.schoolName) {
      const loadedData = {
        school_name: settings.schoolName || '',
        contact_email: settings.contactEmail || '',
        contact_phone: settings.contactPhone || '',
        website: settings.website || '',
        timezone: settings.timezone || 'America/New_York',
        instructor_title: settings.instructorTitle || '',
        instructor_first_name: settings.instructorFirstName || '',
        instructor_last_name: settings.instructorLastName || '',
        martial_arts_style: settings.martialArtsStyle || '',
        weather_api_key: settings.weatherApiKey || '',
        enable_weather_alerts: settings.enableWeatherAlerts !== 0,
        has_outdoor_classes: settings.hasOutdoorClasses === 1,
        heat_index_threshold: settings.heatIndexThreshold || 95,
        air_quality_threshold: settings.airQualityThreshold || 150
      }
      setFormData(loadedData)
      updateData('schoolInfo', loadedData)
    }
  }, [settings])

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData('schoolInfo', newData)
  }

  const handleSave = async () => {
    try {
      // Convert form field names to database field names
      await updateSettingsMutation.mutateAsync({
        schoolName: formData.school_name,
        contactEmail: formData.contact_email,
        contactPhone: formData.contact_phone,
        website: formData.website,
        timezone: formData.timezone,
        instructorTitle: formData.instructor_title,
        instructorFirstName: formData.instructor_first_name,
        instructorLastName: formData.instructor_last_name,
        martialArtsStyle: formData.martial_arts_style,
        weatherApiKey: formData.weather_api_key,
        enableWeatherAlerts: formData.enable_weather_alerts ? 1 : 0,
        hasOutdoorClasses: formData.has_outdoor_classes ? 1 : 0,
        heatIndexThreshold: formData.heat_index_threshold,
        airQualityThreshold: formData.air_quality_threshold,
      })
    } catch (error) {
      console.error('Error saving school info:', error)
    }
  }

  // Auto-save when data changes
  useEffect(() => {
    if (formData.school_name || formData.contact_email || formData.instructor_first_name) {
      const timer = setTimeout(() => {
        handleSave()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [formData])

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to DojoFlow!</h2>
        <p className="text-muted-foreground">
          Let's start by setting up your school's basic information. This will help personalize your experience.
        </p>
      </div>

      <div className="space-y-4">
        {/* School Name */}
        <div className="space-y-2">
          <Label htmlFor="school_name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            School Name *
          </Label>
          <Input
            id="school_name"
            placeholder="Dragon Martial Arts Academy"
            value={formData.school_name}
            onChange={(e) => handleChange('school_name', e.target.value)}
            required
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contact_email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Email *
          </Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="info@dragonma.com"
            value={formData.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            required
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contact_phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact Phone
          </Label>
          <Input
            id="contact_phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.contact_phone}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website (optional)
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://dragonma.com"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timezone
          </Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => handleChange('timezone', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instructor Profile Section */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Instructor Profile
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Kai AI will use this to greet you personally
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Instructor Title */}
            <div className="space-y-2">
              <Label htmlFor="instructor_title">
                Title
              </Label>
              <Select
                value={formData.instructor_title || ''}
                onValueChange={(value) => handleChange('instructor_title', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sensei">Sensei</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Coach">Coach</SelectItem>
                  <SelectItem value="Instructor">Instructor</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Sifu">Sifu</SelectItem>
                  <SelectItem value="Sabom">Sabom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="instructor_first_name">
                First Name
              </Label>
              <Input
                id="instructor_first_name"
                placeholder="John"
                value={formData.instructor_first_name || ''}
                onChange={(e) => handleChange('instructor_first_name', e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="instructor_last_name">
                Last Name
              </Label>
              <Input
                id="instructor_last_name"
                placeholder="Smith"
                value={formData.instructor_last_name || ''}
                onChange={(e) => handleChange('instructor_last_name', e.target.value)}
              />
            </div>
          </div>
          
          {/* Martial Arts Style */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="martial_arts_style">
              Primary Martial Arts Style
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Kai will greet you with a traditional greeting from your style
            </p>
            <Select
              value={formData.martial_arts_style || ''}
              onValueChange={(value) => handleChange('martial_arts_style', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your martial arts style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Karate">Karate (Osu!)</SelectItem>
                <SelectItem value="Taekwondo">Taekwondo (Taekwon!)</SelectItem>
                <SelectItem value="Brazilian Jiu-Jitsu">Brazilian Jiu-Jitsu (Oss!)</SelectItem>
                <SelectItem value="Judo">Judo (Oss!)</SelectItem>
                <SelectItem value="Muay Thai">Muay Thai (Sawasdee Krap!)</SelectItem>
                <SelectItem value="Kung Fu">Kung Fu (Sifu!)</SelectItem>
                <SelectItem value="Aikido">Aikido (Onegaishimasu!)</SelectItem>
                <SelectItem value="Krav Maga">Krav Maga (Shalom!)</SelectItem>
                <SelectItem value="MMA">MMA (Let's go!)</SelectItem>
                <SelectItem value="Boxing">Boxing (Let's work!)</SelectItem>
                <SelectItem value="Kickboxing">Kickboxing (Let's train!)</SelectItem>
                <SelectItem value="Hapkido">Hapkido (Kihap!)</SelectItem>
                <SelectItem value="Capoeira">Capoeira (Axé!)</SelectItem>
                <SelectItem value="Kendo">Kendo (Rei!)</SelectItem>
                <SelectItem value="Other">Other / Mixed Styles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weather & Safety Settings */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather & Safety Alerts
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Kai AI will monitor weather and alert you about potential low attendance or safety concerns
          </p>

          {/* OpenWeatherMap API Key */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="weather_api_key">
              OpenWeatherMap API Key (Free)
            </Label>
            <Input
              id="weather_api_key"
              type="password"
              placeholder="Get free API key at openweathermap.org"
              value={formData.weather_api_key || ''}
              onChange={(e) => handleChange('weather_api_key', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get a free API key at{' '}
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                openweathermap.org/api
              </a>
            </p>
          </div>

          {/* Enable Weather Alerts */}
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="enable_weather_alerts"
              checked={formData.enable_weather_alerts !== false}
              onCheckedChange={(checked) => handleChange('enable_weather_alerts', checked)}
            />
            <Label htmlFor="enable_weather_alerts" className="cursor-pointer">
              Enable weather alerts for class attendance predictions
            </Label>
          </div>

          {/* Has Outdoor Classes */}
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="has_outdoor_classes"
              checked={formData.has_outdoor_classes || false}
              onCheckedChange={(checked) => handleChange('has_outdoor_classes', checked)}
            />
            <Label htmlFor="has_outdoor_classes" className="cursor-pointer">
              We have outdoor classes (enables heat index & air quality alerts)
            </Label>
          </div>

          {/* Heat Index & Air Quality Thresholds */}
          {formData.has_outdoor_classes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="heat_index_threshold" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Heat Index Alert Threshold (°F)
                </Label>
                <Input
                  id="heat_index_threshold"
                  type="number"
                  placeholder="95"
                  value={formData.heat_index_threshold || 95}
                  onChange={(e) => handleChange('heat_index_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Kai will alert you when heat index exceeds this value
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="air_quality_threshold">
                  Air Quality Alert Threshold (AQI)
                </Label>
                <Input
                  id="air_quality_threshold"
                  type="number"
                  placeholder="150"
                  value={formData.air_quality_threshold || 150}
                  onChange={(e) => handleChange('air_quality_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Kai will alert you when AQI exceeds this value (150 = Unhealthy)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {updateSettingsMutation.isPending && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
    </div>
  )
}
