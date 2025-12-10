import { useState, useEffect } from 'react'
import SimpleLayout from '../components/SimpleLayout'
import StudentMap from '../components/StudentMap'
import KaiRecommendationsPanel from '../components/KaiRecommendationsPanel'
import MarketingScoreCard from '../components/MarketingScoreCard'
import CampaignBuilder from '../components/CampaignBuilder'
import CompetitorMap from '../components/CompetitorMap'
import DemographicsDeepDive from '../components/DemographicsDeepDive'
import AdHeatmap from '../components/AdHeatmap'
import SpendEfficiencyTracker from '../components/SpendEfficiencyTracker'
import AutomationTabContent from '../components/AutomationTabContent'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Marketing({ onLogout, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedZip, setSelectedZip] = useState('77377')
  const [stats, setStats] = useState({
    total_students: 0,
    zip_codes: 0,
    avg_students_per_zip: 0
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        
        // Calculate stats
        const zipCodes = new Set(data.filter(s => s.zip_code).map(s => s.zip_code))
        setStats({
          total_students: data.length,
          zip_codes: zipCodes.size,
          avg_students_per_zip: zipCodes.size > 0 ? (data.filter(s => s.zip_code).length / zipCodes.size).toFixed(1) : 0
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SimpleLayout>
      <div className="space-y-6 px-4 md:px-6 pb-8">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Marketing Hub
          </h1>
          <p className="text-base md:text-lg text-foreground/80">
            Analytics, campaigns, automation, and conversations in one place
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Horizontal Scrolling Tabs */}
          <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex md:grid w-auto md:w-full min-w-full md:max-w-6xl md:grid-cols-6 gap-2 px-4 md:px-0 pb-2 md:pb-0">
              <TabsTrigger 
                value="analytics" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="campaign-builder" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Campaigns
              </TabsTrigger>
              <TabsTrigger 
                value="automation" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Automation
              </TabsTrigger>
              <TabsTrigger 
                value="competitors" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Competitors
              </TabsTrigger>
              <TabsTrigger 
                value="demographics" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Demographics
              </TabsTrigger>
              <TabsTrigger 
                value="heatmap" 
                className="min-w-[120px] md:min-w-0 text-sm font-medium whitespace-nowrap px-6 py-3"
              >
                Heatmap
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            {/* Kai Recommendations */}
            <KaiRecommendationsPanel />

            {/* Marketing Score */}
            <MarketingScoreCard />

            {/* Spend Efficiency Tracker */}
            <SpendEfficiencyTracker />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_students}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zip Codes Covered</p>
                  <p className="text-3xl font-bold mt-1">{stats.zip_codes}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Students/Zip</p>
                  <p className="text-3xl font-bold mt-1">{stats.avg_students_per_zip}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Insights */}
        <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background">
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-primary" />
              Marketing Strategy Insights
            </CardTitle>
            <CardDescription className="text-sm">
              Data-driven recommendations to grow your dojo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-2">🎯 Target High-Value Areas</p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Focus advertising on zip codes with high average income but low student count. 
                These areas represent untapped market potential.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-2">💬 Leverage Referrals</p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                In zip codes with high student concentration, implement referral programs. 
                Existing students can bring in neighbors and friends.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-2">📍 Local Partnerships</p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Partner with schools, community centers, and businesses in areas where you have students. 
                Local presence builds trust and credibility.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Map */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading map data...</p>
            </CardContent>
          </Card>
        ) : (
          <StudentMap students={students} />
        )}
          </TabsContent>

          {/* Campaign Builder Tab */}
          <TabsContent value="campaign-builder" className="mt-6">
            <CampaignBuilder />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <AutomationTabContent />
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="mt-6">
            <CompetitorMap />
          </TabsContent>

          {/* Ad Heatmap Tab */}
          <TabsContent value="heatmap" className="mt-6">
            <AdHeatmap />
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="mt-6">
            <DemographicsDeepDive zipCode={selectedZip} />
            <Card className="mt-6">
              <CardHeader className="p-5">
                <CardTitle className="text-xl">Select ZIP Code</CardTitle>
                <CardDescription className="text-sm">Choose a ZIP code to view detailed demographics</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <select 
                  value={selectedZip} 
                  onChange={(e) => setSelectedZip(e.target.value)}
                  className="w-full p-3 border rounded text-base bg-background"
                >
                  <option value="77377">77377 - Tomball</option>
                  <option value="77429">77429 - Cypress</option>
                  <option value="77373">77373 - Spring</option>
                  <option value="77433">77433 - Cypress</option>
                  <option value="77070">77070 - Houston NW</option>
                  <option value="77389">77389 - Spring</option>
                  <option value="77450">77450 - Katy</option>
                  <option value="77380">77380 - The Woodlands</option>
                </select>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SimpleLayout>
  )
}
