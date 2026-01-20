import { useState, useEffect, useRef, useCallback } from 'react'

interface ActivityTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  autoStart?: boolean
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed'

function ActivityTimer({ duration, onComplete, autoStart = false }: ActivityTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(duration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const intervalRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playCompletionSound = useCallback(() => {
    // Create audio context for timer completion sound
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      // Create a pleasant completion beep sequence
      const playBeep = (time: number, frequency: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, time)
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

        oscillator.start(time)
        oscillator.stop(time + 0.3)
      }

      // Play 3 ascending beeps
      const now = audioContext.currentTime
      playBeep(now, 523.25)      // C5
      playBeep(now + 0.15, 659.25) // E5
      playBeep(now + 0.3, 783.99)  // G5
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }, [])

  const start = useCallback(() => {
    if (timerState === 'idle' || timerState === 'completed') {
      setRemainingSeconds(duration)
      setTimerState('running')
    }
  }, [timerState, duration])

  const pause = useCallback(() => {
    if (timerState === 'running') {
      clearTimerInterval()
      setTimerState('paused')
    }
  }, [timerState, clearTimerInterval])

  const resume = useCallback(() => {
    if (timerState === 'paused') {
      setTimerState('running')
    }
  }, [timerState])

  const reset = useCallback(() => {
    clearTimerInterval()
    setRemainingSeconds(duration)
    setTimerState('idle')
  }, [clearTimerInterval, duration])

  // Auto-start if prop is set
  useEffect(() => {
    if (autoStart && timerState === 'idle') {
      start()
    }
  }, [autoStart, timerState, start])

  // Timer countdown logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearTimerInterval()
            setTimerState('completed')
            playCompletionSound()
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      clearTimerInterval()
    }
  }, [timerState, clearTimerInterval, playCompletionSound, onComplete])

  // Reset when duration changes (new activity)
  useEffect(() => {
    setRemainingSeconds(duration)
    setTimerState('idle')
  }, [duration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [clearTimerInterval])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isCompleted = timerState === 'completed'
  const isRunning = timerState === 'running'
  const isPaused = timerState === 'paused'
  const isIdle = timerState === 'idle'

  return (
    <div className={`activity-timer ${isCompleted ? 'completed' : ''}`}>
      <div className={`timer-countdown ${isCompleted ? 'flash' : ''} ${isPaused ? 'paused' : ''}`}>
        {formatTime(remainingSeconds)}
      </div>

      <div className="timer-controls">
        {isIdle && (
          <button className="timer-btn start-btn" onClick={start}>
            START
          </button>
        )}

        {isRunning && (
          <button className="timer-btn pause-btn" onClick={pause}>
            PAUSE
          </button>
        )}

        {isPaused && (
          <>
            <button className="timer-btn resume-btn" onClick={resume}>
              RESUME
            </button>
            <button className="timer-btn reset-btn" onClick={reset}>
              RESET
            </button>
          </>
        )}

        {isCompleted && (
          <>
            <div className="completion-message">Complete!</div>
            <button className="timer-btn reset-btn" onClick={reset}>
              RESTART
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ActivityTimer
