import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  Star,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

/**
 * Feedback & Rating Page
 */
export default function Feedback() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  // Student info
  const [studentId, setStudentId] = useState("");
  
  // Feedback
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("class");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      // Will connect to backend API
      setSubmitted(true);
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
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
            <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-slate-300">
              Your feedback helps us improve our programs and provide better service to all our students.
            </p>
          </div>
          
          {rating >= 4 && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <p className="text-slate-300 text-sm">
                We're thrilled you had a great experience! 🎉
              </p>
            </div>
          )}

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
              <h1 className="text-2xl font-bold text-white">Share Your Feedback</h1>
              <p className="text-sm text-slate-400">Help us improve your experience</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Student ID */}
          {step === 1 && (
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-8">
                <div className="text-center mb-8">
                  <MessageSquare className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    We Value Your Opinion
                  </h3>
                  <p className="text-slate-300">
                    Your feedback helps us create a better experience for everyone
                  </p>
                </div>
                
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
                    onClick={() => setStep(2)}
                    disabled={studentId.length < 4}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
                  >
                    Continue
                  </Button>
                </div>

                <div className="mt-8 bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300 text-sm text-center">
                    <strong className="text-white">Anonymous feedback?</strong><br />
                    Skip the ID and tap "Continue" to submit anonymously
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Rating & Feedback */}
          {step === 2 && (
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  How was your experience?
                </h3>
                
                <div className="space-y-6">
                  {/* Feedback Type */}
                  <div>
                    <label className="text-sm text-slate-400 mb-3 block">
                      What would you like to rate?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={feedbackType === "class" ? "default" : "outline"}
                        onClick={() => setFeedbackType("class")}
                        className={feedbackType === "class" 
                          ? "bg-indigo-600 hover:bg-indigo-700" 
                          : "border-slate-700 text-white hover:bg-slate-800"}
                      >
                        Class
                      </Button>
                      <Button
                        variant={feedbackType === "instructor" ? "default" : "outline"}
                        onClick={() => setFeedbackType("instructor")}
                        className={feedbackType === "instructor" 
                          ? "bg-indigo-600 hover:bg-indigo-700" 
                          : "border-slate-700 text-white hover:bg-slate-800"}
                      >
                        Instructor
                      </Button>
                      <Button
                        variant={feedbackType === "facility" ? "default" : "outline"}
                        onClick={() => setFeedbackType("facility")}
                        className={feedbackType === "facility" 
                          ? "bg-indigo-600 hover:bg-indigo-700" 
                          : "border-slate-700 text-white hover:bg-slate-800"}
                      >
                        Facility
                      </Button>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="text-sm text-slate-400 mb-3 block text-center">
                      Rate your experience
                    </label>
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-12 w-12 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-slate-400 text-sm">
                      {rating === 0 && "Tap a star to rate"}
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent!"}
                    </p>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Additional Comments (Optional)
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us more about your experience..."
                      className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                    />
                  </div>

                  {/* Quick Feedback Tags */}
                  {rating > 0 && (
                    <div>
                      <label className="text-sm text-slate-400 mb-3 block">
                        Quick feedback (tap any that apply)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {rating >= 4 ? (
                          <>
                            <Badge text="Great instructor" />
                            <Badge text="Fun class" />
                            <Badge text="Learned a lot" />
                            <Badge text="Good energy" />
                            <Badge text="Well organized" />
                          </>
                        ) : (
                          <>
                            <Badge text="Too crowded" />
                            <Badge text="Too easy" />
                            <Badge text="Too hard" />
                            <Badge text="Need more attention" />
                            <Badge text="Facility issues" />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={rating === 0}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Why Feedback Matters */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-8">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Why Your Feedback Matters</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>✓ Helps instructors improve their teaching methods</p>
                <p>✓ Allows us to enhance our programs and facilities</p>
                <p>✓ Ensures we're meeting your training goals</p>
                <p>✓ Creates a better experience for all students</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Quick feedback badge component
function Badge({ text }: { text: string }) {
  const [selected, setSelected] = useState(false);
  
  return (
    <button
      onClick={() => setSelected(!selected)}
      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
        selected
          ? "bg-indigo-600 text-white"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {text}
    </button>
  );
}

