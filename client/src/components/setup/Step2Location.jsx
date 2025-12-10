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
import { MapPin, Building } from 'lucide-react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function Step2Location({ data, updateData }) {
  const [formData, setFormData] = useState(data.location)
  const [loading, setLoading] = useState(false)

  // Load existing settings if any
  useEffect(() => {
    loadExistingSettings()
  }, [])

  const loadExistingSettings = async () => {
    try {
      const response = await fetch('/api/settings/school')
      if (response.ok) {
        const settings = await response.json()
        if (settings.address_line1) {
          setFormData({
            address_line1: settings.address_line1 || '',
            address_line2: settings.address_line2 || '',
            city: settings.city || '',
            state: settings.state || '',
            zip_code: settings.zip_code || '',
            country: settings.country || 'United States'
          })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData('location', newData)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        console.log('Location saved successfully')
      } else {
        alert('Failed to save location')
      }
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Failed to save location')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save when data changes
  useEffect(() => {
    if (formData.address_line1 && formData.city && formData.state) {
      const timer = setTimeout(() => {
        handleSave()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [formData])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">School Location</h2>
        <p className="text-muted-foreground">
          Where is your dojo located? This helps students find you and enables location-based features.
        </p>
      </div>

      <div className="space-y-4">
        {/* Address Line 1 */}
        <div className="space-y-2">
          <Label htmlFor="address_line1" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Street Address
          </Label>
          <Input
            id="address_line1"
            placeholder="123 Main Street"
            value={formData.address_line1}
            onChange={(e) => handleChange('address_line1', e.target.value)}
          />
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <Label htmlFor="address_line2">
            Apartment, Suite, etc. (optional)
          </Label>
          <Input
            id="address_line2"
            placeholder="Suite 100"
            value={formData.address_line2}
            onChange={(e) => handleChange('address_line2', e.target.value)}
          />
        </div>

        {/* City, State, ZIP in a grid */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City
            </Label>
            <Input
              id="city"
              placeholder="San Francisco"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>

          <div className="col-span-1 space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => handleChange('state', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="CA" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="zip_code">ZIP Code</Label>
            <Input
              id="zip_code"
              placeholder="94102"
              value={formData.zip_code}
              onChange={(e) => handleChange('zip_code', e.target.value)}
            />
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => handleChange('country', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
    </div>
  )
}

