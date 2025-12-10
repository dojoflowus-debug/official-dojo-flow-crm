import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Users, GraduationCap, Baby, Shield, Clock, Home } from 'lucide-react'

export default function DemographicsDeepDive({ zipCode }) {
  const [demographics, setDemographics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (zipCode) {
      fetchDemographics(zipCode)
    }
  }, [zipCode])

  const fetchDemographics = async (zip) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/demographics/${zip}`)
      if (response.ok) {
        const data = await response.json()
        setDemographics(data)
      }
    } catch (error) {
      console.error('Error fetching demographics:', error)
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

  if (!demographics) {
    return null
  }

  const { zip_code, data, family_score } = demographics

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
        <div>
          <CardTitle>Demographics: ZIP {zip_code}</CardTitle>
          <CardDescription>Comprehensive neighborhood analysis</CardDescription>
        </div>
        <Badge 
          className={`text-lg px-4 py-2 ${
            family_score >= 80 ? 'bg-green-500' :
            family_score >= 60 ? 'bg-yellow-500' :
            'bg-orange-500'
          } text-white`}
        >
          {family_score}/100 Family Score
        </Badge>
      </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income & Household */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Household Size</p>
              </div>
              <p className="text-2xl font-bold">{data.household_size}</p>
              <p className="text-xs text-muted-foreground">people per household</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Kids per Household</p>
              </div>
              <p className="text-2xl font-bold">{data.kids_per_household}</p>
              <p className="text-xs text-muted-foreground">
                {data.kids_per_household >= 2.0 ? '🟢 High' : data.kids_per_household >= 1.5 ? '🟡 Medium' : '🔴 Low'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Avg Household Age</p>
              </div>
              <p className="text-2xl font-bold">{data.avg_household_age}</p>
              <p className="text-xs text-muted-foreground">years old</p>
            </CardContent>
          </Card>
        </div>

        {/* Safety & Commute */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Safety Score</p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={data.crime_score} className="flex-1" />
                <span className="text-lg font-bold">{data.crime_score}/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.crime_score >= 80 ? '🟢 Very Safe' : data.crime_score >= 70 ? '🟡 Safe' : '🔴 Moderate'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Avg Commute Time</p>
              </div>
              <p className="text-2xl font-bold">{data.avg_commute_minutes} min</p>
              <p className="text-xs text-muted-foreground">
                {data.avg_commute_minutes <= 30 ? '🟢 Short' : data.avg_commute_minutes <= 40 ? '🟡 Moderate' : '🔴 Long'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Education Level */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Education Level</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(data.education_level).map(([level, percentage]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-sm w-32 capitalize">{level.replace('_', ' ')}</span>
                <Progress value={percentage} className="flex-1" />
                <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ethnicity Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Ethnicity Distribution</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(data.ethnicity).map(([ethnicity, percentage]) => (
              <div key={ethnicity} className="flex items-center gap-3">
                <span className="text-sm w-24 capitalize">{ethnicity}</span>
                <Progress value={percentage} className="flex-1" />
                <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Insights */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              💡 Marketing Insights
            </h3>
            <ul className="space-y-2 text-sm">
              {data.kids_per_household >= 2.0 && (
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>High kids per household ({data.kids_per_household}) - Excellent for family programs and sibling discounts</span>
                </li>
              )}
              {data.crime_score >= 80 && (
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Very safe neighborhood - Parents prioritize quality after-school activities</span>
                </li>
              )}
              {data.education_level.bachelors + data.education_level.graduate >= 50 && (
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Highly educated area - Values structured programs and character development</span>
                </li>
              )}
              {data.avg_commute_minutes <= 30 && (
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Short commute times - Parents have time for kids' extracurriculars</span>
                </li>
              )}
              {data.household_size >= 3.3 && (
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Large households - Target family packages and multi-child discounts</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

