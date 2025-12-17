import { Link } from 'react-router-dom';
import { Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EnrollmentStart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Logo and School Name */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img 
            src="/logo.svg" 
            alt="DojoFlow" 
            className="h-12 w-12"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-white">DojoFlow</h1>
        </div>
        <p className="text-slate-400 text-sm">Belle Chasse</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Your Journey
          </h2>
          <p className="text-xl text-slate-300">
            Choose how you'd like to enroll
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Kai-Guided Enrollment */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <Link to="/enrollment/kai">
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Enroll with Kai
                    </h3>
                    <p className="text-slate-400">AI-guided enrollment</p>
                  </div>

                  <ul className="text-left text-slate-300 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">✓</span>
                      <span>Conversational experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">✓</span>
                      <span>Smart questions based on your answers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">✓</span>
                      <span>Fastest enrollment (3-5 minutes)</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                  >
                    Start with Kai
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Standard Form Enrollment */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <Link to="/enrollment/form">
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-red-500/50 transition-all cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Standard Enrollment
                    </h3>
                    <p className="text-slate-400">Step-by-step form</p>
                  </div>

                  <ul className="text-left text-slate-300 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✓</span>
                      <span>One question at a time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✓</span>
                      <span>Clear progress tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✓</span>
                      <span>Traditional form experience</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
                  >
                    Start Enrollment
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Link to="/kiosk">
            <button className="text-slate-400 hover:text-white transition-colors text-sm">
              ← Back to Welcome
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
