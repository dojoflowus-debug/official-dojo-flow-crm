import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import BottomNavLayout from '@/components/BottomNavLayout';
import RedVortexKai from '../components/RedVortexKai'
import VoiceInput from '../components/VoiceInput'
import { getAvatarName } from '@/../../shared/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Activity,
  ArrowUpRight,
  MessageSquare,
  Volume2,
  VolumeX,
  Tablet,
  UserCheck,
  FileCheck
} from 'lucide-react'

export default function Dashboard() {
  const [avatarName] = useState(() => getAvatarName())
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<any[]>([])  // Start with empty messages, greeting will be spoken only
  const [inputText, setInputText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(() => {
    // Load from localStorage or default to female
    const saved = localStorage.getItem('kaiVoiceGender')
    return (saved === 'male' || saved === 'female') ? saved : 'female'
  })
  const [todaysAgenda, setTodaysAgenda] = useState<any[]>([])
  const [currentStudent, setCurrentStudent] = useState<any>(null)  // Store current student context
  const [currentLead, setCurrentLead] = useState<any>(null)  // Store current lead context
  const [knockCount, setKnockCount] = useState(0)  // Track double-knock
  const [poppingMessages, setPoppingMessages] = useState<Set<number>>(new Set())  // Track messages being popped
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const hasGreetedRef = useRef(false)  // Prevent duplicate greetings
  const knockTimeoutRef = useRef<NodeJS.Timeout | null>(null)  // Timeout for knock detection
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)  // Track current audio element
  const inputTextRef = useRef<string>('')  // Track latest input text for auto-submit

  // Kiosk stats
  const [kioskStats, setKioskStats] = useState({
    checkIns: 0,
    visitors: 0,
    waivers: 0
  })

  // Fetch kiosk stats using trpc
  const kioskCheckInsQuery = trpc.kiosk.checkIns.useQuery(undefined, { refetchInterval: 30000 });
  const kioskVisitorsQuery = trpc.kiosk.visitors.useQuery(undefined, { refetchInterval: 30000 });
  const kioskWaiversQuery = trpc.kiosk.waivers.useQuery(undefined, { refetchInterval: 30000 });

  // Fallback: Direct API fetch for kiosk stats
  useEffect(() => {
    const fetchKioskStats = async () => {
      try {
        const [checkInsRes, visitorsRes, waiversRes] = await Promise.all([
          fetch('/api/trpc/kiosk.checkIns?batch=1&input=%7B%220%22%3A%7B%7D%7D'),
          fetch('/api/trpc/kiosk.visitors?batch=1&input=%7B%220%22%3A%7B%7D%7D'),
          fetch('/api/trpc/kiosk.waivers?batch=1&input=%7B%220%22%3A%7B%7D%7D')
        ]);
        
        const [checkInsJson, visitorsJson, waiversJson] = await Promise.all([
          checkInsRes.json(),
          visitorsRes.json(),
          waiversRes.json()
        ]);
        
        setKioskStats({
          checkIns: checkInsJson[0]?.result?.data?.length || 0,
          visitors: visitorsJson[0]?.result?.data?.length || 0,
          waivers: waiversJson[0]?.result?.data?.length || 0
        });
      } catch (error) {
        console.error('Failed to fetch kiosk stats:', error);
      }
    };
    
    fetchKioskStats();
    const interval = setInterval(fetchKioskStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setKioskStats({
      checkIns: kioskCheckInsQuery.data?.data?.length || 0,
      visitors: kioskVisitorsQuery.data?.data?.length || 0,
      waivers: kioskWaiversQuery.data?.data?.length || 0
    });
  }, [kioskCheckInsQuery.data, kioskVisitorsQuery.data, kioskWaiversQuery.data]);

  // Stats data - fetch from API
  const [stats, setStats] = useState([
    {
      title: 'Total Students',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Monthly Revenue',
      value: '$0',
      change: '+0%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Active Leads',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Activity,
    },
  ])

  // Fetch real-time stats from API using trpc
  const dashboardStatsQuery = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 30000 });

  // Fallback: Direct API fetch if tRPC fails
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/trpc/dashboard.stats?batch=1&input=%7B%220%22%3A%7B%7D%7D');
        const json = await response.json();
        const data = json[0]?.result?.data;
        
        if (data) {
          setStats([
            {
              title: 'Total Students',
              value: data.total_students?.toString() || '0',
              change: '+0%',
              trend: 'up',
              icon: Users,
            },
            {
              title: 'Monthly Revenue',
              value: `$${data.monthly_revenue?.toLocaleString() || '0'}`,
              change: '+0%',
              trend: 'up',
              icon: DollarSign,
            },
            {
              title: 'Active Leads',
              value: data.total_leads?.toString() || '0',
              change: '+0%',
              trend: 'up',
              icon: Activity,
            },
          ]);
          
          if (data.todays_classes && data.todays_classes.length > 0) {
            const realAgenda = data.todays_classes.map((cls: any) => ({
              title: cls.name,
              time: cls.time || 'TBD',
              attendees: cls.enrolled || 0
            }));
            setTodaysAgenda(realAgenda);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const data = dashboardStatsQuery.data;
    if (data) {
      setStats([
        {
          title: 'Total Students',
          value: data.total_students?.toString() || '0',
          change: '+0%',
          trend: 'up',
          icon: Users,
        },
        {
          title: 'Monthly Revenue',
          value: `$${data.monthly_revenue?.toLocaleString() || '0'}`,
          change: '+0%',
          trend: 'up',
          icon: DollarSign,
        },
        {
          title: 'Active Leads',
          value: data.total_leads?.toString() || '0',
          change: '+0%',
          trend: 'up',
          icon: Activity,
        },
      ]);
      
      // Update today's agenda with real classes
      if (data.todays_classes && data.todays_classes.length > 0) {
        const realAgenda = data.todays_classes.map((cls: any) => ({
          title: cls.name,
          time: cls.time || 'TBD',
          attendees: cls.enrolled || 0
        }));
        setTodaysAgenda(realAgenda);
      } else {
        setTodaysAgenda([]);
      }
    }
  }, [dashboardStatsQuery.data]);

  // Stats are now fetched automatically via trpc queries

  const historyChats = [
    { title: 'Can email campaign return on inv...', time: 'Today' },
    { title: 'How should we prepare for upcom...', time: 'Yesterday' },
    { title: 'What is the average class size?', time: '2 days ago' },
    { title: 'Show me student retention rates', time: '3 days ago' },
    { title: 'I want to create new campaign', time: '4 days ago' },
    { title: 'How can we improve attendance?', time: '5 days ago' },
    { title: 'I want to see the leads pipeline', time: '1 week ago' },
  ]

  // todaysAgenda is now fetched from API and stored in state

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = async (event: any) => {
        const speechResult = event.results[0][0].transcript
        setTranscript(speechResult)
        setIsListening(false)
        
        // Send message and get AI response
        const messageText = speechResult
        if (!messageText.trim()) return

        // Add user message
        const userMessage = {
          type: 'user',
          text: messageText,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])

        try {
          // Build conversation history from messages (last 10 messages for context)
          const conversationHistory = messages.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text
          }));
          
          // Call intelligent AI backend via trpc with conversation history
          const data = await kaiChatMutation.mutateAsync({
            message: messageText,
            conversation_id: 'dashboard',
            context: {},
            conversationHistory
          });
          
          // Check if Kai found a student
          if (data.action_result && data.action_result.type === 'student_lookup' && data.action_result.student) {
            const student = data.action_result.student
            setCurrentStudent(student)
            
            const aiMessage = {
              type: 'ai',
              text: data.response,
              timestamp: new Date(),
              studentCard: student
            }
            setMessages(prev => [...prev, aiMessage])
            if (voiceEnabled) {
              await speakText(data.response)
            }
            return
          }
          
          // Check if Kai found a lead
          if (data.action_result && data.action_result.type === 'lead_lookup' && data.action_result.lead) {
            const lead = data.action_result.lead
            setCurrentLead(lead)
            
            const aiMessage = {
              type: 'ai',
              text: data.response,
              timestamp: new Date(),
              leadCard: lead
            }
            setMessages(prev => [...prev, aiMessage])
          } else {
            const aiMessage = {
              type: 'ai',
              text: data.response,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMessage])
          }
          
          // Speak the AI response when using voice input
          if (voiceEnabled && data.response) {
            setTimeout(() => speakText(data.response), 300)
          }
        } catch (error) {
          console.error('Error getting AI response:', error)
          const errorMessage = {
            type: 'ai',
            text: `Error: ${(error as any).message || 'Unknown error'}. Please check console for details.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Auto-greeting disabled - user must double-click Kai to activate voice
  }, [])

  // Function to speak text using ElevenLabs API with Web Speech fallback
  const speakText = async (text: string) => {
    if (!voiceEnabled) return

    // Stop any currently playing speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    
    // Stop any other playing audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })

    try {
      setIsSpeaking(true)
      
      // Try ElevenLabs API first
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceGender })
      })

      if (response.ok) {
        // Get audio blob from response
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Create and play audio
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio  // Track current audio
        
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl) // Clean up
          currentAudioRef.current = null
        }
        
        audio.onerror = () => {
          console.error('Error playing ElevenLabs audio, falling back to Web Speech')
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          currentAudioRef.current = null
          // Fallback to Web Speech API
          speakWithBrowserVoice(text)
        }
        
        await audio.play()
        console.log('Playing ElevenLabs voice (Alexandra)')
      } else {
        console.error('ElevenLabs API failed, falling back to Web Speech:', await response.text())
        // Fallback to Web Speech API
        speakWithBrowserVoice(text)
      }
    } catch (error) {
      console.error('Error in speakText, falling back to Web Speech:', error)
      // Fallback to Web Speech API
      speakWithBrowserVoice(text)
    }
  }

  // Fallback function using Web Speech API
  const speakWithBrowserVoice = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false)
      return
    }

    try {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Samantha')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
      }
      
      utterance.onerror = (error) => {
        console.error('Web Speech error:', error)
        setIsSpeaking(false)
      }
      
      window.speechSynthesis.speak(utterance)
      console.log('Speaking with Web Speech API (fallback)')
    } catch (error) {
      console.error('Error in speakWithBrowserVoice:', error)
      setIsSpeaking(false)
    }
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const toggleVoiceGender = () => {
    const newGender = voiceGender === 'female' ? 'male' : 'female'
    setVoiceGender(newGender)
    localStorage.setItem('kaiVoiceGender', newGender)
    
    // Stop any currently playing speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsSpeaking(false)
  }

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Kai chat mutation
  const kaiChatMutation = trpc.kai.chat.useMutation();

  const handleSendMessage = async (text?: string) => {
    console.log('[CRMDashboard] ========== handleSendMessage CALLED ==========');
    console.log('[CRMDashboard] text parameter:', text);
    console.log('[CRMDashboard] inputText state:', inputText);
    console.log('[CRMDashboard] inputTextRef.current:', inputTextRef.current);
    
    const messageText = text || inputText
    console.log('[CRMDashboard] Final messageText:', messageText);
    
    if (!messageText.trim()) {
      console.error('[CRMDashboard] ERROR: messageText is empty, returning early');
      return;
    }

    console.log('[CRMDashboard] Sending message:', messageText)
    console.log('[CRMDashboard] isListening before send:', isListening)

    // Trigger pop animation for old messages before adding new one
    if (messages.length > 0) {
      const oldMessageIndices = new Set<number>()
      // Mark the last 3 messages for popping
      for (let i = Math.max(0, messages.length - 3); i < messages.length; i++) {
        oldMessageIndices.add(i)
      }
      setPoppingMessages(oldMessageIndices)
      
      // Wait for pop animation to complete before adding new message
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    
    // Clear popping state
    setPoppingMessages(new Set())
    
    // Add user message
    const userMessage = {
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setTranscript('')
    
    // Ensure listening is stopped
    setIsListening(false)
    console.log('[CRMDashboard] Reset isListening to false')

    try {
      // Build conversation history from messages (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));
      
      // Call intelligent AI backend via trpc with conversation history
      const data = await kaiChatMutation.mutateAsync({
        message: messageText,
        avatarName,
        conversation_id: 'dashboard',
        context: {},
        conversationHistory
      });
      
      // Check if Kai found a student
      if (data.action_result && data.action_result.type === 'student_lookup' && data.action_result.student) {
        const student = data.action_result.student
        // Store student context for follow-up questions
        setCurrentStudent(student)
        
        // Add AI message with student card
        const aiMessage = {
          type: 'ai',
          text: data.response,
          timestamp: new Date(),
          studentCard: student
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const aiMessage = {
          type: 'ai',
          text: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      }
      
      // Auto-speak Kai's response if voice is enabled (single call for all cases)
      if (voiceEnabled && data.response) {
        speakText(data.response)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      console.error('Error details:', (error as any).message, (error as any).stack)
      
      // Fallback to friendly error message with error details for debugging
      const errorMessage = {
        type: 'ai',
        text: `Error: ${(error as any).message || 'Unknown error'}. Please check console for details.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Removed generateAIResponse - now using intelligent AI backend

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <BottomNavLayout>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        {/* Main Kai Interface - Center */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-4 md:mb-6 px-2 md:px-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">AI-powered dojo management at your fingertips</p>
          </div>

          {/* Kai Chat Interface */}
          <Card className="flex flex-col border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden max-h-[700px]">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{avatarName}</CardTitle>
                    <CardDescription>
                      AI Assistant • Online
                      {isSpeaking && <span className="ml-2 text-primary animate-pulse">● Speaking...</span>}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className={`gap-2 ${voiceEnabled ? 'text-green-500 border-green-500/50' : 'text-muted-foreground'}`}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {voiceEnabled ? 'Voice On' : 'Voice Off'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoiceGender}
                  className="gap-2 text-cyan-500 border-cyan-500/50"
                  title={`Switch to ${voiceGender === 'female' ? 'male' : 'female'} voice`}
                >
                  <Sparkles className="w-4 h-4" />
                  {voiceGender === 'female' ? '♀ Female' : '♂ Male'}
                </Button>
              </div>
            </CardHeader>

            {/* Plasma Ball and Messages Area */}
            <CardContent className="flex-1 overflow-hidden p-16 md:p-20 pt-20 md:pt-24 pb-20 md:pb-24 relative flex items-center justify-center">
              {/* Plasma Ball Kai - Centered and Fixed */}
              <div 
                className="relative cursor-pointer z-30"
                onClick={() => {
                  console.log('[Kai] Glass clicked, knock count:', knockCount)
                  
                  // Increment knock count
                  setKnockCount(prev => prev + 1)
                  
                  // Clear existing timeout
                  if (knockTimeoutRef.current) {
                    clearTimeout(knockTimeoutRef.current)
                  }
                  
                  // Check for double-knock
                  if (knockCount === 1) {
                    // Double-knock detected!
                    console.log('[Kai] Double-knock detected! Playing greeting...')
                    
                    // Play greeting
                    const greeting = "Hello! How can I help you today?"
                    const greetingMessage = {
                      type: 'ai',
                      text: greeting,
                      timestamp: new Date()
                    }
                    setMessages(prev => [...prev, greetingMessage])
                    
                    // Speak the greeting
                    if (voiceEnabled) {
                      speakText(greeting)
                    }
                    
                    // Reset knock count after animation
                    setTimeout(() => {
                      setKnockCount(0)
                    }, 3000)
                  } else {
                    // Set timeout to reset knock count
                    knockTimeoutRef.current = setTimeout(() => {
                      setKnockCount(0)
                    }, 500) // 500ms window for double-knock
                  }
                }}
                title={`Double-click to activate ${avatarName}`}
              >
                {/* Glow Rings - Three States: Idle (Cyan), Speaking (Gold Ring), Listening (Green) */}
                {/* Idle State - Cyan Glow */}
                {!isSpeaking && !isListening && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                    style={{ opacity: 0.3 }}
                  >
                    {/* Ring 1 - Innermost */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '380px',
                        height: '380px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 40%, rgba(6, 182, 212, 0.4) 40%, rgba(8, 145, 178, 0.3) 60%, rgba(14, 116, 144, 0.2) 75%, transparent 100%)',
                        filter: 'blur(25px)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '450px',
                        height: '450px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 35%, rgba(8, 145, 178, 0.4) 35%, rgba(14, 116, 144, 0.3) 55%, rgba(21, 94, 117, 0.2) 75%, transparent 100%)',
                        filter: 'blur(30px)',
                        animation: 'pulse 2.5s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '520px',
                        height: '520px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 30%, rgba(14, 116, 144, 0.4) 30%, rgba(21, 94, 117, 0.3) 50%, rgba(22, 78, 99, 0.2) 70%, transparent 100%)',
                        filter: 'blur(35px)',
                        animation: 'pulse 3s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 25%, rgba(21, 94, 117, 0.3) 25%, rgba(22, 78, 99, 0.2) 50%, rgba(23, 63, 82, 0.1) 70%, transparent 100%)',
                        filter: 'blur(40px)',
                        animation: 'pulse 3.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                )}

                {/* Speaking State - Gold Ring */}
                {isSpeaking && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                    style={{ transform: 'scale(1.15)' }}
                  >
                    <div
                      className="absolute rounded-full border-4 transition-all duration-300"
                      style={{
                        width: '320px',
                        height: '320px',
                        borderColor: 'rgba(251, 191, 36, 0.8)',
                        boxShadow: '0 0 30px rgba(251, 191, 36, 0.6), inset 0 0 30px rgba(251, 191, 36, 0.3)',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                )}

                {/* Listening State - Green Glow */}
                {isListening && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                    style={{ opacity: 0.6 }}
                  >
                    {/* Ring 1 - Innermost */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '380px',
                        height: '380px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 40%, rgba(34, 197, 94, 0.4) 40%, rgba(16, 185, 129, 0.3) 60%, rgba(5, 150, 105, 0.2) 75%, transparent 100%)',
                        filter: 'blur(25px)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '450px',
                        height: '450px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 35%, rgba(16, 185, 129, 0.4) 35%, rgba(5, 150, 105, 0.3) 55%, rgba(4, 120, 87, 0.2) 75%, transparent 100%)',
                        filter: 'blur(30px)',
                        animation: 'pulse 2.5s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '520px',
                        height: '520px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 30%, rgba(5, 150, 105, 0.4) 30%, rgba(4, 120, 87, 0.3) 50%, rgba(6, 95, 70, 0.2) 70%, transparent 100%)',
                        filter: 'blur(35px)',
                        animation: 'pulse 3s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, transparent 0%, transparent 25%, rgba(4, 120, 87, 0.3) 25%, rgba(6, 95, 70, 0.2) 50%, rgba(5, 78, 56, 0.1) 70%, transparent 100%)',
                        filter: 'blur(40px)',
                        animation: 'pulse 3.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                )}

                {/* Kai orb - positioned above glow rings */}
                <div 
                  className="relative z-10 transition-transform duration-300"
                  style={{
                    transform: isSpeaking ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  <RedVortexKai isSpeaking={isSpeaking} />
                </div>
                
                {/* Audio Waveform Visualization */}
                {isSpeaking && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-end justify-center gap-1 h-12">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full transition-all duration-150"
                        style={{
                          background: 'linear-gradient(to top, rgba(251, 191, 36, 0.8), rgba(251, 191, 36, 0.3))',
                          height: `${20 + Math.sin((Date.now() / 100) + i * 0.5) * 20}px`,
                          animation: `waveform ${0.8 + (i % 3) * 0.2}s ease-in-out infinite`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Messages - Positioned Absolutely Around Kai */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {messages.slice(-3).map((message, sliceIndex) => {
                  // For sliced array: sliceIndex 0 is oldest visible, last index is newest
                  const actualIndex = messages.length - 3 + sliceIndex
                  const messageAge = messages.length - 1 - actualIndex
                  const isVisible = messageAge < 3
                  const isUser = message.type === 'user'
                  const isNewest = messageAge === 0
                  const isPopping = poppingMessages.has(actualIndex)
                  
                  // Position messages based on type and age
                  // User messages on right, AI messages on left
                  // Older messages positioned further from center
                  const baseOffset = 200 // Distance from Kai's center (in pixels)
                  const ageSpacing = 50 // Additional spacing for older messages
                  const horizontalOffset = baseOffset + (messageAge * ageSpacing)
                  const verticalOffset = messageAge * 20
                  
                  // Determine animation class
                  let animationClass = ''
                  if (isNewest && !isPopping) {
                    animationClass = 'animate-starwars-crawl'
                  } else if (isPopping) {
                    animationClass = 'animate-pop-balloon'
                  }
                  
                  // Calculate Star Wars crawl positions
                  const crawlXStart = isUser ? '400px' : '-400px'
                  const crawlXEnd = isUser ? `${horizontalOffset}px` : `-${horizontalOffset}px`
                  
                  return (
                    <div
                      key={actualIndex}
                      className={`absolute pointer-events-auto`}
                      style={{
                        display: isVisible ? 'block' : 'none',
                        left: '50%',
                        top: `calc(50% - 60px + ${verticalOffset}px)`,
                        transform: `translateX(${isUser ? horizontalOffset : -horizontalOffset}px)`,
                        maxWidth: '280px',
                        zIndex: 40 - messageAge,
                        transformOrigin: isUser ? 'right center' : 'left center',
                        perspective: '1000px',
                        transformStyle: 'preserve-3d'
                      } as React.CSSProperties}
                    >
                      <div
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${animationClass}`}
                        style={{
                          transformStyle: 'preserve-3d',
                          '--crawl-x-start': crawlXStart,
                          '--crawl-x-end': crawlXEnd
                        } as React.CSSProperties}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                      </div>
                      {/* Student Card if included */}
                      {message.studentCard && (
                        <div className="mt-3 ml-0">
                          <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">
                                {message.studentCard.first_name} {message.studentCard.last_name}
                              </CardTitle>
                              <CardDescription>
                                {message.studentCard.belt_rank} • {message.studentCard.status}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Email</p>
                                  <p className="font-medium">{message.studentCard.email}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Phone</p>
                                  <p className="font-medium">{message.studentCard.phone}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Age</p>
                                  <p className="font-medium">{message.studentCard.age}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Membership</p>
                                  <p className="font-medium">{message.studentCard.membership_status}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      
                      {/* Lead Card if included */}
                      {message.leadCard && (
                        <div className="mt-3 ml-0">
                          <Card className="border-purple-500/30 bg-gradient-to-br from-background to-purple-500/5">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">
                                {message.leadCard.first_name} {message.leadCard.last_name}
                              </CardTitle>
                              <CardDescription>
                                Lead • {message.leadCard.status}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Email</p>
                                  <p className="font-medium">{message.leadCard.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Phone</p>
                                  <p className="font-medium">{message.leadCard.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Source</p>
                                  <p className="font-medium">{message.leadCard.source || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Pipeline</p>
                                  <p className="font-medium">{message.leadCard.status}</p>
                                </div>
                              </div>
                              {message.leadCard.notes && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-muted-foreground text-xs">Notes</p>
                                  <p className="text-sm mt-1">{message.leadCard.notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Voice Button */}
                <div className="h-14 w-14">
                  <VoiceInput
                    onTranscript={(text) => {
                      const newText = (inputText + ' ' + text).trim();
                      setInputText(newText);
                      inputTextRef.current = newText;  // Update ref immediately
                      setTranscript(text);
                    }}
                    onListeningChange={setIsListening}
                    autoSubmit={true}
                    onAutoSubmit={() => {
                      console.log('[CRMDashboard] ========== AUTO-SUBMIT CALLBACK FIRED ==========');
                      console.log('[CRMDashboard] inputText state:', inputText);
                      console.log('[CRMDashboard] inputTextRef.current:', inputTextRef.current);
                      console.log('[CRMDashboard] Has text to send:', !!inputTextRef.current.trim());
                      
                      if (inputTextRef.current.trim()) {
                        console.log('[CRMDashboard] Calling handleSendMessage()...');
                        handleSendMessage();
                        console.log('[CRMDashboard] handleSendMessage() called');
                      } else {
                        console.error('[CRMDashboard] ERROR: No text to send!');
                      }
                      console.log('[CRMDashboard] ========== AUTO-SUBMIT CALLBACK COMPLETE ==========');
                    }}
                  />
                </div>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? 'Listening...' : 'Type or click the mic to speak...'}
                    className="w-full h-14 px-4 pr-12 rounded-full bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    disabled={isListening}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendMessage()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 p-0"
                    disabled={!inputText.trim()}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {isListening && (
                <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
                  Listening... Speak now
                </p>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/50 bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.change} from last month
                      </p>
                    </div>
                    <stat.icon className="w-8 h-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kiosk Activity Today */}
          <Card className="mt-4 border-orange-500/30 bg-gradient-to-br from-background via-orange-950/5 to-orange-900/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tablet className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">Kiosk Activity Today</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/kiosk'}
                  className="text-orange-500 border-orange-500/50 hover:bg-orange-500/10"
                >
                  View Details
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <CardDescription>Real-time self-service activity from your kiosk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kioskStats.checkIns}</p>
                    <p className="text-xs text-muted-foreground">Check-Ins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kioskStats.visitors}</p>
                    <p className="text-xs text-muted-foreground">New Visitors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kioskStats.waivers}</p>
                    <p className="text-xs text-muted-foreground">Waivers Signed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - History & Agenda */}
        <div className="w-80 flex flex-col gap-4">
          {/* History Chat */}
          <Card className="flex-1 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                History Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto max-h-[400px]">
              {historyChats.map((chat, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border/50"
                >
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{chat.time}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Today's Agenda */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysAgenda.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted border border-border/50"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className="text-xs text-primary font-medium">{item.attendees} students</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </BottomNavLayout>
  )
}

