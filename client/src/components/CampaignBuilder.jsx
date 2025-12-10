import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Rocket, Loader2, CheckCircle2, Image, FileText, Target, DollarSign } from 'lucide-react'

export default function CampaignBuilder() {
  const [formData, setFormData] = useState({
    goal: '',
    audience: '',
    budget: '',
    platform: '',
    offer: ''
  })
  
  const [generating, setGenerating] = useState(false)
  const [generatedCampaign, setGeneratedCampaign] = useState(null)
  const [launching, setLaunching] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateCampaign = async () => {
    try {
      setGenerating(true)
      
      const response = await fetch('/api/kai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const campaign = await response.json()
        setGeneratedCampaign(campaign)
      }
    } catch (error) {
      console.error('Error generating campaign:', error)
      alert('Failed to generate campaign')
    } finally {
      setGenerating(false)
    }
  }

  const launchCampaign = async () => {
    try {
      setLaunching(true)
      
      const response = await fetch('/api/kai/launch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          campaign: generatedCampaign
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Campaign Launched!\n\n${result.message}`)
        
        // Reset form
        setFormData({ goal: '', audience: '', budget: '', platform: '', offer: '' })
        setGeneratedCampaign(null)
      }
    } catch (error) {
      console.error('Error launching campaign:', error)
      alert('Failed to launch campaign')
    } finally {
      setLaunching(false)
    }
  }

  const isFormValid = formData.goal && formData.audience && formData.budget && formData.platform && formData.offer

  return (
    <div className="space-y-6">
      {/* Campaign Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Campaign
          </CardTitle>
          <CardDescription>
            Let Kai build a complete marketing campaign for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">Campaign Goal</Label>
            <Select value={formData.goal} onValueChange={(value) => handleInputChange('goal', value)}>
              <SelectTrigger id="goal">
                <SelectValue placeholder="Select campaign goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial_bookings">Trial Bookings</SelectItem>
                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                <SelectItem value="retargeting">Retargeting</SelectItem>
                <SelectItem value="event_signup">Event Signup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              placeholder="e.g., Parents of kids 5-12 in Tomball/Spring area"
              value={formData.audience}
              onChange={(e) => handleInputChange('audience', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              💡 Auto-filled from your student demographics
            </p>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                placeholder="1500"
                className="pl-9"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              />
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Offer */}
          <div className="space-y-2">
            <Label htmlFor="offer">Special Offer</Label>
            <Textarea
              id="offer"
              placeholder="e.g., Free trial class + uniform"
              rows={3}
              value={formData.offer}
              onChange={(e) => handleInputChange('offer', e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateCampaign}
            disabled={!isFormValid || generating}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Kai is generating your campaign...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Campaign with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Campaign Preview */}
      {generatedCampaign && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Campaign Generated Successfully
            </CardTitle>
            <CardDescription>
              Review and launch your AI-generated campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ad Copy */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Ad Copy</h3>
              </div>
              <div className="space-y-3">
                {generatedCampaign.ad_copy.map((copy, index) => (
                  <Card key={index} className="p-4 bg-muted/30">
                    <Badge className="mb-2">{copy.type}</Badge>
                    <p className="font-semibold text-lg mb-1">{copy.headline}</p>
                    <p className="text-sm text-muted-foreground mb-2">{copy.body}</p>
                    <p className="text-sm font-medium text-primary">{copy.cta}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Creative Ideas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Creative Ideas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedCampaign.creative_ideas.map((idea, index) => (
                  <Card key={index} className="p-4">
                    <p className="font-medium mb-2">{idea.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{idea.description}</p>
                    <Badge variant="outline" className="text-xs">
                      🎨 {idea.prompt}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>

            {/* Audience Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Audience Targeting</h3>
              </div>
              <Card className="p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(generatedCampaign.audience_settings).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Landing Page Copy */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Landing Page Copy</h3>
              </div>
              <Card className="p-4 bg-muted/30">
                <h4 className="text-xl font-bold mb-2">{generatedCampaign.landing_page.headline}</h4>
                <p className="text-muted-foreground mb-3">{generatedCampaign.landing_page.subheadline}</p>
                <p className="text-sm mb-3">{generatedCampaign.landing_page.body}</p>
                <Button className="w-full">{generatedCampaign.landing_page.cta}</Button>
              </Card>
            </div>

            {/* Launch Button */}
            <Button
              onClick={launchCampaign}
              disabled={launching}
              className="w-full gap-2"
              size="lg"
            >
              {launching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Launching Campaign...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Launch Campaign
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

