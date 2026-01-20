import { useState, useEffect, useRef, useCallback } from 'react'
import { useSound } from '../context/SoundContext'
import { useSettings } from '../context/SettingsContext'

interface ActivityTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  autoStart?: boolean
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed' | 'buffer'

function ActivityTimer({ duration, onComplete, autoStart = false }: ActivityTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(duration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [bufferSeconds, setBufferSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const { playTimerComplete, vibrate } = useSound()
  const { settings } = useSettings()

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (timerState === 'idle' || timerState === 'completed') {
      // If buffer time is set, start with buffer countdown
      if (settings.timerBufferTime > 0) {
        setBufferSeconds(settings.timerBufferTime)
        setTimerState('buffer')
      } else {
        setRemainingSeconds(duration)
        setTimerState('running')
      }
    }
  }, [timerState, duration, settings.timerBufferTime])

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

  // Buffer countdown logic
  useEffect(() => {
    if (timerState === 'buffer') {
      intervalRef.current = window.setInterval(() => {
        setBufferSeconds(prev => {
          if (prev <= 1) {
            clearTimerInterval()
            setRemainingSeconds(duration)
            setTimerState('running')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerState === 'buffer') {
        clearTimerInterval()
      }
    }
  }, [timerState, clearTimerInterval, duration])

  // Timer countdown logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearTimerInterval()
            setTimerState('completed')
            playTimerComplete()
            vibrate([100, 50, 100, 50, 100]) // Triple vibration pattern
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerState === 'running') {
        clearTimerInterval()
      }
    }
  }, [timerState, clearTimerInterval, playTimerComplete, vibrate, onComplete])

  // Reset when duration changes (new activity)
  useEffect(() => {
    setRemainingSeconds(duration)
    setTimerState('idle')
  }, [duration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval()
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
  const isBuffer = timerState === 'buffer'

  return (
    <div className={`activity-timer ${isCompleted ? 'completed' : ''}`}>
      {isBuffer ? (
        <div className="timer-countdown buffer">
          {bufferSeconds}
        </div>
      ) : (
        <div className={`timer-countdown ${isCompleted ? 'flash' : ''} ${isPaused ? 'paused' : ''}`}>
          {formatTime(remainingSeconds)}
        </div>
      )}

      <div className="timer-controls">
        {isBuffer && (
          <div className="buffer-message">Get ready...</div>
        )}

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
