import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import kaiDataService from '../services/kaiDataService'

export default function KaiAssistant({ onCommand }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Kai, your AI assistant for Dojo Flow. I can help you navigate, find information, and manage your dojo. Try asking me things like 'Show me active leads' or 'What's our revenue this month?'",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const scrollRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Function to speak text using Web Speech API
  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.')
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

  const processCommand = async (userMessage) => {
    setIsProcessing(true)
    
    // Add user message
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    try {
      // FIRST: Try to process command locally with real database data
      console.log('[Kai] Processing message:', userMessage)
      const localResponse = await processCommandLocally(userMessage)
      
      if (localResponse && localResponse.message) {
        console.log('[Kai] Local processing successful:', localResponse)
        const assistantMsg = {
          role: 'assistant',
          content: localResponse.message,
          timestamp: new Date(),
          executed: localResponse.executed
        }
        setMessages(prev => [...prev, assistantMsg])
        
        // Speak the response
        speak(localResponse.message)
        
        if (localResponse.command && onCommand) {
          onCommand(localResponse.command)
        }
        
        setIsProcessing(false)
        return // Exit early if local processing succeeded
      }
      
      console.log('[Kai] Local processing returned nothing, falling back to OpenAI')
      // FALLBACK: Call OpenAI API for command processing
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are Kai, an AI assistant for Dojo Flow martial arts school management CRM. You help users navigate the dashboard, retrieve information, and perform actions. 
              
Available commands:
- Navigate: "dashboard", "students", "leads", "classes", "attendance", "billing", "reports"
- Data queries: "total students", "active leads", "monthly revenue", "attendance rate"
- Filters: "overdue payments", "hot leads", "black belts", "active students"
- Actions: "add student", "add lead", "schedule class"

When a user asks a question, determine the intent and respond with:
1. A friendly acknowledgment
2. The action you'll take
3. Use function calling to execute the command

Be conversational, encouraging, and use martial arts terminology when appropriate.`
            },
            ...messages.slice(-5), // Last 5 messages for context
            { role: 'user', content: userMessage }
          ],
          functions: [
            {
              name: 'navigate',
              description: 'Navigate to a different page in the dashboard',
              parameters: {
                type: 'object',
                properties: {
                  page: {
                    type: 'string',
                    enum: ['dashboard', 'students', 'leads', 'classes', 'attendance', 'billing', 'reports'],
                    description: 'The page to navigate to'
                  },
                  filter: {
                    type: 'string',
                    description: 'Optional filter to apply (e.g., "overdue", "active", "hot")'
                  }
                },
                required: ['page']
              }
            },
            {
              name: 'get_stats',
              description: 'Get statistics and metrics',
              parameters: {
                type: 'object',
                properties: {
                  metric: {
                    type: 'string',
                    enum: ['students', 'leads', 'revenue', 'attendance'],
                    description: 'The metric to retrieve'
                  }
                },
                required: ['metric']
              }
            }
          ],
          function_call: 'auto',
          temperature: 0.7,
          max_tokens: 200
        })
      })

      const data = await response.json()
      
      if (data.choices && data.choices[0]) {
        const choice = data.choices[0]
        let assistantResponse = ''
        let commandExecuted = false

        // Check if function was called
        if (choice.message.function_call) {
          const functionName = choice.message.function_call.name
          const functionArgs = JSON.parse(choice.message.function_call.arguments)
          
          // Execute the command
          if (onCommand) {
            onCommand({ function: functionName, args: functionArgs })
            commandExecuted = true
          }

          // Generate response based on function
          if (functionName === 'navigate') {
            assistantResponse = `Navigating to ${functionArgs.page}${functionArgs.filter ? ` with ${functionArgs.filter} filter` : ''}...`
          } else if (functionName === 'get_stats') {
            assistantResponse = `Retrieving ${functionArgs.metric} statistics...`
          }
        } else {
          assistantResponse = choice.message.content
        }

        // Add assistant response
        const assistantMsg = {
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
          executed: commandExecuted
        }
        setMessages(prev => [...prev, assistantMsg])
        
        // Speak the response
        speak(assistantResponse)
      }
    } catch (error) {
      console.error('Error processing command:', error)
      
      // Fallback to local processing
      const response = await processCommandLocally(userMessage)
      const assistantMsg = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        executed: response.executed
      }
      setMessages(prev => [...prev, assistantMsg])
      
      // Speak the response
      speak(response.message)
      
      if (response.command && onCommand) {
        onCommand(response.command)
      }
    }

    setIsProcessing(false)
  }

  const processCommandLocally = async (message) => {
    const lowerMsg = message.toLowerCase()
    
    // Navigation commands
    if (lowerMsg.includes('show') && lowerMsg.includes('lead')) {
      return {
        message: "Opening the leads pipeline for you!",
        command: { function: 'navigate', args: { page: 'leads' } },
        executed: true
      }
    }
    if (lowerMsg.includes('student') && !lowerMsg.includes('how many') && !lowerMsg.includes('total')) {
      return {
        message: "Taking you to the students page!",
        command: { function: 'navigate', args: { page: 'students' } },
        executed: true
      }
    }
    if (lowerMsg.includes('class')) {
      return {
        message: "Showing you the classes schedule!",
        command: { function: 'navigate', args: { page: 'classes' } },
        executed: true
      }
    }
    if (lowerMsg.includes('report')) {
      return {
        message: "Opening the reports section!",
        command: { function: 'navigate', args: { page: 'reports' } },
        executed: true
      }
    }
    if (lowerMsg.includes('billing') || lowerMsg.includes('payment')) {
      return {
        message: "Navigating to billing!",
        command: { function: 'navigate', args: { page: 'billing' } },
        executed: true
      }
    }
    if (lowerMsg.includes('attendance')) {
      return {
        message: "Opening attendance tracking!",
        command: { function: 'navigate', args: { page: 'attendance' } },
        executed: true
      }
    }
    if (lowerMsg.includes('dashboard') || lowerMsg.includes('home')) {
      return {
        message: "Taking you back to the dashboard!",
        command: { function: 'navigate', args: { page: 'dashboard' } },
        executed: true
      }
    }

    // Stats queries - NOW WITH REAL DATA!
    if (lowerMsg.includes('how many student') || lowerMsg.includes('total student')) {
      console.log('[Kai] Student query detected, calling kaiDataService.getStudents()')
      const result = await kaiDataService.getStudents()
      console.log('[Kai] getStudents result:', result)
      if (result.success) {
        const activeCount = result.data.filter(s => s.status === 'Active').length
        return {
          message: `You currently have ${result.count} students enrolled${activeCount > 0 ? `, with ${activeCount} active students` : ''}. ${result.count > 0 ? 'Keep up the great work!' : 'Ready to add your first students?'}`,
          executed: false
        }
      }
      return {
        message: "I'm having trouble accessing student data right now. Please try again.",
        executed: false
      }
    }
    
    if (lowerMsg.includes('revenue') || lowerMsg.includes('income') || lowerMsg.includes('earning')) {
      const stats = await kaiDataService.getDashboardStats()
      if (stats.success) {
        const revenue = stats.data.monthlyRevenue || 0
        return {
          message: `Your monthly revenue is $${revenue.toLocaleString()}${revenue > 0 ? '. Great job!' : '. Time to grow your dojo!'}`,
          executed: false
        }
      }
      return {
        message: "I'm having trouble calculating revenue right now. Please try again.",
        executed: false
      }
    }
    
    if (lowerMsg.includes('lead') && !lowerMsg.includes('show')) {
      const result = await kaiDataService.getLeads()
      if (result.success) {
        const hotLeads = result.data.filter(l => l.status === 'Hot').length
        return {
          message: `You have ${result.count} leads in your pipeline${hotLeads > 0 ? `, including ${hotLeads} hot leads` : ''}!`,
          executed: false
        }
      }
      return {
        message: "I'm having trouble accessing leads data right now. Please try again.",
        executed: false
      }
    }
    
    if (lowerMsg.includes('class') && (lowerMsg.includes('how many') || lowerMsg.includes('total'))) {
      const result = await kaiDataService.getClasses()
      if (result.success) {
        return {
          message: `You have ${result.count} classes scheduled. ${result.count > 0 ? 'Your students are training hard!' : 'Ready to schedule your first class?'}`,
          executed: false
        }
      }
      return {
        message: "I'm having trouble accessing class data right now. Please try again.",
        executed: false
      }
    }
    
    if (lowerMsg.includes('stats') || lowerMsg.includes('overview') || lowerMsg.includes('summary')) {
      const stats = await kaiDataService.getDashboardStats()
      if (stats.success) {
        const d = stats.data
        return {
          message: `Here's your dojo overview: ${d.totalStudents} students (${d.activeStudents} active), ${d.totalLeads} leads, ${d.totalClasses} classes, and $${d.monthlyRevenue.toLocaleString()} monthly revenue. ${d.overduePayments > 0 ? `Note: ${d.overduePayments} students have overdue payments.` : 'All payments are up to date!'}`,
          executed: false
        }
      }
      return {
        message: "I'm having trouble gathering stats right now. Please try again.",
        executed: false
      }
    }

    // Default response
    return {
      message: "I'm here to help! Try asking me about your students, leads, revenue, or navigate to different sections of the dashboard.",
      executed: false
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isProcessing) {
      processCommand(input.trim())
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 transition-all duration-300 hover:scale-110 z-50"
          size="icon"
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Kai</h3>
                <p className="text-xs text-muted-foreground">AI Assistant</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-orange-500 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.executed && (
                      <p className="text-xs mt-1 opacity-70">✓ Executed</p>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Kai anything..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                type="button"
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button type="submit" size="icon" disabled={!input.trim() || isProcessing}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {isListening ? "Listening... Speak now" : "Type or click the mic to speak"}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

