import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, LayersControl } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, DollarSign, Hash, Users } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Mock demographic data by zip code (Tomball/Spring/Cypress area)
const demographicData = {
  '77377': { income: 95000, population: 28000, color: '#8b5cf6' }, // Tomball
  '77429': { income: 88000, population: 35000, color: '#3b82f6' }, // Cypress
  '77373': { income: 82000, population: 42000, color: '#3b82f6' }, // Spring
  '77433': { income: 92000, population: 31000, color: '#8b5cf6' }, // Cypress
  '77070': { income: 78000, population: 38000, color: '#22c55e' }, // Houston (NW)
  '77389': { income: 85000, population: 29000, color: '#3b82f6' }, // Spring
  '77450': { income: 98000, population: 45000, color: '#8b5cf6' }, // Katy
}

export default function StudentMap({ students }) {
  const [center, setCenter] = useState([30.0933, -95.4611]) // Tomball, TX default
  const [zipCodeStats, setZipCodeStats] = useState({})

  useEffect(() => {
    // Calculate student distribution by zip code
    const stats = {}
    students.forEach(student => {
      if (student.address) {
        // Extract zip code from address (simplified)
        const zipMatch = student.address.match(/\b\d{5}\b/)
        if (zipMatch) {
          const zip = zipMatch[0]
          if (!stats[zip]) {
            stats[zip] = { count: 0, students: [] }
          }
          stats[zip].count++
          stats[zip].students.push(student)
        }
      }
    })
    setZipCodeStats(stats)

    // Set center to first student location if available
    if (students.length > 0 && students[0].latitude && students[0].longitude) {
      setCenter([students[0].latitude, students[0].longitude])
    }
  }, [students])

  // Mock geocoding - in production, use a geocoding API
  const getStudentCoordinates = (student) => {
    if (student.latitude && student.longitude) {
      return [student.latitude, student.longitude]
    }
    
    // Mock coordinates based on zip code (Tomball/Spring/Cypress area)
    const zipMatch = student.address?.match(/\b\d{5}\b/)
    if (zipMatch) {
      const zip = zipMatch[0]
      const baseCoords = {
        '77377': [30.0933, -95.4611], // Tomball
        '77429': [29.9688, -95.6972], // Cypress
        '77373': [30.0799, -95.4171], // Spring
        '77433': [29.9630, -95.7394], // Cypress
        '77070': [29.9605, -95.5372], // Houston (NW)
        '77389': [30.0900, -95.3900], // Spring
        '77450': [29.7858, -95.8244], // Katy
      }
      const base = baseCoords[zip] || center
      // Add small random offset for multiple students in same zip
      return [
        base[0] + (Math.random() - 0.5) * 0.02,
        base[1] + (Math.random() - 0.5) * 0.02
      ]
    }
    return center
  }

  const getIncomeColor = (income) => {
    if (income >= 80000) return '#8b5cf6' // Purple - High
    if (income >= 65000) return '#3b82f6' // Blue - Upper Middle
    if (income >= 50000) return '#22c55e' // Green - Middle
    if (income >= 40000) return '#eab308' // Yellow - Lower Middle
    return '#f97316' // Orange - Low
  }

  const getIncomeLabel = (income) => {
    if (income >= 80000) return 'High Income'
    if (income >= 65000) return 'Upper Middle'
    if (income >= 50000) return 'Middle Income'
    if (income >= 40000) return 'Lower Middle'
    return 'Lower Income'
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Student Geographic Distribution
            </CardTitle>
            <CardDescription>
              Visualize where your students live and identify high-potential areas for advertising
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map */}
          <div className="h-[500px] rounded-lg overflow-hidden border border-border">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <LayersControl position="topright">
                {/* Base Map */}
                <LayersControl.BaseLayer checked name="Street Map">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>

                {/* Student Markers */}
                <LayersControl.Overlay checked name="Student Locations">
                  <LayerGroup>
                    {students.map((student, index) => {
                      const coords = getStudentCoordinates(student)
                      return (
                        <Marker key={index} position={coords}>
                          <Popup>
                            <div className="p-2">
                              <p className="font-semibold">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.address}</p>
                              <Badge className="mt-1">{student.belt_rank}</Badge>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>

                {/* Income Demographics Overlay */}
                <LayersControl.Overlay name="Income Demographics">
                  <LayerGroup>
                    {Object.entries(demographicData).map(([zip, data]) => {
                      const baseCoords = {
                        '77377': [30.0933, -95.4611], // Tomball
                        '77429': [29.9688, -95.6972], // Cypress
                        '77373': [30.0799, -95.4171], // Spring
                        '77433': [29.9630, -95.7394], // Cypress
                        '77070': [29.9605, -95.5372], // Houston (NW)
                        '77389': [30.0900, -95.3900], // Spring
                        '77450': [29.7858, -95.8244], // Katy
                      }
                      return (
                        <Circle
                          key={zip}
                          center={baseCoords[zip]}
                          radius={1500}
                          pathOptions={{
                            color: data.color,
                            fillColor: data.color,
                            fillOpacity: 0.2,
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <p className="font-semibold">ZIP {zip}</p>
                              <p className="text-sm">Avg Income: ${data.income.toLocaleString()}</p>
                              <p className="text-sm">Population: {data.population.toLocaleString()}</p>
                              {zipCodeStats[zip] && (
                                <p className="text-sm font-semibold text-primary mt-1">
                                  {zipCodeStats[zip].count} student{zipCodeStats[zip].count !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </Popup>
                        </Circle>
                      )
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>

          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Legend */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Income Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'High Income', color: '#8b5cf6', range: '$80,000+' },
                  { label: 'Upper Middle', color: '#3b82f6', range: '$65,000 - $80,000' },
                  { label: 'Middle Income', color: '#22c55e', range: '$50,000 - $65,000' },
                  { label: 'Lower Middle', color: '#eab308', range: '$40,000 - $50,000' },
                  { label: 'Lower Income', color: '#f97316', range: 'Under $40,000' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{item.range}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Zip Codes */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Top Student Zip Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(zipCodeStats)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(([zip, data]) => {
                    const demo = demographicData[zip]
                    return (
                      <div key={zip} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{zip}</Badge>
                          <span className="text-muted-foreground">
                            {data.count} student{data.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {demo && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: demo.color + '20',
                              color: demo.color
                            }}
                          >
                            ${(demo.income / 1000).toFixed(0)}k avg
                          </span>
                        )}
                      </div>
                    )
                  })}
                {Object.keys(zipCodeStats).length === 0 && (
                  <p className="text-sm text-muted-foreground">No zip code data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advertising Recommendations */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Advertising Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(zipCodeStats).length > 0 ? (
                  <>
                    <p>
                      <strong>High Concentration:</strong> ZIP{' '}
                      {Object.entries(zipCodeStats)
                        .sort((a, b) => b[1].count - a[1].count)[0][0]}{' '}
                      has the most students ({Object.entries(zipCodeStats)
                        .sort((a, b) => b[1].count - a[1].count)[0][1].count}). 
                      Consider referral programs in this area.
                    </p>
                    <p>
                      <strong>Untapped Markets:</strong> Areas with high income but low student count 
                      are ideal for targeted advertising campaigns.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Add student addresses to see advertising recommendations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
