import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tablet } from 'lucide-react'

export default function KioskSetup() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tablet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Kiosk Setup</h1>
          <p className="text-muted-foreground">Configure kiosk devices and check-in settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kiosk Configuration</CardTitle>
          <CardDescription>
            Manage kiosk devices, check-in settings, and display options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kiosk Setup page - Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
