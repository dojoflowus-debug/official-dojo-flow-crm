/**
 * KaiThinkingIndicator.tsx
 * 
 * Displays Kai's "thinking" process with animated status messages during long operations.
 * Similar to ChatGPT/Manus streaming thoughts — shows what Kai is doing in real-time.
 * 
 * Usage:
 * <KaiThinkingIndicator 
 *   isVisible={isLoading}
 *   status="Reading PDF..."
 *   messages={["Reading PDF...", "Extracting student data...", "Parsing records..."]}
 * />
 */

import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface KaiThinkingIndicatorProps {
  isVisible: boolean
  status?: string
  messages?: string[]
  isDark?: boolean
}

export const KaiThinkingIndicator: React.FC<KaiThinkingIndicatorProps> = ({
  isVisible,
  status = "Kai is thinking...",
  messages = [],
  isDark = true
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Rotate through messages every 1.5 seconds
  useEffect(() => {
    if (!isVisible || messages.length === 0) return

    const messageTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
      setDisplayedText('')
      setIsTyping(true)
    }, 1500)

    return () => clearInterval(messageTimer)
  }, [isVisible, messages])

  // Type out current message character by character
  useEffect(() => {
    if (!isVisible || !isTyping) return

    const currentMessage = messages[currentMessageIndex] || status
    if (displayedText.length < currentMessage.length) {
      const typeTimer = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1))
      }, 40) // 40ms per character for smooth typing

      return () => clearTimeout(typeTimer)
    } else {
      setIsTyping(false)
    }
  }, [displayedText, isTyping, isVisible, messages, currentMessageIndex, status])

  if (!isVisible) return null

  const currentMessage = messages[currentMessageIndex] || status
  const displayText = displayedText || currentMessage

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-3 ${
      isDark 
        ? 'bg-white/5 border border-white/10' 
        : 'bg-gray-100/80 border border-gray-200/60'
    }`}>
      {/* Animated Kai icon */}
      <div className="flex-shrink-0">
        <Sparkles 
          className={`w-5 h-5 animate-pulse ${
            isDark ? 'text-[#E53935]' : 'text-[#E53935]'
          }`}
        />
      </div>

      {/* Thinking text with cursor */}
      <div className={`flex-1 text-sm font-medium ${
        isDark 
          ? 'text-white/80' 
          : 'text-gray-700'
      }`}>
        <span>{displayText}</span>
        {isTyping && (
          <span className={`inline-block w-1.5 h-4 ml-1 ${
            isDark 
              ? 'bg-white/60' 
              : 'bg-gray-600'
          } animate-pulse`} />
        )}
      </div>

      {/* Animated dots */}
      <div className="flex gap-1 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              isDark 
                ? 'bg-white/40' 
                : 'bg-gray-400'
            }`}
            style={{
              animation: `pulse 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
