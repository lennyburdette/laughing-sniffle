import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useSettings } from './SettingsContext'

// Import sound files
import timerCompleteSound from '../assets/sounds/timer-complete.wav'
import sideTransitionSound from '../assets/sounds/side-transition.wav'
import setCompleteSound from '../assets/sounds/set-complete.wav'
import clickSound from '../assets/sounds/click.wav'

interface SoundContextType {
  isMuted: boolean
  toggleMute: () => void
  setMuted: (muted: boolean) => void
  playTimerComplete: () => void
  playSideTransition: () => void
  playSetComplete: () => void
  playClick: () => void
  vibrate: (pattern?: number | number[]) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

// Sound file URLs mapping
const SOUND_FILES = {
  timerComplete: timerCompleteSound,
  sideTransition: sideTransitionSound,
  setComplete: setCompleteSound,
  click: clickSound
} as const

export function SoundProvider({ children }: { children: ReactNode }) {
  const { settings, updateSetting } = useSettings()

  // Derive muted state from settings
  const [isMuted, setIsMuted] = useState(!settings.soundEnabled)

  // HTML5 Audio elements for iOS compatibility
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const audioLoadedRef = useRef<Map<string, boolean>>(new Map())

  // Web Audio API fallback
  const audioContextRef = useRef<AudioContext | null>(null)
  const useFallbackRef = useRef(false)

  // Preload audio files on mount
  useEffect(() => {
    const loadAudio = async () => {
      const entries = Object.entries(SOUND_FILES)

      for (const [key, src] of entries) {
        try {
          const audio = new Audio()

          // iOS requires these settings to bypass silent mode
          // webkit-playsinline helps iOS treat this as UI sound
          audio.setAttribute('playsinline', 'true')
          audio.setAttribute('webkit-playsinline', 'true')

          audio.preload = 'auto'
          audio.src = src

          // Wait for audio to be loadable
          await new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => {
              audioLoadedRef.current.set(key, true)
              resolve()
            }
            audio.onerror = () => {
              console.warn(`Failed to load audio: ${key}`)
              audioLoadedRef.current.set(key, false)
              reject(new Error(`Failed to load ${key}`))
            }
            audio.load()

            // Timeout fallback
            setTimeout(() => {
              if (!audioLoadedRef.current.has(key)) {
                audioLoadedRef.current.set(key, false)
                reject(new Error(`Timeout loading ${key}`))
              }
            }, 5000)
          })

          audioElementsRef.current.set(key, audio)
        } catch (error) {
          console.warn(`Error setting up audio ${key}:`, error)
          useFallbackRef.current = true
        }
      }

      // If any audio failed to load, enable fallback
      const allLoaded = Array.from(audioLoadedRef.current.values()).every(v => v)
      if (!allLoaded) {
        useFallbackRef.current = true
        console.log('Some audio files failed to load, using Web Audio API fallback')
      }
    }

    loadAudio()

    // Cleanup
    return () => {
      audioElementsRef.current.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioElementsRef.current.clear()
    }
  }, [])

  // Get or create AudioContext for fallback (lazy initialization for mobile browser compatibility)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch (error) {
        console.warn('AudioContext not supported:', error)
        return null
      }
    }
    // Resume if suspended (needed for mobile browsers after user interaction)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  // Sync muted state with settings
  useEffect(() => {
    setIsMuted(!settings.soundEnabled)
  }, [settings.soundEnabled])

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    updateSetting('soundEnabled', !newMuted)
  }, [isMuted, updateSetting])

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    updateSetting('soundEnabled', !muted)
  }, [updateSetting])

  // Vibration function
  const vibrate = useCallback((pattern: number | number[] = 200) => {
    if (!settings.vibrationEnabled) return

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch {
      // Vibration not supported or failed
    }
  }, [settings.vibrationEnabled])

  // Play a beep at specified frequency and duration (Web Audio API fallback)
  const playBeep = useCallback((audioContext: AudioContext, time: number, frequency: number, duration: number = 0.3, volume: number = 0.3) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, time)
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration)

    oscillator.start(time)
    oscillator.stop(time + duration)
  }, [])

  // Play HTML5 audio with fallback to Web Audio API
  const playSound = useCallback((soundKey: keyof typeof SOUND_FILES, fallbackFn: () => void) => {
    if (isMuted) return

    const audio = audioElementsRef.current.get(soundKey)
    const isLoaded = audioLoadedRef.current.get(soundKey)

    if (audio && isLoaded && !useFallbackRef.current) {
      try {
        // Clone the audio to allow overlapping sounds
        const audioClone = audio.cloneNode() as HTMLAudioElement
        audioClone.volume = 1.0

        // Play and handle potential errors
        const playPromise = audioClone.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`HTML5 audio play failed for ${soundKey}, using fallback:`, error)
            fallbackFn()
          })
        }
      } catch (error) {
        console.warn(`Error playing ${soundKey}, using fallback:`, error)
        fallbackFn()
      }
    } else {
      // Use Web Audio API fallback
      fallbackFn()
    }
  }, [isMuted])

  // Timer completion sound - 3 ascending beeps (C5, E5, G5)
  const playTimerComplete = useCallback(() => {
    const fallback = () => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const now = audioContext.currentTime
        playBeep(audioContext, now, 523.25, 0.15, 0.5)        // C5
        playBeep(audioContext, now + 0.2, 659.25, 0.15, 0.5) // E5
        playBeep(audioContext, now + 0.4, 783.99, 0.15, 0.5)  // G5
      } catch (error) {
        console.warn('Error playing timer complete sound:', error)
      }
    }

    playSound('timerComplete', fallback)
  }, [playSound, getAudioContext, playBeep])

  // Side transition sound - 2 beeps (C5, G5)
  const playSideTransition = useCallback(() => {
    const fallback = () => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const now = audioContext.currentTime
        playBeep(audioContext, now, 523.25, 0.12, 0.4)        // C5
        playBeep(audioContext, now + 0.2, 783.99, 0.12, 0.4)  // G5
      } catch (error) {
        console.warn('Error playing side transition sound:', error)
      }
    }

    playSound('sideTransition', fallback)
  }, [playSound, getAudioContext, playBeep])

  // Set/rep completion sound - same as timer complete for consistency
  const playSetComplete = useCallback(() => {
    const fallback = () => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const now = audioContext.currentTime
        playBeep(audioContext, now, 523.25, 0.15, 0.5)        // C5
        playBeep(audioContext, now + 0.2, 659.25, 0.15, 0.5) // E5
        playBeep(audioContext, now + 0.4, 783.99, 0.15, 0.5)  // G5
      } catch (error) {
        console.warn('Error playing set complete sound:', error)
      }
    }

    playSound('setComplete', fallback)
  }, [playSound, getAudioContext, playBeep])

  // Click sound - short, subtle beep
  const playClick = useCallback(() => {
    const fallback = () => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const now = audioContext.currentTime
        playBeep(audioContext, now, 440, 0.08, 0.3) // A4, short duration, lower volume
      } catch (error) {
        console.warn('Error playing click sound:', error)
      }
    }

    playSound('click', fallback)
  }, [playSound, getAudioContext, playBeep])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return (
    <SoundContext.Provider value={{
      isMuted,
      toggleMute,
      setMuted,
      playTimerComplete,
      playSideTransition,
      playSetComplete,
      playClick,
      vibrate
    }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}
