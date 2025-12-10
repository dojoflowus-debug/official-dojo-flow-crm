import { useState, useEffect, useRef } from 'react'
import SimpleLayout from '../components/SimpleLayout'
import PlasmaKai from '../components/PlasmaKai'
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

export default function Dashboard({ onLogout, theme, toggleTheme }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState([])  // Start with empty messages, greeting will be spoken only
  const [inputText, setInputText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [todaysAgenda, setTodaysAgenda] = useState([])
  const [currentStudent, setCurrentStudent] = useState(null)  // Store current student context
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const synthRef = useRef(null)
  const hasGreetedRef = useRef(false)  // Prevent duplicate greetings

  // Kiosk stats
  const [kioskStats, setKioskStats] = useState({
    checkIns: 0,
    visitors: 0,
    waivers: 0
  })

  // Fetch kiosk stats
  useEffect(() => {
    const fetchKioskStats = async () => {
      try {
        const [checkIns, visitors, waivers] = await Promise.all([
          fetch('/api/kiosk/checkin/recent').then(r => r.json()),
          fetch('/api/kiosk/visitor/recent').then(r => r.json()),
          fetch('/api/kiosk/waiver/recent').then(r => r.json())
        ])
        setKioskStats({
          checkIns: checkIns?.data?.length || 0,
          visitors: visitors?.data?.length || 0,
          waivers: waivers?.data?.length || 0
        })
      } catch (error) {
        console.error('Error fetching kiosk stats:', error)
      }
    }
    fetchKioskStats()
    const interval = setInterval(fetchKioskStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

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

  // Fetch real-time stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard')
      const data = await response.json()
      
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
      ])
      
      // Update today's agenda with real classes
      if (data.todays_classes && data.todays_classes.length > 0) {
        const realAgenda = data.todays_classes.map(cls => ({
          title: cls.name,
          time: cls.time || 'TBD',
          attendees: cls.enrolled || 0
        }))
        setTodaysAgenda(realAgenda)
      } else {
        setTodaysAgenda([])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats()
  }, [])

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
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const speechResult = event.results[0][0].transcript
        setTranscript(speechResult)
        handleSendMessage(speechResult)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Fetch and speak welcome message from Kai (voice only, no chat message)
    setTimeout(async () => {
      // Prevent duplicate greetings (React strict mode runs effects twice in dev)
      if (hasGreetedRef.current) return
      hasGreetedRef.current = true
      
      if (voiceEnabled) {
        try {
          const response = await fetch('/api/kai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello' })
          })
          const data = await response.json()
          if (data.response) {
            // Only speak, don't add to messages to avoid duplicate
            speakText(data.response)
          }
        } catch (error) {
          console.error('Error fetching welcome message:', error)
        }
      }
    }, 1500)  // Increased delay to ensure page is fully loaded
  }, [])

  // Function to speak text using ElevenLabs API with Web Speech fallback
  const speakText = async (text) => {
    if (!voiceEnabled) return

    // Stop any currently playing speech
    if (isSpeaking) {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      // Stop any playing audio elements
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    }

    try {
      setIsSpeaking(true)
      
      // Try ElevenLabs API first
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        // Get audio blob from response
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Create and play audio
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl) // Clean up
        }
        
        audio.onerror = () => {
          console.error('Error playing ElevenLabs audio, falling back to Web Speech')
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          // Fallback to Web Speech API
          speakWithBrowserVoice(text)
        }
        
        await audio.play()
        console.log('Playing ElevenLabs voice (Bella)')
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
  const speakWithBrowserVoice = (text) => {
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

  const handleSendMessage = async (text) => {
    const messageText = text || inputText
    if (!messageText.trim()) return

    // Add user message
    const userMessage = {
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setTranscript('')

    try {
      // Call intelligent AI backend
      const response = await fetch('/api/kai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: 'dashboard',
          context: {}
        })
      })

      if (response.ok) {
        const data = await response.json()
        
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
        
        // Speak the AI response with Alexandra voice
        if (voiceEnabled) {
          setTimeout(() => speakText(data.response), 300)
        }
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      console.error('Error details:', error.message, error.stack)
      
      // Fallback to friendly error message with error details for debugging
      const errorMessage = {
        type: 'ai',
        text: `Error: ${error.message || 'Unknown error'}. Please check console for details.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Removed generateAIResponse - now using intelligent AI backend

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <SimpleLayout>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        {/* Main Kai Interface - Center */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered dojo management at your fingertips</p>
          </div>

          {/* Kai Chat Interface */}
          <Card className="flex-1 flex flex-col border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden max-h-[500px] md:max-h-[600px] lg:max-h-none">
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
                    <CardTitle className="text-2xl">Kai</CardTitle>
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
              </div>
            </CardHeader>

            {/* Plasma Ball and Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
              {/* Plasma Ball Kai */}
              <div className="mb-4 md:mb-8 mt-2 md:mt-4">
                <PlasmaKai isSpeaking={isSpeaking} isListening={isListening} />
              </div>
              
              {/* Messages */}
              <div className="w-full max-w-2xl space-y-4">
                {messages.map((message, index) => (
                  <div key={index}>
                    <div
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
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
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Voice Button */}
                <Button
                  size="lg"
                  onClick={toggleListening}
                  className={`h-14 w-14 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>

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
    </SimpleLayout>
  )
}

