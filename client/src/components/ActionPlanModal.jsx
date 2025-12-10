import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, TrendingUp, Clock, Target, ArrowRight, X } from 'lucide-react'

export default function ActionPlanModal({ open, onClose, actionResult }) {
  if (!actionResult) return null

  const { action, message, details } = actionResult

  // Action-specific content
  const getActionContent = () => {
    switch (action) {
      case 'generate_targeted_ad':
        return {
          title: 'Targeted Ad Campaign Created',
          icon: <Target className="h-12 w-12 text-green-500" />,
          summary: message,
          expectedResults: [
            { label: 'Estimated Reach', value: '2,500-3,000 families', icon: '👥' },
            { label: 'Expected CTR', value: '3.5-4.2%', icon: '📊' },
            { label: 'Projected Leads', value: '15-20/month', icon: '📈' },
            { label: 'Est. CAC Reduction', value: '-25%', icon: '💰' }
          ],
          nextSteps: [
            'Review ad creative in Facebook Ads Manager',
            'Set daily budget ($50-75 recommended)',
            'Monitor performance for 7 days',
            'Adjust targeting based on early results'
          ],
          timeline: '7-14 days to see results',
          details: details
        }

      case 'optimize_radius':
        return {
          title: 'Ad Radius Optimized',
          icon: <TrendingUp className="h-12 w-12 text-blue-500" />,
          summary: message,
          expectedResults: [
            { label: 'Monthly Savings', value: actionResult.estimated_savings || '$400', icon: '💵' },
            { label: 'Focus Improvement', value: '+35%', icon: '🎯' },
            { label: 'Lead Quality', value: '+20%', icon: '⭐' },
            { label: 'New CAC Target', value: '$150', icon: '📉' }
          ],
          nextSteps: [
            'Radius reduced from 10 to 6 miles',
            'Budget reallocated to high-performing ZIPs',
            'Excluded low-converting areas',
            'Set up conversion tracking'
          ],
          timeline: '3-5 days to see impact',
          details: details
        }

      case 'adjust_ad_schedule':
        return {
          title: 'Ad Schedule Optimized',
          icon: <Clock className="h-12 w-12 text-purple-500" />,
          summary: message,
          expectedResults: [
            { label: 'Conversion Boost', value: actionResult.estimated_improvement || '+25%', icon: '📈' },
            { label: 'Peak Hours', value: '6-9 PM', icon: '🕐' },
            { label: 'Budget Shift', value: '40%', icon: '💰' },
            { label: 'Engagement', value: '+30%', icon: '👍' }
          ],
          nextSteps: [
            '40% of budget moved to 6-9 PM',
            'Reduced spend during low-performing hours',
            'Weekend schedule optimized',
            'Mobile targeting increased for evening'
          ],
          timeline: '2-3 days to see results',
          details: details
        }

      case 'reallocate_budget':
        return {
          title: 'Budget Reallocated',
          icon: <TrendingUp className="h-12 w-12 text-orange-500" />,
          summary: message,
          expectedResults: [
            { label: 'Efficiency Gain', value: '+40%', icon: '⚡' },
            { label: 'Wasted Spend', value: '-$500/mo', icon: '💸' },
            { label: 'High-Value Focus', value: '75%', icon: '🎯' },
            { label: 'ROI Improvement', value: '+2.5x', icon: '📊' }
          ],
          nextSteps: [
            `Paused ads in underperforming ZIPs: ${details?.underperforming_zips?.join(', ')}`,
            'Increased budget in top 3 ZIP codes',
            'Created lookalike audiences',
            'Set up automated rules'
          ],
          timeline: '5-7 days to see full impact',
          details: details
        }

      case 'create_lookalike':
        return {
          title: 'Lookalike Audience Created',
          icon: <Target className="h-12 w-12 text-indigo-500" />,
          summary: message,
          expectedResults: [
            { label: 'Audience Size', value: actionResult.audience_size || '12,000-15,000', icon: '👥' },
            { label: 'Match Quality', value: '95%', icon: '✨' },
            { label: 'Expected CTR', value: '4.5%', icon: '📊' },
            { label: 'Est. CAC', value: '$120', icon: '💰' }
          ],
          nextSteps: [
            'Lookalike audience synced to Facebook',
            'Campaign created with $75/day budget',
            'Targeting families with similar profiles',
            'A/B testing 3 ad creatives'
          ],
          timeline: '24-48 hours for audience to populate',
          details: details
        }

      default:
        return {
          title: 'Action Applied Successfully',
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          summary: message,
          expectedResults: [],
          nextSteps: [],
          timeline: 'Results vary',
          details: details
        }
    }
  }

  const content = getActionContent()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{content.title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success Icon */}
          <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-lg">
            {content.icon}
            <p className="text-center text-muted-foreground mt-4 max-w-xl">
              {content.summary}
            </p>
          </div>

          {/* Expected Results */}
          {content.expectedResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Expected Results
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {content.expectedResults.map((result, index) => (
                  <Card key={index} className="p-4 text-center">
                    <div className="text-2xl mb-2">{result.icon}</div>
                    <div className="text-2xl font-bold text-primary">{result.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{result.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Clock className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Timeline</p>
              <p className="text-sm text-muted-foreground">{content.timeline}</p>
            </div>
          </div>

          {/* Next Steps */}
          {content.nextSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                What Kai Changed
              </h3>
              <div className="space-y-2">
                {content.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Got It
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              View Campaign Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

