import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Flame, Target, TrendingUp } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const hotZoneIcon = L.divIcon({
  html: `<div style="
    background: radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0.3) 50%, rgba(239,68,68,0) 100%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }
  </style>`,
  className: 'hot-zone-marker',
  iconSize: [60, 60],
  iconAnchor: [30, 30]
})

export default function AdHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLayers, setActiveLayers] = useState({
    students: true,
    leads: true,
    income: true,
    kids: true
  })

  const center = [30.0933, -95.4611]

  useEffect(() => {
    fetchHeatmapData()
  }, [])

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch('/api/marketing/heatmap')
      if (response.ok) {
        const data = await response.json()
        setHeatmapData(data)
      }
    } catch (error) {
      console.error('Error fetching heatmap:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Generating ad heatmap...</p>
        </CardContent>
      </Card>
    )
  }

  if (!heatmapData) return null

  const { zones, hot_zones, insights } = heatmapData

  return (
    <div className="space-y-6">
      {/* Kai Hot Zone Recommendations */}
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            🔥 Kai's Hot Zone Strategy
          </CardTitle>
          <CardDescription>
            High-ROI advertising opportunities identified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 rounded-lg border-2 border-red-500/30 bg-background">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge className="bg-red-500 text-white">{insight.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{insight.message}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">📋 Recommended Tactics:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      {insight.tactics.map((tactic, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      💰 Expected CAC: {insight.expected_cac} | ROI: {insight.expected_roi}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Layer Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Heatmap Layers</CardTitle>
          <CardDescription>Toggle layers to customize your view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeLayers.students ? 'default' : 'outline'}
              onClick={() => toggleLayer('students')}
              className="gap-2"
            >
              👨‍🎓 Student Density
            </Button>
            <Button
              variant={activeLayers.leads ? 'default' : 'outline'}
              onClick={() => toggleLayer('leads')}
              className="gap-2"
            >
              📞 Lead Density
            </Button>
            <Button
              variant={activeLayers.income ? 'default' : 'outline'}
              onClick={() => toggleLayer('income')}
              className="gap-2"
            >
              💰 High Income
            </Button>
            <Button
              variant={activeLayers.kids ? 'default' : 'outline'}
              onClick={() => toggleLayer('kids')}
              className="gap-2"
            >
              👶 Kids Under 14
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Advertising Hot Zones
          </CardTitle>
          <CardDescription>
            Pulsing red zones = highest ROI opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {/* Student Density Circles */}
              {activeLayers.students && zones.students.map((zone, index) => (
                <Circle
                  key={`student-${index}`}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: zone.intensity * 0.3
                  }}
                />
              ))}

              {/* Lead Density Circles */}
              {activeLayers.leads && zones.leads.map((zone, index) => (
                <Circle
                  key={`lead-${index}`}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: zone.intensity * 0.3
                  }}
                />
              ))}

              {/* High Income Circles */}
              {activeLayers.income && zones.income.map((zone, index) => (
                <Circle
                  key={`income-${index}`}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: '#8b5cf6',
                    fillColor: '#8b5cf6',
                    fillOpacity: zone.intensity * 0.3
                  }}
                />
              ))}

              {/* Kids Density Circles */}
              {activeLayers.kids && zones.kids.map((zone, index) => (
                <Circle
                  key={`kids-${index}`}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: '#eab308',
                    fillColor: '#eab308',
                    fillOpacity: zone.intensity * 0.3
                  }}
                />
              ))}

              {/* Hot Zones (Pulsing) */}
              {hot_zones.map((zone, index) => (
                <Marker
                  key={`hot-${index}`}
                  position={[zone.lat, zone.lng]}
                  icon={hotZoneIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        {zone.name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Students:</span>
                          <span className="font-medium">{zone.student_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leads:</span>
                          <span className="font-medium">{zone.lead_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Median Income:</span>
                          <span className="font-medium">${zone.median_income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kids/Household:</span>
                          <span className="font-medium">{zone.kids_per_household}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="font-semibold text-green-600">Expected CAC: {zone.expected_cac}</p>
                          <p className="text-xs text-muted-foreground mt-1">{zone.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500"></div>
              <span className="text-sm">Student Density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
              <span className="text-sm">Lead Density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500"></div>
              <span className="text-sm">High Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Kids Under 14</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-600 dark:text-red-400">Pulsing Red = Hot Zone (High ROI)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

