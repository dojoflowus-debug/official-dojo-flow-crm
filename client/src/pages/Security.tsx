import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function Security() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Security & Roles</h1>
          <p className="text-muted-foreground">Manage user permissions, roles, and security settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Configuration</CardTitle>
          <CardDescription>
            Configure user roles, permissions, and security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Security & Roles page - Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
