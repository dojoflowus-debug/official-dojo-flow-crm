import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { AIChatBox, type Message } from '@/components/AIChatBox';

export default function KaiEnrollment() {
  const navigate = useNavigate();
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m Kai, and I\'ll help you enroll at DojoFlow. This will only take 3-5 minutes.\n\nLet\'s start with your name. What\'s your first and last name?'
    }
  ]);
  
  const createEnrollment = trpc.enrollment.create.useMutation();
  const kaiConverse = trpc.enrollment.kaiConverse.useMutation({
    onSuccess: (response) => {
      // Add Kai's response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.kaiResponse
      }]);
      
      // Check if enrollment is complete
      if (response.isComplete) {
        setIsComplete(true);
      }
    },
    onError: (error) => {
      console.error('Kai conversation error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or switch to the standard form.'
      }]);
    }
  });
  
  // Create enrollment on mount
  useEffect(() => {
    const initEnrollment = async () => {
      const result = await createEnrollment.mutateAsync({ source: 'kai' });
      if (result.success && result.enrollmentId) {
        setEnrollmentId(result.enrollmentId);
      }
    };
    initEnrollment();
  }, []);

  const handleSendMessage = (content: string) => {
    if (!enrollmentId) {
      console.error('Enrollment not initialized');
      return;
    }

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content
    }]);

    // Send to backend
    kaiConverse.mutate({
      enrollmentId,
      userMessage: content,
    });
  };

  const handleSwitchToForm = () => {
    if (confirm('Switch to standard form? Your progress will be saved.')) {
      navigate('/enrollment/form');
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-4xl font-bold text-white">
            Enrollment Complete!
          </h2>
          
          <p className="text-xl text-slate-300">
            Thank you for enrolling with DojoFlow. We'll review your application and contact you soon.
          </p>
          
          <Button
            onClick={() => navigate('/kiosk')}
            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            Return to Welcome
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/enrollment')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Enroll with Kai</h1>
              <p className="text-sm text-slate-400">AI-guided enrollment</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToForm}
            className="text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <FileText className="h-4 w-4 mr-2" />
            Switch to Form
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={kaiConverse.isPending}
          placeholder="Type your response..."
          className="h-[calc(100vh-140px)]"
        />
      </div>
    </div>
  );
}
