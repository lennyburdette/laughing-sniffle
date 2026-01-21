import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useVoice } from '../context/VoiceContext'
import type { SideType } from '../data/workoutTypes'

interface ActivityTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  autoStart?: boolean
  side?: SideType
  sideLabels?: string[]
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed' | 'buffer' | 'transitioning'

// Calculate duration splits for multi-sided timers
// E.g., 35s with 2 sides = [17, 18], 60s with 2 sides = [30, 30]
function calculateSideDurations(totalDuration: number, numSides: number): number[] {
  const baseDuration = Math.floor(totalDuration / numSides)
  const remainder = totalDuration % numSides

  return Array.from({ length: numSides }, (_, i) =>
    i < remainder ? baseDuration + 1 : baseDuration
  )
}

function ActivityTimer({ duration, onComplete, autoStart = false, side, sideLabels }: ActivityTimerProps) {
  // Determine if this is a multi-sided timer
  const isMultiSided = side === 'each' && sideLabels && sideLabels.length > 1
  const numSides = isMultiSided ? sideLabels!.length : 1

  // Memoize side durations to prevent recalculation on every render
  const sideDurations = useMemo(
    () => calculateSideDurations(duration, numSides),
    [duration, numSides]
  )

  const [currentSideIndex, setCurrentSideIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(sideDurations[0])
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [bufferSeconds, setBufferSeconds] = useState(0)
  const [transitionMessage, setTransitionMessage] = useState('')
  const intervalRef = useRef<number | null>(null)
  const transitionTimeoutRef = useRef<number | null>(null)
  const { settings } = useSettings()
  const { synthesisAvailable, speak } = useVoice()

  // Track whether we've said "five seconds left" for each side to avoid repeating
  const hasSaidFiveSecondsRef = useRef(false)
  // Track whether we've said "start" for the current side
  const hasSaidStartRef = useRef(false)

  // Voice assistance is available if voice counting is enabled and synthesis is available
  const voiceAssistanceEnabled = settings.voiceCountingEnabled && synthesisAvailable

  // Get voice options from settings
  const getVoiceOptions = useCallback(() => ({
    rate: settings.voiceRate,
    pitch: settings.voicePitch,
    volume: settings.voiceVolume
  }), [settings.voiceRate, settings.voicePitch, settings.voiceVolume])

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (timerState === 'idle' || timerState === 'completed') {
      // Reset to first side for multi-sided timers
      setCurrentSideIndex(0)
      // Reset voice tracking refs
      hasSaidFiveSecondsRef.current = false
      hasSaidStartRef.current = false
      // If buffer time is set, start with buffer countdown (only before first side)
      if (settings.timerBufferTime > 0) {
        setBufferSeconds(settings.timerBufferTime)
        setTimerState('buffer')
      } else {
        setRemainingSeconds(sideDurations[0])
        setTimerState('running')
        // Say "start" when timer begins (no buffer)
        if (voiceAssistanceEnabled) {
          speak('start', getVoiceOptions())
          hasSaidStartRef.current = true
        }
      }
    }
  }, [timerState, sideDurations, settings.timerBufferTime, voiceAssistanceEnabled, speak, getVoiceOptions])

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
    clearTransitionTimeout()
    setCurrentSideIndex(0)
    setRemainingSeconds(sideDurations[0])
    setTimerState('idle')
    setTransitionMessage('')
    // Reset voice tracking refs
    hasSaidFiveSecondsRef.current = false
    hasSaidStartRef.current = false
  }, [clearTimerInterval, clearTransitionTimeout, sideDurations])

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
            setRemainingSeconds(sideDurations[currentSideIndex])
            setTimerState('running')
            // Say "start" when buffer ends and timer actually begins
            if (voiceAssistanceEnabled && !hasSaidStartRef.current) {
              speak('start', getVoiceOptions())
              hasSaidStartRef.current = true
            }
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
  }, [timerState, clearTimerInterval, sideDurations, currentSideIndex, voiceAssistanceEnabled, speak, getVoiceOptions])

  // Timer countdown logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds(prev => {
          // Voice announcement for "five seconds left" (only for timers > 10 seconds)
          // Check the current side's duration, announce at 5 seconds remaining
          const currentSideDuration = sideDurations[currentSideIndex]
          if (voiceAssistanceEnabled && currentSideDuration > 10 && prev === 6 && !hasSaidFiveSecondsRef.current) {
            // We're about to tick from 6 to 5, so at next second it will be 5
            speak('five seconds left', getVoiceOptions())
            hasSaidFiveSecondsRef.current = true
          }

          if (prev <= 1) {
            clearTimerInterval()

            // Check if there are more sides to complete
            if (isMultiSided && currentSideIndex < numSides - 1) {
              // Transition to next side
              const nextSideIndex = currentSideIndex + 1
              const nextSideLabel = sideLabels![nextSideIndex]

              // Say "switch sides" for multi-sided activities
              if (voiceAssistanceEnabled) {
                speak('switch sides', getVoiceOptions())
              }

              // Show transition message
              setTransitionMessage(`Switching to ${nextSideLabel}...`)
              setTimerState('transitioning')

              // Reset the "five seconds left" tracker for next side
              hasSaidFiveSecondsRef.current = false
              // Reset start tracker for next side
              hasSaidStartRef.current = false

              // Check if we should have a buffer countdown between sides
              if (settings.timerBufferTime > 0) {
                // After brief transition, start buffer countdown for next side
                transitionTimeoutRef.current = window.setTimeout(() => {
                  setCurrentSideIndex(nextSideIndex)
                  setBufferSeconds(settings.timerBufferTime)
                  setTransitionMessage('')
                  setTimerState('buffer')
                }, 1500)
              } else {
                // After 1.5 seconds, start next side directly
                transitionTimeoutRef.current = window.setTimeout(() => {
                  setCurrentSideIndex(nextSideIndex)
                  setRemainingSeconds(sideDurations[nextSideIndex])
                  setTransitionMessage('')
                  setTimerState('running')
                  // Say "start" for the new side
                  if (voiceAssistanceEnabled) {
                    speak('start', getVoiceOptions())
                    hasSaidStartRef.current = true
                  }
                }, 1500)
              }

              return 0
            } else {
              // All sides completed - say "done"
              if (voiceAssistanceEnabled) {
                speak('done', getVoiceOptions())
              }
              setTimerState('completed')
              onComplete?.()
              return 0
            }
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
  }, [timerState, clearTimerInterval, onComplete, isMultiSided, currentSideIndex, numSides, sideLabels, sideDurations, voiceAssistanceEnabled, speak, getVoiceOptions, settings.timerBufferTime])

  // Reset when duration or side config changes (new activity)
  useEffect(() => {
    clearTransitionTimeout()
    setCurrentSideIndex(0)
    setRemainingSeconds(sideDurations[0])
    setTimerState('idle')
    setTransitionMessage('')
    // Reset voice tracking refs
    hasSaidFiveSecondsRef.current = false
    hasSaidStartRef.current = false
  }, [duration, side, clearTransitionTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval()
      clearTransitionTimeout()
    }
  }, [clearTimerInterval, clearTransitionTimeout])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate overall progress for multi-sided timers (used for progress bar)
  const calculateOverallProgress = (): number => {
    if (!isMultiSided) {
      return ((sideDurations[0] - remainingSeconds) / sideDurations[0]) * 100
    }

    // Calculate total elapsed time across all sides
    let elapsedTime = 0
    for (let i = 0; i < currentSideIndex; i++) {
      elapsedTime += sideDurations[i]
    }
    // Add elapsed time on current side
    elapsedTime += sideDurations[currentSideIndex] - remainingSeconds

    return (elapsedTime / duration) * 100
  }

  const isCompleted = timerState === 'completed'
  const isRunning = timerState === 'running'
  const isPaused = timerState === 'paused'
  const isIdle = timerState === 'idle'
  const isBuffer = timerState === 'buffer'
  const isTransitioning = timerState === 'transitioning'

  // Get current side label
  const currentSideLabel = isMultiSided ? sideLabels![currentSideIndex] : null

  return (
    <div className={`activity-timer ${isCompleted ? 'completed' : ''}`}>
      {/* Side indicator for multi-sided timers */}
      {isMultiSided && !isIdle && !isBuffer && (
        <div className="side-indicator">
          <span className="side-label">{currentSideLabel}</span>
          <span className="side-progress">Side {currentSideIndex + 1} of {numSides}</span>
        </div>
      )}

      {isBuffer ? (
        <div className="timer-countdown buffer">
          {bufferSeconds}
        </div>
      ) : isTransitioning ? (
        <div className="timer-countdown transitioning">
          ⏳
        </div>
      ) : (
        <div className={`timer-countdown ${isCompleted ? 'flash' : ''} ${isPaused ? 'paused' : ''}`}>
          {formatTime(remainingSeconds)}
        </div>
      )}

      {/* Progress bar for multi-sided timers */}
      {isMultiSided && !isIdle && !isBuffer && (
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${calculateOverallProgress()}%` }}
          />
        </div>
      )}

      <div className="timer-controls">
        {isBuffer && (
          <div className="buffer-message">Get ready...</div>
        )}

        {isTransitioning && (
          <div className="transition-message">{transitionMessage}</div>
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
