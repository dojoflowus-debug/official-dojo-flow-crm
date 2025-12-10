import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function AISetup() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI/Kai Setup</h1>
          <p className="text-muted-foreground">Configure AI assistant and Kai virtual receptionist</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Configure AI-powered features and virtual receptionist settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AI/Kai Setup page - Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
