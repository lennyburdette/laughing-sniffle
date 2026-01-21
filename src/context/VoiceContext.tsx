import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export interface VoiceContextType {
  // Speech synthesis (voice output)
  synthesisAvailable: boolean
  isSpeaking: boolean
  speak: (text: string, options?: SpeakOptions) => void
  cancelSpeech: () => void
}

interface SpeakOptions {
  rate?: number   // 0.5 to 2.0, default 1.0
  pitch?: number  // 0.5 to 2.0, default 1.0
  volume?: number // 0 to 1.0, default 1.0
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  // Speech synthesis state
  const [synthesisAvailable, setSynthesisAvailable] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Refs for persistent objects
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Detect browser capabilities on mount
  useEffect(() => {
    // Check for SpeechSynthesis availability (works on all modern browsers)
    const hasSynthesis = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    setSynthesisAvailable(hasSynthesis)

    // Log capabilities for debugging (in development only)
    if (import.meta.env.DEV) {
      console.log('Voice capabilities:', {
        synthesis: hasSynthesis
      })
    }
  }, [])

  // Speak function for voice output
  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!synthesisAvailable) {
      console.warn('Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Apply options with defaults
    utterance.rate = options?.rate ?? 1.0
    utterance.pitch = options?.pitch ?? 1.0
    utterance.volume = options?.volume ?? 1.0
    utterance.lang = 'en-US'

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.warn('Error speaking:', error)
      setIsSpeaking(false)
    }
  }, [synthesisAvailable])

  // Cancel ongoing speech
  const cancelSpeech = useCallback(() => {
    if (synthesisAvailable) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      utteranceRef.current = null
    }
  }, [synthesisAvailable])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthesisAvailable) {
        window.speechSynthesis.cancel()
      }
    }
  }, [synthesisAvailable])

  return (
    <VoiceContext.Provider value={{
      synthesisAvailable,
      isSpeaking,
      speak,
      cancelSpeech
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}
