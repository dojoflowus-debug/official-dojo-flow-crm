import { useState, useEffect } from 'react'
import SimpleLayout from '../components/SimpleLayout'
import KioskSettings from '../components/KioskSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Tablet, Settings, BarChart3, ClipboardCheck, Users, Calendar, CheckCircle } from 'lucide-react'

export default function KioskManagement({ onLogout, theme, toggleTheme }) {
  const [checkinStats, setCheckinStats] = useState({
    total_checkins: 0,
    todays_checkins: 0,
    week_checkins: 0,
    month_checkins: 0,
    recent_checkins: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch check-in statistics
    fetch('https://5000-is8una2ov9qox2fg0tlcd-a7881f62.manusvm.computer/api/stats/checkins')
      .then(res => res.json())
      .then(data => {
        setCheckinStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch check-in stats:', err)
        setLoading(false)
      })
  }, [])

  return (
    <SimpleLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Kiosk & Attendance
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your self-service kiosk and track student attendance
            </p>
          </div>
          <Button 
            size="lg"
            onClick={() => window.open('https://3000-is8una2ov9qox2fg0tlcd-a7881f62.manusvm.computer', '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-5 w-5" />
            Open Kiosk
          </Button>
        </div>

        {/* Tabs for Kiosk Settings and Attendance */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="settings">Kiosk Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kiosk Status</p>
                      <p className="text-2xl font-bold text-green-500">Active</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Tablet className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Check-Ins</p>
                      <p className="text-2xl font-bold">{loading ? '...' : checkinStats.todays_checkins}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{loading ? '...' : checkinStats.week_checkins}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Check-Ins</p>
                      <p className="text-2xl font-bold">{loading ? '...' : checkinStats.total_checkins}</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Check-Ins */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Recent Check-Ins</CardTitle>
                <CardDescription>Latest student check-ins from the kiosk</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : checkinStats.recent_checkins.length === 0 ? (
                  <p className="text-muted-foreground">No check-ins yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkinStats.recent_checkins.map((record, index) => (
                          <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-medium text-foreground">{record.student_name}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {record.check_in_method}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground">{new Date(record.check_in_time).toLocaleString()}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Present
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Check-Ins</p>
                      <p className="text-2xl font-bold text-foreground">{loading ? '...' : checkinStats.todays_checkins}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold text-foreground">{loading ? '...' : checkinStats.week_checkins}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-foreground">{loading ? '...' : checkinStats.month_checkins}</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Check-Ins</p>
                      <p className="text-2xl font-bold text-foreground">{loading ? '...' : checkinStats.total_checkins}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>All Check-In Records</CardTitle>
                <CardDescription>Complete attendance history from kiosk check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : checkinStats.recent_checkins.length === 0 ? (
                  <p className="text-muted-foreground">No attendance records yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Check-In Method</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkinStats.recent_checkins.map((record, index) => (
                          <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-medium text-foreground">{record.student_name}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {record.check_in_method}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground">{new Date(record.check_in_time).toLocaleString()}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Present
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kiosk Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <KioskSettings />
          </TabsContent>
        </Tabs>
      </div>
    </SimpleLayout>
  )
}

