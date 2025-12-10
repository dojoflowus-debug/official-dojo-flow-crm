import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Loader2 } from 'lucide-react'

export default function MarketingScoreCard() {
  const [scoreData, setScoreData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMarketingScore()
  }, [])

  const fetchMarketingScore = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/marketing/score')
      if (response.ok) {
        const data = await response.json()
        setScoreData(data)
      }
    } catch (error) {
      console.error('Error fetching marketing score:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Calculating marketing score...</p>
        </CardContent>
      </Card>
    )
  }

  if (!scoreData) {
    return null
  }

  const { overall_score, health_label, health_color, breakdown, raw_metrics } = scoreData

  // Metric labels and descriptions
  const metricInfo = {
    cac: { label: 'Customer Acquisition Cost', format: () => `$${raw_metrics.cac.toFixed(0)}` },
    conversion_rate: { label: 'Lead Conversion Rate', format: () => `${raw_metrics.conversion_rate.toFixed(1)}%` },
    referral_rate: { label: 'Referral Rate', format: () => `${raw_metrics.referral_rate.toFixed(1)}%` },
    intro_show_up: { label: 'Intro Show-up Rate', format: () => `${raw_metrics.intro_show_up_rate}%` },
    spend_efficiency: { label: 'Spend Efficiency', format: () => `$${raw_metrics.spend_efficiency.toFixed(1)}x ROI` },
    geo_penetration: { label: 'Geographic Penetration', format: () => `${raw_metrics.geo_penetration.toFixed(0)}%` },
    demographics_match: { label: 'Demographics Match', format: () => `${raw_metrics.demographics_match.toFixed(0)}%` },
    ad_engagement: { label: 'Ad Engagement', format: () => `${raw_metrics.ad_engagement}/100` }
  }

  return (
    <Card className="border-2" style={{ borderColor: health_color }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: health_color }} />
              Marketing Health Score
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of your marketing performance
            </CardDescription>
          </div>
          <Badge 
            className="text-lg px-4 py-2"
            style={{ backgroundColor: health_color, color: 'white' }}
          >
            {health_label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Big Score Number */}
          <div className="flex-shrink-0">
            <div 
              className="text-7xl font-bold"
              style={{ color: health_color }}
            >
              {overall_score}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-1">out of 100</p>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1 space-y-3">
            {Object.entries(breakdown).map(([key, score]) => {
              const info = metricInfo[key]
              if (!info) return null
              
              const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{info.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{info.format()}</span>
                      <span className="font-semibold" style={{ color: scoreColor }}>
                        {score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={score} 
                    className="h-2"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

