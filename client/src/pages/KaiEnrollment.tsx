import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Sparkles, Send, Check, User, Mail, Phone, Calendar, Award, Mic, MicOff, Globe } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface EnrollmentData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  studentType?: string;
  program?: string;
}

const ENROLLMENT_STEPS = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'student', label: 'Student Details', icon: Calendar },
  { id: 'program', label: 'Program', icon: Award },
  { id: 'review', label: 'Review', icon: Check }
];

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'it-IT', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ru-RU', label: 'Russian', flag: '🇷🇺' }
];

export default function KaiEnrollment() {
  const navigate = useNavigate();
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({});
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('kai-voice-language') || 'en-US';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m Kai, your enrollment guide. I\'ll help you get started in just a few minutes.\n\nLet\'s begin with your name. What\'s your first and last name?'
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
      
      // Update enrollment data (mock extraction - in real app, backend would provide this)
      updateEnrollmentDataFromResponse(response.kaiResponse);
      
      // Update step progress
      updateStepProgress();
      
      // Check if enrollment is complete
      if (response.isComplete) {
        setIsComplete(true);
      }
    },
    onError: (error) => {
      console.error('Kai conversation error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again or switch to the standard form.'
      }]);
    }
  });
  
  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = selectedLanguage;

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [selectedLanguage]);

  // Create enrollment on mount
  useEffect(() => {
    if (enrollmentId) return;
    
    const initEnrollment = async () => {
      try {
        const result = await createEnrollment.mutateAsync({ source: 'kai' });
        if (result.success && result.enrollmentId) {
          setEnrollmentId(result.enrollmentId);
        }
      } catch (error) {
        console.error('Failed to create enrollment:', error);
      }
    };
    initEnrollment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateEnrollmentDataFromResponse = (response: string) => {
    // Simple pattern matching to extract data from conversation
    // In production, backend should return structured data
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('email') || lowerResponse.includes('@')) {
      const emailMatch = inputValue.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        setEnrollmentData(prev => ({ ...prev, email: emailMatch[0] }));
      }
    }
    
    if (lowerResponse.includes('phone') || lowerResponse.includes('number')) {
      const phoneMatch = inputValue.match(/[\d-()+ ]{10,}/);
      if (phoneMatch) {
        setEnrollmentData(prev => ({ ...prev, phone: phoneMatch[0] }));
      }
    }
    
    // Extract name from first message
    if (messages.length === 1 && inputValue.trim()) {
      const nameParts = inputValue.trim().split(' ');
      if (nameParts.length >= 2) {
        setEnrollmentData(prev => ({
          ...prev,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ')
        }));
      }
    }
  };

  const updateStepProgress = () => {
    const messageCount = messages.length;
    if (messageCount >= 2 && messageCount < 4) setCurrentStep(1);
    else if (messageCount >= 4 && messageCount < 6) setCurrentStep(2);
    else if (messageCount >= 6 && messageCount < 8) setCurrentStep(3);
    else if (messageCount >= 8) setCurrentStep(4);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enrollmentId || !inputValue.trim()) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
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

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('kai-voice-language', languageCode);
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setInputValue('');
      recognition.start();
      setIsRecording(true);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl font-bold text-white">
            Enrollment Complete!
          </h2>
          
          <p className="text-xl text-slate-300">
            Thank you for enrolling with DojoFlow. We'll review your application and contact you soon.
          </p>
          
          <Button
            onClick={() => navigate('/kiosk')}
            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg"
          >
            Return to Welcome
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header with Progress */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/enrollment')}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
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
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Switch to Form
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {ENROLLMENT_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50' 
                        : isCompleted
                        ? 'bg-green-600 shadow-lg shadow-green-500/30'
                        : 'bg-slate-800 border border-slate-700'
                    }`}>
                      <StepIcon className={`h-5 w-5 ${
                        isActive || isCompleted ? 'text-white' : 'text-slate-500'
                      }`} />
                    </div>
                    <p className={`text-xs mt-2 font-medium transition-colors ${
                      isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < ENROLLMENT_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 transition-all duration-300 ${
                      index < currentStep ? 'bg-green-600' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Left Panel: Kai Conversation */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-slate-800/80 text-slate-100 border border-slate-700'
                    }`}>
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-800 bg-slate-900/80 p-4 space-y-3">
                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-48 h-9 bg-slate-800 border-slate-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {LANGUAGES.map((lang) => (
                        <SelectItem 
                          key={lang.code} 
                          value={lang.code}
                          className="text-white hover:bg-slate-700 focus:bg-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-slate-500">Voice input language</span>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="relative">
                  <div className={`relative transition-all duration-200 ${
                    isInputFocused ? 'scale-[1.01]' : ''
                  }`}>
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder={isRecording ? 'Listening...' : 'Type or speak your response...'}
                      disabled={kaiConverse.isPending || isRecording}
                      className={`h-14 pr-28 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-base transition-all duration-200 ${
                        isInputFocused 
                          ? 'ring-2 ring-purple-500/50 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                          : isRecording
                          ? 'ring-2 ring-red-500/50 border-red-500/50 shadow-lg shadow-red-500/20'
                          : ''
                      }`}
                    />
                    <div className="absolute right-2 top-2 flex gap-2">
                      {/* Voice Input Button */}
                      <Button
                        type="button"
                        size="icon"
                        onClick={toggleVoiceInput}
                        disabled={kaiConverse.isPending}
                        className={`h-10 w-10 transition-all duration-200 ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-500/50'
                            : 'bg-slate-700 hover:bg-slate-600 shadow-lg'
                        }`}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>

                      {/* Send Button */}
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!inputValue.trim() || kaiConverse.isPending}
                        className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Right Panel: Live Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enrollment Summary</h3>
                  <p className="text-xs text-slate-400">Live updates</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-purple-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</p>
                  </div>
                  <p className="text-white font-medium">
                    {enrollmentData.firstName && enrollmentData.lastName
                      ? `${enrollmentData.firstName} ${enrollmentData.lastName}`
                      : <span className="text-slate-500 italic">Not provided yet</span>
                    }
                  </p>
                </div>

                {/* Email */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                  </div>
                  <p className="text-white font-medium">
                    {enrollmentData.email || <span className="text-slate-500 italic">Not provided yet</span>}
                  </p>
                </div>

                {/* Phone */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-green-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                  </div>
                  <p className="text-white font-medium">
                    {enrollmentData.phone || <span className="text-slate-500 italic">Not provided yet</span>}
                  </p>
                </div>

                {/* Student Type */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student Type</p>
                  </div>
                  <p className="text-white font-medium">
                    {enrollmentData.studentType || <span className="text-slate-500 italic">Not provided yet</span>}
                  </p>
                </div>

                {/* Program */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Program</p>
                  </div>
                  <p className="text-white font-medium">
                    {enrollmentData.program || <span className="text-slate-500 italic">Not provided yet</span>}
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-400">Progress</p>
                  <p className="text-sm font-bold text-white">{Math.round((currentStep / (ENROLLMENT_STEPS.length - 1)) * 100)}%</p>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / (ENROLLMENT_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
