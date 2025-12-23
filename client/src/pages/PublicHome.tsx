import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Calendar, BarChart3, Sparkles } from "lucide-react";

/**
 * Public Marketing Landing Page
 * First page visitors see - introduces DojoFlow and drives owner signups
 */
export default function PublicHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">DojoFlow</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <Link to="/owner">
              <Button variant="outline" size="sm">
                Owner Login
              </Button>
            </Link>
            <Link to="/owner">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Free Trial
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Martial Arts Management
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Run Your Martial Arts School
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              With Confidence
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            DojoFlow combines powerful CRM, intelligent kiosk check-in, and AI assistant Kai to help you focus on teaching while we handle the rest.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link to="/owner">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8">
              Watch Demo
            </Button>
          </div>
          
          <p className="text-sm text-slate-500">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-lg text-slate-600">
              Powerful features designed specifically for martial arts schools
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Student Management</h3>
              <p className="text-slate-600">
                Complete CRM with student profiles, attendance tracking, belt progression, and family management.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Kiosk</h3>
              <p className="text-slate-600">
                Touchless check-in, waiver signing, and visitor registration. Students love the seamless experience.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assistant Kai</h3>
              <p className="text-slate-600">
                Ask questions in plain English. Kai knows your students, schedules, and helps you make decisions instantly.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
              <p className="text-slate-600">
                Real-time insights into revenue, retention, class attendance, and growth trends.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Class Scheduling</h3>
              <p className="text-slate-600">
                Flexible class management with recurring schedules, capacity limits, and automated reminders.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Billing & Payments</h3>
              <p className="text-slate-600">
                Automated recurring billing, payment tracking, and integrated Stripe processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-lg mb-8 text-blue-50">
            Join hundreds of martial arts schools already using DojoFlow
          </p>
          <Link to="/owner">
            <Button size="lg" variant="secondary" className="h-12 px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">DojoFlow</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            © 2024 DojoFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
