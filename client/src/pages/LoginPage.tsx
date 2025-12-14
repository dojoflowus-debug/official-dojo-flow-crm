import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLogo } from '@/components/AppLogo'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgId, setOrgId] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const success = onLogin({ email, password, orgId })
    if (!success) {
      setError('Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4 animate-in zoom-in duration-500">
            <AppLogo height={80} />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome to Dojo Flow
          </CardTitle>
          <CardDescription className="text-base">
            Martial Arts School Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@dojoflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                type="text"
                placeholder="demo-dojo"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4 p-3 rounded-md bg-muted/50">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>Email: demo@dojoflow.com</p>
              <p>Password: demo123</p>
              <p>Org ID: demo-dojo</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

