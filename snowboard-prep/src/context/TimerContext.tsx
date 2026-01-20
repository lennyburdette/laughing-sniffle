import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'

interface TimerContextType {
  elapsedSeconds: number
  isRunning: boolean
  isPaused: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  formatTime: (seconds: number) => string
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
      setIsPaused(false)
      setElapsedSeconds(0)
    }
  }, [isRunning])

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true)
      clearTimerInterval()
    }
  }, [isRunning, isPaused, clearTimerInterval])

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false)
    }
  }, [isRunning, isPaused])

  const reset = useCallback(() => {
    clearTimerInterval()
    setElapsedSeconds(0)
    setIsRunning(false)
    setIsPaused(false)
  }, [clearTimerInterval])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }

    return () => {
      clearTimerInterval()
    }
  }, [isRunning, isPaused, clearTimerInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval()
    }
  }, [clearTimerInterval])

  const value: TimerContextType = {
    elapsedSeconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formatTime
  }

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
