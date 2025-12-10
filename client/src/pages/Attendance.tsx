import React from 'react'
import SimpleLayout from '../components/SimpleLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClipboardCheck, Search, Calendar, Users, CheckCircle, XCircle } from 'lucide-react'

export default function Attendance({ onLogout, theme, toggleTheme }) {
  const attendanceRecords = [
    { id: 1, student: 'Sarah Johnson', class: 'Kids Karate (Beginner)', date: '2024-10-15', time: '4:00 PM', status: 'Present' },
    { id: 2, student: 'Mike Chen', class: 'Adult Jiu-Jitsu', date: '2024-10-15', time: '6:00 PM', status: 'Present' },
    { id: 3, student: 'Emma Davis', class: 'Kids Karate (Beginner)', date: '2024-10-15', time: '4:00 PM', status: 'Absent' },
    { id: 4, student: 'Alex Martinez', class: 'Advanced Taekwondo', date: '2024-10-15', time: '7:30 PM', status: 'Present' },
    { id: 5, student: 'Lisa Wang', class: 'Teen Kickboxing', date: '2024-10-15', time: '5:30 PM', status: 'Present' },
  ]

  return (
    <SimpleLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Attendance</h1>
            <p className="text-muted-foreground">Track student attendance and participation</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Classes</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
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
                  <p className="text-sm text-muted-foreground">Total Present</p>
                  <p className="text-2xl font-bold text-foreground">42</p>
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
                  <p className="text-sm text-muted-foreground">Total Absent</p>
                  <p className="text-2xl font-bold text-foreground">5</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-foreground">89%</p>
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
            <CardTitle>Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{record.student}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">{record.class}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">{record.time}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleLayout>
  )
}

