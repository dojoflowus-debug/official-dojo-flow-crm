import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

export default function SpendEfficiencyTracker() {
  const [efficiencyData, setEfficiencyData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEfficiencyData()
  }, [])

  const fetchEfficiencyData = async () => {
    try {
      const response = await fetch('/api/marketing/spend-efficiency')
      if (response.ok) {
        const data = await response.json()
        setEfficiencyData(data)
      }
    } catch (error) {
      console.error('Error fetching efficiency data:', error)
    } finally {
      setLoading(false)
    }
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

  if (!efficiencyData) return null

  const { channels, insights, total_spend, total_revenue, overall_efficiency } = efficiencyData

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 100) return 'text-green-600'
    if (efficiency >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyBadge = (efficiency) => {
    if (efficiency >= 100) return { label: 'Excellent', className: 'bg-green-500 text-white' }
    if (efficiency >= 70) return { label: 'Good', className: 'bg-yellow-500 text-white' }
    return { label: 'Poor', className: 'bg-red-500 text-white' }
  }

  return (
    <div className="space-y-6">
      {/* Overall Efficiency */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Marketing Efficiency</span>
            <Badge className={`text-lg px-4 py-2 ${getEfficiencyBadge(overall_efficiency).className}`}>
              {overall_efficiency}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Total Spend: ${total_spend.toLocaleString()} | Total Revenue: ${total_revenue.toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Kai Insights */}
      {insights && insights.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 Kai's Budget Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="p-3 rounded-lg border bg-background">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{insight.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{insight.message}</p>
                    <p className="text-sm text-muted-foreground">{insight.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Efficiency Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Spend Efficiency by Channel</CardTitle>
          <CardDescription>
            Efficiency = (Revenue Generated / Cost Spent) × 100%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {channels.map((channel, index) => {
              const badge = getEfficiencyBadge(channel.efficiency)
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium min-w-[180px]">{channel.name}</span>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                    <span className={`text-2xl font-bold ${getEfficiencyColor(channel.efficiency)}`}>
                      {channel.efficiency}%
                    </span>
                  </div>
                  
                  <Progress value={Math.min(channel.efficiency, 150)} className="h-3" />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Spent: ${channel.spent.toLocaleString()}</span>
                    <span>Revenue: ${channel.revenue.toLocaleString()}</span>
                    <span>Students: {channel.students}</span>
                  </div>

                  {channel.note && (
                    <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{channel.note}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Insight */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
              <p className="text-muted-foreground">
                <strong>Referral Program + Kai Voice Calling</strong> would always have the highest ROI. 
                Existing students are your best marketers - incentivize them to refer friends and family, 
                then have Kai follow up with personalized voice calls to convert leads faster.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

