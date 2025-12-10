import { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Store, 
  CreditCard, 
  User, 
  BarChart3,
  Grid2x2,
  Mic,
  MicOff,
  Send,
  Volume2
} from 'lucide-react';
import PlasmaKai from '../components/PlasmaKai';
import kaiDataService from '../services/kaiDataService';
import { trpc } from '../lib/trpc';
import { getAvatarName } from '@/../../shared/utils';

/**
 * Kai Dashboard - AI-Powered Circular Radial Dashboard
 * With full voice interaction, memory, conversation history, and double-tap greeting
 */

export default function KaiDashboard() {
  const [avatarName] = useState(() => getAvatarName());
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [knockCount, setKnockCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! 👋 I'm ${getAvatarName()}, your AI assistant. I can help you navigate, find information, and manage your dojo. Try asking me about students, leads, or revenue!`,
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  
  const knockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Infinite scroll handler
  const handleScroll = () => {
    const scrollContainer = historyScrollRef.current;
    if (!scrollContainer || isLoadingMore || !hasMoreMessages) return;

    // Check if scrolled to top (within 50px)
    if (scrollContainer.scrollTop < 50) {
      loadMoreMessages();
    }
  };

  // Load more messages (simulated - replace with actual API call)
  const loadMoreMessages = () => {
    setIsLoadingMore(true);
    previousScrollHeight.current = historyScrollRef.current?.scrollHeight || 0;

    // Simulate API call delay
    setTimeout(() => {
      // In a real app, fetch older messages from backend
      // For now, we'll just add mock messages
      const olderMessages = [
        {
          role: 'user',
          content: 'Previous conversation message',
          timestamp: new Date(Date.now() - 3600000 * (messageOffset + 1))
        },
        {
          role: 'assistant',
          content: `Previous response from ${getAvatarName()}`,
          timestamp: new Date(Date.now() - 3600000 * (messageOffset + 1) + 60000)
        }
      ];

      setMessages(prev => [...olderMessages, ...prev]);
      setMessageOffset(prev => prev + 2);
      setIsLoadingMore(false);

      // Maintain scroll position after adding messages
      setTimeout(() => {
        if (historyScrollRef.current) {
          const newScrollHeight = historyScrollRef.current.scrollHeight;
          historyScrollRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
        }
      }, 0);

      // Stop loading after 10 messages (5 pairs)
      if (messageOffset >= 8) {
        setHasMoreMessages(false);
      }
    }, 800);
  };

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = historyScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingMore, hasMoreMessages, messageOffset]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setIsRecording(false);
        // Auto-submit after voice input
        setTimeout(() => {
          if (transcript.trim()) {
            processCommand(transcript.trim());
          }
        }, 100);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };
    }
  }, []);

  // Auto-scroll history to bottom when messages change
  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Text-to-speech function using ElevenLabs API from main dashboard
  const speak = async (text: string) => {
    if (!voiceEnabled) return;

    // Stop any currently playing speech
    if (isProcessing) {
      window.speechSynthesis.cancel();
      // Stop any playing audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    // Set processing to true when starting to speak
    setIsProcessing(true);

    try {
      // Call ElevenLabs API directly
      const voiceId = 'kdmDKE6EkgrWrrykO9Qt'; // Alexandra - Conversational and Real
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_a768d703ba9a994fdd5dece68878d9a14abe51de9d776b27'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.98,
            similarity_boost: 0.99,
            style: 0.01,
            use_speaker_boost: true
          }
        })
      });

      if (response.ok) {
        // Get audio blob from response
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create and play audio
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          setIsProcessing(false); // Stop red effects when audio finishes
        };
        
        audio.onerror = () => {
          console.error('Error playing ElevenLabs audio, falling back to Web Speech');
          URL.revokeObjectURL(audioUrl);
          setIsProcessing(false); // Stop red effects on error
          // Fallback to Web Speech API
          speakWithBrowserVoice(text);
        };
        
        await audio.play();
        console.log('Playing ElevenLabs voice (Alexandra)');
      } else {
        console.error('ElevenLabs API failed, falling back to Web Speech:', await response.text());
        setIsProcessing(false); // Stop red effects on API failure
        // Fallback to Web Speech API
        speakWithBrowserVoice(text);
      }
    } catch (error) {
      console.error('Error in speak, falling back to Web Speech:', error);
      setIsProcessing(false); // Stop red effects on error
      // Fallback to Web Speech API
      speakWithBrowserVoice(text);
    }
  };

  // Fallback function using Web Speech API
  const speakWithBrowserVoice = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in speakWithBrowserVoice:', error);
    }
  };

  // Toggle voice listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setIsRecording(true);
    }
  };

  // Process AI command with OpenAI GPT-4
  const processCommand = async (userMessage: string) => {
    // Add user message
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      console.log('[Kai] Processing message with OpenAI:', userMessage);
      
      // Call the OpenAI-powered kai.chat tRPC mutation
      const result = await trpc.kai.chat.mutate({ message: userMessage, avatarName });
      
      console.log('[Kai] OpenAI response:', result);
      
      if (result?.response) {
        const assistantMsg = {
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        speak(result.response);
        setIsProcessing(false);
        return;
      }
      
      console.log('[Kai] OpenAI failed, falling back to local processing');
    } catch (error) {
      console.error('[Kai] OpenAI error:', error);
    }
      
    // Fallback to local processing if OpenAI fails
    const localResponse = await processCommandLocally(userMessage);
    
    if (localResponse && localResponse.message) {
      console.log('[Kai] Local processing successful:', localResponse);
      const assistantMsg = {
        role: 'assistant',
        content: localResponse.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      speak(localResponse.message);
      setIsProcessing(false);
      return;
    }
    
    // Default response if no match
    const defaultMsg = {
      role: 'assistant',
      content: "I'm here to help! Try asking me about your students, leads, revenue, or navigate to different sections of the dashboard.",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, defaultMsg]);
    speak(defaultMsg.content);
    setIsProcessing(false);
  };

  const processCommandLocally = async (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    // Navigation commands
    if (lowerMsg.includes('show') && lowerMsg.includes('lead')) {
      return {
        message: "Opening the leads pipeline for you!",
        executed: true
      };
    }
    if (lowerMsg.includes('student') && !lowerMsg.includes('how many') && !lowerMsg.includes('total')) {
      return {
        message: "Taking you to the students page!",
        executed: true
      };
    }
    if (lowerMsg.includes('class')) {
      return {
        message: "Showing you the classes schedule!",
        executed: true
      };
    }
    if (lowerMsg.includes('dashboard') || lowerMsg.includes('home')) {
      return {
        message: "Taking you back to the dashboard!",
        executed: true
      };
    }

    // Stats queries - NOW WITH REAL DATA!
    if (lowerMsg.includes('how many student') || lowerMsg.includes('total student')) {
      console.log('[Kai] Student query detected, calling kaiDataService.getStudents()');
      const result = await kaiDataService.getStudents();
      console.log('[Kai] getStudents result:', result);
      if (result.success) {
        const activeCount = result.data.filter((s: any) => s.status === 'Active').length;
        return {
          message: `You currently have ${result.count} students enrolled${activeCount > 0 ? `, with ${activeCount} active students` : ''}. ${result.count > 0 ? 'Keep up the great work!' : 'Ready to add your first students?'}`,
          executed: false
        };
      }
      return {
        message: "I'm having trouble accessing student data right now. Please try again.",
        executed: false
      };
    }
    
    if (lowerMsg.includes('revenue') || lowerMsg.includes('income') || lowerMsg.includes('earning')) {
      const stats = await kaiDataService.getDashboardStats();
      if (stats.success) {
        const revenue = stats.data.monthlyRevenue || 0;
        return {
          message: `Your monthly revenue is $${revenue.toLocaleString()}${revenue > 0 ? '. Great job!' : '. Time to grow your dojo!'}`,
          executed: false
        };
      }
      return {
        message: "I'm having trouble calculating revenue right now. Please try again.",
        executed: false
      };
    }
    
    if (lowerMsg.includes('lead') && !lowerMsg.includes('show')) {
      const result = await kaiDataService.getLeads();
      if (result.success) {
        const hotLeads = result.data.filter((l: any) => l.status === 'Hot').length;
        return {
          message: `You have ${result.count} leads in your pipeline${hotLeads > 0 ? `, including ${hotLeads} hot leads` : ''}!`,
          executed: false
        };
      }
      return {
        message: "I'm having trouble accessing leads data right now. Please try again.",
        executed: false
      };
    }
    
    if (lowerMsg.includes('class') && (lowerMsg.includes('how many') || lowerMsg.includes('total'))) {
      const result = await kaiDataService.getClasses();
      if (result.success) {
        return {
          message: `You have ${result.count} classes scheduled. ${result.count > 0 ? 'Your students are training hard!' : 'Ready to schedule your first class?'}`,
          executed: false
        };
      }
      return {
        message: "I'm having trouble accessing class data right now. Please try again.",
        executed: false
      };
    }
    
    if (lowerMsg.includes('stats') || lowerMsg.includes('overview') || lowerMsg.includes('summary')) {
      const stats = await kaiDataService.getDashboardStats();
      if (stats.success) {
        const d = stats.data;
        return {
          message: `Here's your dojo overview: ${d.totalStudents} students (${d.activeStudents} active), ${d.totalLeads} leads, ${d.totalClasses} classes, and $${d.monthlyRevenue.toLocaleString()} monthly revenue. ${d.overduePayments > 0 ? `Note: ${d.overduePayments} students have overdue payments.` : 'All payments are up to date!'}`,
          executed: false
        };
      }
      return {
        message: "I'm having trouble gathering stats right now. Please try again.",
        executed: false
      };
    }

    // Default response
    return null;
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      processCommand(input.trim());
    }
  };

  // Glass knock sound effect
  const playGlassTapSound = () => {
    const audio = new Audio('/glass-knock.wav');
    audio.volume = 0.6;
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  // Handle double-tap on glass ball
  const handleGlassClick = () => {
    playGlassTapSound();
    
    // Increment knock count
    setKnockCount(prev => prev + 1);
    
    // Clear existing timeout
    if (knockTimeoutRef.current) {
      clearTimeout(knockTimeoutRef.current);
    }
    
    // Check for double-knock
    if (knockCount === 1) {
      // Double-knock detected!
      console.log('Double-knock detected!');
      setIsAnimating(true);
      
      // Play greeting
      const greeting = "Hello! How can I help you today?";
      speak(greeting);
      
      // Reset after animation
      setTimeout(() => {
        setIsAnimating(false);
        setKnockCount(0);
      }, 3000);
    } else {
      // Set timeout to reset knock count
      knockTimeoutRef.current = setTimeout(() => {
        setKnockCount(0);
      }, 500); // 500ms window for double-knock
    }
  };

  // Menu items in circular layout
  // Dynamic menu colors based on Kai's state
  const getMenuColors = () => {
    if (isProcessing) { // isProcessing = Kai is speaking
      return {
        light: 'from-yellow-500 to-amber-600', // Gold for speaking
        dark: 'from-amber-600 to-yellow-700'
      };
    } else if (isListening) {
      return {
        light: 'from-green-500 to-emerald-600', // Green for listening
        dark: 'from-emerald-600 to-green-700'
      };
    } else {
      return {
        light: 'from-cyan-500 to-cyan-600', // Cyan for idle
        dark: 'from-cyan-600 to-cyan-700'
      };
    }
  };

  const colors = getMenuColors();
  const menuItems = [
    { icon: Users, label: 'Students', color: colors.light, badge: 0 },
    { icon: UserPlus, label: 'Leads', color: colors.dark, badge: 0 },
    { icon: BarChart3, label: 'Marketing', color: colors.light, badge: 0 },
    { icon: User, label: 'Staff', color: colors.dark, badge: 0 },
    { icon: User, label: 'Receptionist', color: colors.light, badge: 0 },
    { icon: CreditCard, label: 'Subscription', color: colors.dark, badge: 0 },
    { icon: Grid2x2, label: 'Classes', color: colors.light, badge: 0 },
    { icon: Store, label: 'Kiosk', color: colors.dark, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Dojo Flow</h1>
          
          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-12 left-0 bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl min-w-[200px] z-[100]">
              <button
                onClick={() => window.location.href = '/crm-dashboard'}
                className="w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors flex items-center gap-3 text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Switch to Classic View</span>
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-full ${voiceEnabled ? 'bg-cyan-500/20' : 'bg-gray-500/20'}`}
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] px-4 -mt-24">
          {/* Circular Dashboard */}
          <div className="relative w-full max-w-[600px] aspect-square">
            {/* Circular Rings - Red when speaking with pulse animation, cyan otherwise */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full aspect-square">
              <div 
                className={`w-[83%] h-[83%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-300 ${isProcessing ? 'animate-pulse-ring' : ''}`} 
                style={isProcessing ? { 
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))' 
                } : {
                  borderColor: 'rgba(6, 182, 212, 0.3)' // cyan-500 with 30% opacity
                }} 
              />
              <div 
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[67%] h-[67%] rounded-full border-2 transition-all duration-300 ${isProcessing ? 'animate-pulse-ring' : ''}`} 
                style={isProcessing ? { 
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))' 
                } : {
                  borderColor: 'rgba(6, 182, 212, 0.4)' // cyan-500 with 40% opacity
                }} 
              />
            </div>

            {/* Central Glass Ball */}
            <div 
              className={`absolute w-[45%] h-[45%] rounded-full cursor-pointer border-2 transition-all duration-300 z-20 ${isProcessing ? 'animate-pulse-ring-centered' : ''}`}
                style={isProcessing ? { 
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderColor: 'rgba(239, 68, 68, 0.6)',
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))' 
                } : {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderColor: 'rgba(6, 182, 212, 0.5)' // cyan-500 with 50% opacity
                }}
                onClick={handleGlassClick}
              >
                {/* Glass Sphere Container - 97% of central ball (1cm from dots) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[97%] h-[97%] rounded-full">
                    {/* Glass sphere with gradient reflections */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 20%, transparent 50%)',
                        backdropFilter: 'blur(1px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset -10px -10px 30px rgba(0, 0, 0, 0.1), inset 10px 10px 30px rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    {/* Top-left highlight arc */}
                    <div 
                      className="absolute rounded-full"
                      style={{
                        top: '15px',
                        left: '20px',
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                        filter: 'blur(8px)'
                      }}
                    />
                    {/* Bottom-right subtle shadow */}
                    <div 
                      className="absolute rounded-full"
                      style={{
                        bottom: '20px',
                        right: '25px',
                        width: '60px',
                        height: '60px',
                        background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.15) 0%, transparent 70%)',
                        filter: 'blur(10px)'
                      }}
                    />
                  </div>
                </div>

                {/* Eight dots around the glass ball border */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                  const radius = 50; // 50% of container (glass ball is 50% of parent)
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  return (
                    <div
                      key={angle}
                      className="absolute w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        left: `calc(${50 + x}% - 4px)`,
                        top: `calc(${50 + y}% - 4px)`,
                        backgroundColor: isProcessing ? 'rgb(239, 68, 68)' : 'rgb(34, 211, 238)', // red-500 or cyan-400
                        filter: isProcessing ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' : 'none',
                      }}
                    />
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlasmaKai key="plasma-kai-reset" isSpeaking={isProcessing} isListening={isListening} isAnimating={isAnimating} />
                </div>
                
                {/* Kai Label - positioned below the plasma */}
                <div className="absolute left-1/2 z-30" style={{ bottom: '-40px', transform: 'translateX(-50%)' }}>
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-500/30" data-version="v2-fixed">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-cyan-100">{avatarName}</span>
                    <span className="text-xs text-gray-400">AI Assistant</span>
                  </div>
                </div>
              </div>

            {/* Connection Lines Layer - Behind everything */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {menuItems.map((_, index) => {
                const angle = (index * 360) / menuItems.length - 90;
                const rad = (angle * Math.PI) / 180;
                
                // Inner point at glass ball border (25% from center)
                const innerX = 50 + Math.cos(rad) * 25;
                const innerY = 50 + Math.sin(rad) * 25;
                
                // Outer point at menu items (41.67% from center)
                const outerX = 50 + Math.cos(rad) * 41.67;
                const outerY = 50 + Math.sin(rad) * 41.67;
                
                // Dynamic line colors based on Kai's state
                let baseColor, hoverColor, glowColor;
                if (isProcessing) {
                  // Gold for speaking
                  baseColor = 'rgba(251, 191, 36, 0.3)'; // amber-400
                  hoverColor = 'rgba(251, 191, 36, 0.6)';
                  glowColor = 'rgba(251, 191, 36, 0.8)';
                } else if (isListening) {
                  // Green for listening
                  baseColor = 'rgba(34, 197, 94, 0.3)'; // green-500
                  hoverColor = 'rgba(34, 197, 94, 0.6)';
                  glowColor = 'rgba(34, 197, 94, 0.8)';
                } else {
                  // Cyan for idle
                  baseColor = 'rgba(6, 182, 212, 0.3)'; // cyan-500
                  hoverColor = 'rgba(6, 182, 212, 0.6)';
                  glowColor = 'rgba(6, 182, 212, 0.8)';
                }
                
                return (
                  <line
                    key={index}
                    x1={innerX}
                    y1={innerY}
                    x2={outerX}
                    y2={outerY}
                    stroke={hoveredItem === index ? hoverColor : baseColor}
                    strokeWidth={hoveredItem === index ? '2' : '1.5'}
                    className="transition-all duration-300"
                    style={{
                      filter: hoveredItem === index ? `drop-shadow(0 0 8px ${glowColor})` : 'none'
                    }}
                  />
                );
              })}
            </svg>

            {/* Menu Items in Circular Layout */}
            {menuItems.map((item, index) => {
              const angle = (index * 360) / menuItems.length - 90;
              const rad = (angle * Math.PI) / 180;
              const distance = 41.67; // 250/600 * 100 = 41.67%
              const x = 50 + Math.cos(rad) * distance; // Center at 50%
              const y = 50 + Math.sin(rad) * distance;

              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <button className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-purple-400/30`}>
                    <item.icon className={`w-8 h-8 transition-colors duration-300 ${isProcessing ? 'text-white' : 'text-white/80'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                  <p className="text-center mt-2 text-sm font-medium">{item.label}</p>
                </div>
              );
            })}
           </div>
        </div>
      {/* History Sidebar Toggle Button */}
      <button
          onClick={() => setShowHistory(!showHistory)}
          className="fixed right-8 top-24 z-30 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
          title={showHistory ? "Hide History" : "Show History"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showHistory ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </button>

        {/* History Sidebar - Slides in from right */}
        <div className={`fixed top-24 w-80 h-[calc(100vh-200px)] max-h-[600px] bg-purple-950/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 flex flex-col z-20 transition-all duration-300 ${
          showHistory ? 'right-8' : '-right-96'
        }`}>
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-lg font-semibold">History with {avatarName}</h3>
            </div>
            
            <div ref={historyScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              {!hasMoreMessages && messages.length > 1 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  No more messages
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                  <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-900/50'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="mr-8">
                  <div className="p-3 rounded-lg bg-purple-900/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Input Bar */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-[600px]">
        <form onSubmit={handleSubmit} className="flex gap-3 bg-purple-950/50 backdrop-blur-md p-4 rounded-2xl border border-purple-500/30">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-full ${isRecording ? 'bg-orange-500 animate-pulse' : 'bg-purple-700'} hover:scale-110 transition-all`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Speak or type to ${avatarName}`}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">
          Type or click the mic to speak
        </p>
      </div>
    </div>
  );
}
