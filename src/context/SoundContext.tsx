import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useSettings } from './SettingsContext'

interface SoundContextType {
  isMuted: boolean
  toggleMute: () => void
  setMuted: (muted: boolean) => void
  playTimerComplete: () => void
  playSetComplete: () => void
  playClick: () => void
  vibrate: (pattern?: number | number[]) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: ReactNode }) {
  const { settings, updateSetting } = useSettings()

  // Derive muted state from settings
  const [isMuted, setIsMuted] = useState(!settings.soundEnabled)

  const audioContextRef = useRef<AudioContext | null>(null)

  // Get or create AudioContext (lazy initialization for mobile browser compatibility)
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

  // Play a beep at specified frequency and duration
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

  // Timer completion sound - 3 ascending beeps (C5, E5, G5)
  const playTimerComplete = useCallback(() => {
    if (isMuted) return

    const audioContext = getAudioContext()
    if (!audioContext) return

    try {
      const now = audioContext.currentTime
      playBeep(audioContext, now, 523.25, 0.3, 0.3)        // C5
      playBeep(audioContext, now + 0.15, 659.25, 0.3, 0.3) // E5
      playBeep(audioContext, now + 0.3, 783.99, 0.3, 0.3)  // G5
    } catch (error) {
      console.warn('Error playing timer complete sound:', error)
    }
  }, [isMuted, getAudioContext, playBeep])

  // Set/rep completion sound - same as timer complete for consistency
  const playSetComplete = useCallback(() => {
    if (isMuted) return

    const audioContext = getAudioContext()
    if (!audioContext) return

    try {
      const now = audioContext.currentTime
      playBeep(audioContext, now, 523.25, 0.3, 0.3)        // C5
      playBeep(audioContext, now + 0.15, 659.25, 0.3, 0.3) // E5
      playBeep(audioContext, now + 0.3, 783.99, 0.3, 0.3)  // G5
    } catch (error) {
      console.warn('Error playing set complete sound:', error)
    }
  }, [isMuted, getAudioContext, playBeep])

  // Click sound - short, subtle beep
  const playClick = useCallback(() => {
    if (isMuted) return

    const audioContext = getAudioContext()
    if (!audioContext) return

    try {
      const now = audioContext.currentTime
      playBeep(audioContext, now, 440, 0.1, 0.15) // A4, short duration, lower volume
    } catch (error) {
      console.warn('Error playing click sound:', error)
    }
  }, [isMuted, getAudioContext, playBeep])

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
