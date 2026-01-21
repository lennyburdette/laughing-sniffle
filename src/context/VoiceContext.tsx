import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// TypeScript declarations for Web Speech API with webkit prefixes
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

// Extend Window for webkit prefixes
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface VoiceContextType {
  // Speech synthesis (voice output)
  synthesisAvailable: boolean
  isSpeaking: boolean
  speak: (text: string, options?: SpeakOptions) => void
  cancelSpeech: () => void

  // Speech recognition (voice commands) - Chrome/Edge only, not iOS Safari
  recognitionAvailable: boolean
  isListening: boolean
  startListening: (onCommand: (command: string) => void) => void
  stopListening: () => void
  recognitionError: string | null
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

  // Speech recognition state
  const [recognitionAvailable, setRecognitionAvailable] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)

  // Refs for persistent objects
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const commandCallbackRef = useRef<((command: string) => void) | null>(null)
  const shouldRestartRef = useRef(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Detect browser capabilities on mount
  useEffect(() => {
    // Check for SpeechSynthesis availability (works on all modern browsers)
    const hasSynthesis = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    setSynthesisAvailable(hasSynthesis)

    // Check for SpeechRecognition availability (Chrome/Edge only, NOT iOS Safari)
    // iOS Safari doesn't support SpeechRecognition even though window.SpeechRecognition might exist
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    const hasRecognition = !!SpeechRecognitionAPI

    // Additional check: iOS Safari reports SpeechRecognition but it doesn't actually work
    // We detect iOS Safari by checking for webkit prefix AND iOS user agent
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                        !('MSStream' in window) &&
                        /Safari/.test(navigator.userAgent)

    setRecognitionAvailable(hasRecognition && !isIOSSafari)

    // Log capabilities for debugging (in development only)
    if (import.meta.env.DEV) {
      console.log('Voice capabilities:', {
        synthesis: hasSynthesis,
        recognition: hasRecognition,
        isIOSSafari,
        recognitionUsable: hasRecognition && !isIOSSafari
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

  // Start voice recognition
  const startListening = useCallback((onCommand: (command: string) => void) => {
    if (!recognitionAvailable) {
      setRecognitionError('Voice recognition not supported on this browser')
      return
    }

    // Store the callback
    commandCallbackRef.current = onCommand
    setRecognitionError(null)

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setRecognitionError('Voice recognition not available')
      return
    }

    // Create new recognition instance if needed
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionAPI()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.maxAlternatives = 1

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex]
        if (result && result.isFinal) {
          // Command normalization: lowercase and trim
          const command = result[0].transcript.toLowerCase().trim()

          if (commandCallbackRef.current) {
            commandCallbackRef.current(command)
          }
        }
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = getRecognitionErrorMessage(event.error)

        // Don't set error for "no-speech" or "aborted" as these are normal
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setRecognitionError(errorMessage)
          console.warn('Speech recognition error:', event.error, event.message)
        }

        // Auto-restart on recoverable errors if we should still be listening
        if (shouldRestartRef.current && isRecoverableError(event.error)) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch {
                // Ignore start errors on restart
              }
            }
          }, 1000)
        }
      }

      recognitionRef.current.onend = () => {
        // Auto-restart if we should still be listening
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch {
                // Ignore start errors on restart
              }
            }
          }, 100)
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setRecognitionError(null)
      }
    }

    // Start recognition
    shouldRestartRef.current = true
    try {
      recognitionRef.current.start()
    } catch (error) {
      // If already started, that's okay
      if (error instanceof Error && !error.message.includes('already started')) {
        setRecognitionError('Failed to start voice recognition')
        console.warn('Error starting recognition:', error)
      }
    }
  }, [recognitionAvailable])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    commandCallbackRef.current = null

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore stop errors
      }
    }

    setIsListening(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors
        }
        recognitionRef.current = null
      }

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
      cancelSpeech,
      recognitionAvailable,
      isListening,
      startListening,
      stopListening,
      recognitionError
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

// Helper function to get user-friendly error messages
function getRecognitionErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone permission denied. Please allow microphone access to use voice commands.'
    case 'no-speech':
      return 'No speech detected. Please speak clearly.'
    case 'audio-capture':
      return 'No microphone found. Please connect a microphone.'
    case 'network':
      return 'Network error. Please check your internet connection.'
    case 'aborted':
      return 'Voice recognition was stopped.'
    case 'language-not-supported':
      return 'Language not supported.'
    case 'service-not-allowed':
      return 'Voice recognition service not allowed.'
    default:
      return `Voice recognition error: ${error}`
  }
}

// Helper function to determine if an error is recoverable
function isRecoverableError(error: string): boolean {
  // These errors may be temporary and worth retrying
  return ['no-speech', 'network'].includes(error)
}
