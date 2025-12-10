import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import ActionPlanModal from './ActionPlanModal'

export default function KaiRecommendationsPanel() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState({})
  const [actionResult, setActionResult] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/kai/recommendations')
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Error fetching Kai recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyRecommendation = async (recommendation, index) => {
    try {
      setApplying(prev => ({ ...prev, [index]: true }))
      
      const response = await fetch('/api/kai/apply-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: recommendation.action,
          data: recommendation.data
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show action plan modal
        setActionResult(result)
        setShowActionModal(true)
        
        // Refresh recommendations
        fetchRecommendations()
      }
    } catch (error) {
      console.error('Error applying recommendation:', error)
      alert('❌ Failed to apply recommendation')
    } finally {
      setApplying(prev => ({ ...prev, [index]: false }))
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'opportunity': return 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
      case 'alert': return 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
      case 'optimization': return 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
      case 'warning': return 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
      case 'insight': return 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20'
      default: return 'border-border/50'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Kai is analyzing your marketing data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Kai Marketing Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered insights to optimize your marketing performance
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {recommendations.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recommendations at this time.</p>
            <p className="text-sm">Kai is monitoring your marketing performance.</p>
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getTypeColor(rec.type)}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0 mt-1">
                  {rec.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base">{rec.title}</h3>
                    <Badge 
                      className={`${getPriorityColor(rec.priority)} text-white text-xs`}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/90 mb-3">
                    {rec.message}
                  </p>

                  {/* Action Button */}
                  <Button
                    onClick={() => applyRecommendation(rec, index)}
                    disabled={applying[index]}
                    size="sm"
                    className="gap-2"
                  >
                    {applying[index] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {rec.action_label || 'Let Kai Apply Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>

      {/* Action Plan Modal */}
      <ActionPlanModal 
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        actionResult={actionResult}
      />
    </>
  )
}

