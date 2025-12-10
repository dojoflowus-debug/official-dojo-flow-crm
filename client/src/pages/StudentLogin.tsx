import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE } from "@/const";
import { LogIn, ArrowLeft, User, Lock } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Login Page - Authentication for student portal access
 */
export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Connect to backend API for authentication
      // For now, mock authentication
      if (email && password) {
        // Store student session
        localStorage.setItem("student_email", email);
        localStorage.setItem("student_logged_in", "true");
        
        // Redirect to student dashboard
        setLocation("/student-dashboard");
      } else {
        setError("Please enter both email and password");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Kiosk
          </Button>
          
          <div className="flex items-center gap-4">
            {APP_LOGO && (
              <img 
                src={APP_LOGO} 
                alt={APP_TITLE} 
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Student Login</h2>
            <p className="text-slate-400">Access your account and manage your training</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-lg"
              disabled={loading}
            >
              {loading ? (
                "Logging in..."
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login to Portal
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-400">
              <p>Don't have an account? Contact the front desk.</p>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
