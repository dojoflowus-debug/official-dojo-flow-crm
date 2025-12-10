import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  Users,
  Gift,
  Send,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

/**
 * Referral System Page
 */
export default function Referral() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  // Student info
  const [studentId, setStudentId] = useState("");
  const [studentVerified, setStudentVerified] = useState(false);
  
  // Friend info
  const [friendName, setFriendName] = useState("");
  const [friendPhone, setFriendPhone] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleVerifyStudent = () => {
    if (studentId.length >= 4) {
      setStudentVerified(true);
      setStep(2);
    }
  };

  const handleSubmitReferral = async () => {
    if (!friendName || !friendPhone) {
      alert("Please fill in friend's name and phone number");
      return;
    }

    try {
      // Will connect to backend API
      setSubmitted(true);
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      console.error("Error submitting referral:", error);
      alert("Failed to submit referral. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-center p-8">
          <div className="mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Referral Sent!</h2>
            <p className="text-slate-300">
              Your friend will receive a text message from Kai with an invitation to try a free class!
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm mb-2">
              🎁 <strong>Your Reward:</strong>
            </p>
            <p className="text-white font-semibold">
              Get 1 free month when {friendName.split(' ')[0]} enrolls!
            </p>
          </div>

          <p className="text-slate-500 text-sm">
            Redirecting to home screen...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Refer a Friend</h1>
              <p className="text-sm text-slate-400">Share the martial arts journey</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Rewards Banner */}
          <Card className="border-slate-800 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 mb-8">
            <div className="p-6 text-center">
              <Gift className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Earn Free Months!</h2>
              <p className="text-slate-300 mb-4">
                Refer a friend and get <strong className="text-cyan-400">1 free month</strong> when they enroll
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
                <div className="text-center">
                  <Users className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                  <span>Unlimited Referrals</span>
                </div>
                <div className="text-center">
                  <Gift className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                  <span>Instant Rewards</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-cyan-400' : 'text-slate-600'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                1
              </div>
              <span className="text-sm font-semibold">Your Info</span>
            </div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-cyan-600' : 'bg-slate-800'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-cyan-400' : 'text-slate-600'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                2
              </div>
              <span className="text-sm font-semibold">Friend's Info</span>
            </div>
          </div>

          {/* Step 1: Verify Student */}
          {step === 1 && (
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  First, verify your student account
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Enter your Student ID or Phone Number
                    </label>
                    <Input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Student ID or phone number"
                      className="bg-slate-800 border-slate-700 text-white text-lg"
                      autoFocus
                    />
                  </div>

                  <Button
                    onClick={handleVerifyStudent}
                    disabled={studentId.length < 4}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg py-6"
                  >
                    Continue
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center mt-6">
                  Only current students can refer friends
                </p>
              </div>
            </Card>
          )}

          {/* Step 2: Friend Information */}
          {step === 2 && (
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  Tell us about your friend
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Friend's Full Name *
                    </label>
                    <Input
                      type="text"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      placeholder="John Smith"
                      className="bg-slate-800 border-slate-700 text-white"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Friend's Phone Number *
                    </label>
                    <Input
                      type="tel"
                      value={friendPhone}
                      onChange={(e) => setFriendPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      They'll receive a text from Kai with details
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Friend's Email (Optional)
                    </label>
                    <Input
                      type="email"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      placeholder="john@email.com"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-300 text-sm">
                      <strong className="text-white">What happens next?</strong>
                    </p>
                    <ul className="text-slate-400 text-sm mt-2 space-y-1">
                      <li>• Your friend receives a text from Kai</li>
                      <li>• They can schedule a free trial class</li>
                      <li>• You get 1 free month when they enroll!</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitReferral}
                      disabled={!friendName || !friendPhone}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Referral
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* How It Works */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-8">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    1
                  </div>
                  <p>Enter your friend's contact information</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    2
                  </div>
                  <p>Kai sends them a personalized invitation via text</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    3
                  </div>
                  <p>They schedule and attend a free trial class</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    4
                  </div>
                  <p>When they enroll, you both win! You get 1 free month</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

