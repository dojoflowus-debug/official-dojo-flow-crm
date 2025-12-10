import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Login Page Component
 * 
 * DojoFlow-branded login page with:
 * - Traditional email/password authentication
 * - Sign In / Sign Up tabs
 * - Social login placeholders (Google, Facebook, TikTok)
 * - Rotating background carousel (martial arts, yoga, fitness, personal training)
 * - Red/Black/White color scheme
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background images carousel
  const backgroundImages = [
    "/login-hero-dojoflow.jpg",
    "/martial-arts-class.jpg",
    "/yoga-class.jpg",
    "/fitness-class.webp",
    "/personal-training.jpg"
  ];

  // Auto-rotate background images every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        return;
      }
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        return;
      }
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    setError(null);
    
    if (provider === 'Google') {
      // Redirect to Google OAuth flow
      window.location.href = '/api/auth/google';
    } else {
      setError(`${provider} authentication not yet implemented`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Rotating Background Images with Smooth Transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-50' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${image}')` }}
        />
      ))}
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-6xl mx-4 flex rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Side - DojoFlow Logo and Rotating Background */}
        <div className="hidden lg:flex lg:w-1/2 bg-black relative items-center justify-center overflow-hidden">
          {/* Rotating background for left side */}
          {backgroundImages.map((image, index) => (
            <div
              key={`left-${image}`}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-0 ${
                index === currentImageIndex ? 'opacity-70' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url('${image}')` }}
            />
          ))}
          
          {/* Dark overlay for left side */}
          <div className="absolute inset-0 bg-black/50 z-[1]" />
          
          {/* DojoFlow Logo - Ensure it's on top with frosted glass effect */}
          <div className="relative z-[2] flex flex-col items-center justify-center p-12 bg-black/20 backdrop-blur-[20px] rounded-3xl border border-white/10 shadow-2xl">
            <img 
              src="/dojoflow-logo.png" 
              alt="DojoFlow" 
              className="w-64 h-auto mb-4 drop-shadow-2xl transition-transform duration-700 hover:rotate-3 hover:scale-105"
            />
            <p className="text-white text-center text-xl font-light mt-4 drop-shadow-lg">
              Empowering Your Fitness Journey
            </p>
          </div>
        </div>

        {/* Right Side - Form with Frosted Glass Effect */}
        <div className="w-full lg:w-1/2 bg-black/60 backdrop-blur-[15px] p-8 md:p-12 border-l border-white/10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src="/dojoflow-logo.png" 
              alt="DojoFlow" 
              className="w-48 h-auto"
            />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 backdrop-blur-sm border border-white/10">
              <TabsTrigger value="signin" className="text-white data-[state=active]:bg-red-600">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-red-600">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keep-logged-in"
                      checked={keepLoggedIn}
                      onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                      className="border-slate-600 data-[state=checked]:bg-red-600"
                    />
                    <Label
                      htmlFor="keep-logged-in"
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      Keep me logged in
                    </Label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-red-500 hover:text-red-400">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 active:scale-[0.98] relative overflow-hidden group"
                >
                  <span className="relative z-10">SIGN IN</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-black px-3 text-slate-400">or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0 h-12 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("Google")}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    SIGN IN WITH GOOGLE
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700 h-12 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("Facebook")}
                  >
                    <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700 h-12 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("TikTok")}
                  >
                    <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-300">
                    Your email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-300">
                    Your password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base"
                >
                  SIGN UP
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-black px-3 text-slate-400">or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0 h-12 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("Google")}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    SIGN UP WITH GOOGLE
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700 h-12 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("Facebook")}
                  >
                    <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700 h-12 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleSocialLogin("TikTok")}
                  >
                    <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
