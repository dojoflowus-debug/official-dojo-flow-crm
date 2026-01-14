import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom marker icons
const createIcon = (emoji, color) => {
  return L.divIcon({
    html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

const icons = {
  martial_arts: createIcon('🥋', '#ef4444'),
  daycare: createIcon('🧸', '#eab308'),
  gym: createIcon('🏋️', '#3b82f6'),
  park: createIcon('📍', '#22c55e'),
  your_dojo: createIcon('⭐', '#8b5cf6')
}

const typeLabels = {
  martial_arts: 'Martial Arts School',
  daycare: 'Daycare',
  gym: 'Gym',
  park: 'Park / Rec Center'
}

export default function CompetitorMap() {
  const [competitors, setCompetitors] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState({
    martial_arts: true,
    daycare: true,
    gym: true,
    park: true
  })

  const center = [30.0933, -95.4611] // Tomball, TX

  useEffect(() => {
    fetchCompetitors()
    fetchAnalysis()
  }, [])

  const fetchCompetitors = async () => {
    try {
      const response = await fetch('/api/competitors/nearby')
      if (response.ok) {
        const data = await response.json()
        setCompetitors(data.competitors)
      }
    } catch (error) {
      console.error('Error fetching competitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/competitors/analysis')
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    }
  }

  const toggleType = (type) => {
    setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const filteredCompetitors = competitors.filter(c => selectedTypes[c.type])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading competitor map...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Kai Competitive Insights */}
      {analysis && analysis.insights && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 Kai's Competitive Intelligence
            </CardTitle>
            <CardDescription>
              Strategic insights based on competitor analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  insight.type === 'threat' ? 'border-red-500/50 bg-red-500/5' :
                  insight.type === 'opportunity' ? 'border-green-500/50 bg-green-500/5' :
                  'border-blue-500/50 bg-blue-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{insight.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      <Badge className={`${getPriorityColor(insight.priority)} text-white text-xs`}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                    <p className="text-sm font-medium text-primary">💡 {insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Market Overview Stats */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{analysis.total_competitors}</div>
              <p className="text-xs text-muted-foreground mt-1">Martial Arts Schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{analysis.avg_competitor_rating}★</div>
              <p className="text-xs text-muted-foreground mt-1">Avg Competitor Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{analysis.closest_competitor?.distance} mi</div>
              <p className="text-xs text-muted-foreground mt-1">Closest Competitor</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{analysis.market_saturation}</div>
              <p className="text-xs text-muted-foreground mt-1">Market Saturation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Competitors</CardTitle>
          <CardDescription>Toggle categories to show/hide on map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeLabels).map(([type, label]) => (
              <Badge
                key={type}
                variant={selectedTypes[type] ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() => toggleType(type)}
              >
                {type === 'martial_arts' && '🥋'}
                {type === 'daycare' && '🧸'}
                {type === 'gym' && '🏋️'}
                {type === 'park' && '📍'}
                {' '}{label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Map */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Landscape Map</CardTitle>
          <CardDescription>
            Showing {filteredCompetitors.length} competitors within 5 miles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Your Dojo */}
              <Marker position={center} icon={icons.your_dojo}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-purple-600">Your Dojo</h3>
                    <p className="text-sm">Main Location</p>
                  </div>
                </Popup>
              </Marker>

              {/* 5-mile radius circle */}
              <Circle
                center={center}
                radius={8046.72} // 5 miles in meters
                pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.1 }}
              />

              {/* Competitors */}
              {filteredCompetitors.map((competitor, index) => (
                <Marker
                  key={index}
                  position={[competitor.lat, competitor.lng]}
                  icon={icons[competitor.type]}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold mb-1">{competitor.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{typeLabels[competitor.type]}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{competitor.rating}</span>
                      </div>
                      <p className="text-xs mb-1">{competitor.address}</p>
                      <Badge variant="outline" className="text-xs">
                        {competitor.distance} miles away
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

