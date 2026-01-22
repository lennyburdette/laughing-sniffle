import { useState, useCallback, useEffect, useRef } from 'react'
import { useVoice } from '../context/VoiceContext'
import { useSettings } from '../context/SettingsContext'
import PaceSetter from './PaceSetter'

interface RepCounterProps {
  activityId: string
  targetCount: number
  side?: 'each' | null
  sideLabels?: string[]
  onComplete?: () => void
  isPaused?: boolean
}

type RepState = 'counting' | 'completed'

function RepCounter({ activityId, targetCount, side, sideLabels, onComplete, isPaused = false }: RepCounterProps) {
  const [currentRep, setCurrentRep] = useState(1)
  const [currentSideIndex, setCurrentSideIndex] = useState(0)
  const [repState, setRepState] = useState<RepState>('counting')
  const [voiceCountingActive, setVoiceCountingActive] = useState(false)
  const [showPaceSetter, setShowPaceSetter] = useState(false)
  const { synthesisAvailable, speak, cancelSpeech } = useVoice()
  const { settings, getActivityPace, setActivityPace } = useSettings()

  // Refs for voice counting interval
  const voiceIntervalRef = useRef<number | null>(null)
  const andIntervalRef = useRef<number | null>(null) // For "and" at half-pace for slow counts
  const currentRepRef = useRef(currentRep)
  const currentSideIndexRef = useRef(currentSideIndex)
  const isCompletedRef = useRef(false)
  const hasSpokenStartRef = useRef(false) // Track if we've said "start"

  // Determine the sides to track
  const sides = side === 'each' && sideLabels ? sideLabels : [null]
  const totalSides = sides.length
  const isLastSide = currentSideIndex === totalSides - 1
  const isLastRep = currentRep === targetCount
  const currentSideLabel = sides[currentSideIndex]

  // Keep refs in sync with state
  useEffect(() => {
    currentRepRef.current = currentRep
  }, [currentRep])

  useEffect(() => {
    currentSideIndexRef.current = currentSideIndex
  }, [currentSideIndex])

  useEffect(() => {
    isCompletedRef.current = repState === 'completed'
  }, [repState])

  // Check if voice counting should be available
  const voiceCountingAvailable = synthesisAvailable && settings.voiceCountingEnabled

  // Pace control constants
  const MIN_PACE = 1.0
  const MAX_PACE = 5.0
  const PACE_INCREMENT = 0.2

  // Get current pace for this activity
  const currentPace = getActivityPace(activityId)

  // Handle pace increment/decrement
  const incrementPace = useCallback(() => {
    const newPace = Math.min(MAX_PACE, Math.round((currentPace + PACE_INCREMENT) * 10) / 10)
    setActivityPace(activityId, newPace)
  }, [currentPace, activityId, setActivityPace])

  const decrementPace = useCallback(() => {
    const newPace = Math.max(MIN_PACE, Math.round((currentPace - PACE_INCREMENT) * 10) / 10)
    setActivityPace(activityId, newPace)
  }, [currentPace, activityId, setActivityPace])

  // Stop voice counting
  const stopVoiceCounting = useCallback(() => {
    if (voiceIntervalRef.current !== null) {
      clearInterval(voiceIntervalRef.current)
      voiceIntervalRef.current = null
    }
    if (andIntervalRef.current !== null) {
      clearTimeout(andIntervalRef.current)
      andIntervalRef.current = null
    }
    setVoiceCountingActive(false)
    cancelSpeech()
  }, [cancelSpeech])

  // Get voice options
  const getVoiceOptions = useCallback(() => ({
    rate: settings.voiceRate,
    pitch: settings.voicePitch,
    volume: settings.voiceVolume
  }), [settings.voiceRate, settings.voicePitch, settings.voiceVolume])

  // Voice counting tick function - advances rep and speaks
  const voiceCountTick = useCallback(() => {
    // Don't advance if completed
    if (isCompletedRef.current) {
      stopVoiceCounting()
      return
    }

    const rep = currentRepRef.current
    const sideIdx = currentSideIndexRef.current
    const isLastRepNow = rep === targetCount
    const isLastSideNow = sideIdx === totalSides - 1
    // Penultimate rep: for 10 reps, this is rep 9. For 2 reps, this is rep 1. For 1 rep, there's no penultimate.
    const isPenultimateRep = targetCount > 1 && rep === targetCount - 1

    // Determine what to speak
    let textToSpeak: string
    if (isPenultimateRep) {
      // Say "last one" instead of the penultimate number
      textToSpeak = 'last one'
    } else {
      textToSpeak = String(rep)
    }

    // Speak the rep count (or "last one")
    speak(textToSpeak, getVoiceOptions())

    // Advance the rep
    if (isLastRepNow && isLastSideNow) {
      // All reps and sides complete
      setRepState('completed')
      stopVoiceCounting()
      // Say "next activity" before advancing (with delay to let the last count speak)
      setTimeout(() => {
        speak('next activity', getVoiceOptions())
      }, 600)
      setTimeout(() => {
        onComplete?.()
      }, 1500)
    } else if (isLastRepNow && !isLastSideNow) {
      // Move to next side - say "switch sides" after a brief delay
      setTimeout(() => {
        speak('switch sides', getVoiceOptions())
      }, 500)
      setCurrentSideIndex(prev => prev + 1)
      setCurrentRep(1)
    } else {
      // Just advance the rep
      setCurrentRep(prev => prev + 1)
    }
  }, [targetCount, totalSides, speak, getVoiceOptions, onComplete, stopVoiceCounting])

  // Schedule "and" at half-pace mark for slow counts (pace > 2 seconds)
  const scheduleAndSpeech = useCallback((pace: number) => {
    if (pace > 2 && !isCompletedRef.current) {
      // Clear any existing "and" timeout
      if (andIntervalRef.current !== null) {
        clearTimeout(andIntervalRef.current)
      }
      // Schedule "and" at half the pace interval
      const halfPaceMs = (pace * 1000) / 2
      andIntervalRef.current = window.setTimeout(() => {
        if (!isCompletedRef.current && voiceIntervalRef.current !== null) {
          speak('and', getVoiceOptions())
        }
      }, halfPaceMs)
    }
  }, [speak, getVoiceOptions])

  // Start voice counting
  const startVoiceCounting = useCallback(() => {
    if (!voiceCountingAvailable || repState === 'completed') {
      return
    }

    // Clear any existing intervals
    if (voiceIntervalRef.current !== null) {
      clearInterval(voiceIntervalRef.current)
    }
    if (andIntervalRef.current !== null) {
      clearTimeout(andIntervalRef.current)
    }

    setVoiceCountingActive(true)
    hasSpokenStartRef.current = true

    // Say "start" first
    speak('start', getVoiceOptions())

    // Get the pace for this activity
    const pace = getActivityPace(activityId)
    const intervalMs = pace * 1000

    // Wait a bit for "start" to be spoken, then start counting
    setTimeout(() => {
      if (isCompletedRef.current) return

      // Do first count
      voiceCountTick()

      // Schedule "and" for slow paces
      scheduleAndSpeech(pace)

      // Set up interval for subsequent counts
      voiceIntervalRef.current = window.setInterval(() => {
        voiceCountTick()
        // Schedule "and" after each count for slow paces
        scheduleAndSpeech(pace)
      }, intervalMs)
    }, 600) // Delay to let "start" be spoken
  }, [voiceCountingAvailable, repState, voiceCountTick, getActivityPace, activityId, speak, getVoiceOptions, scheduleAndSpeech])

  // Toggle voice counting
  const toggleVoiceCounting = useCallback(() => {
    if (voiceCountingActive) {
      stopVoiceCounting()
    } else {
      startVoiceCounting()
    }
  }, [voiceCountingActive, stopVoiceCounting, startVoiceCounting])

  // Handle pause - stop voice counting when paused
  useEffect(() => {
    if (isPaused && voiceCountingActive) {
      stopVoiceCounting()
    }
  }, [isPaused, voiceCountingActive, stopVoiceCounting])

  // Handle completion - stop voice counting
  useEffect(() => {
    if (repState === 'completed' && voiceCountingActive) {
      stopVoiceCounting()
    }
  }, [repState, voiceCountingActive, stopVoiceCounting])

  // Auto-start voice counting if setting is enabled
  useEffect(() => {
    if (settings.autoStartVoiceCounting && voiceCountingAvailable && repState === 'counting' && !voiceCountingActive && !isPaused) {
      // Small delay to let the component settle
      const timer = setTimeout(() => {
        startVoiceCounting()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [settings.autoStartVoiceCounting, voiceCountingAvailable, repState, isPaused]) // Intentionally exclude voiceCountingActive and startVoiceCounting to avoid loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceIntervalRef.current !== null) {
        clearInterval(voiceIntervalRef.current)
        voiceIntervalRef.current = null
      }
      if (andIntervalRef.current !== null) {
        clearTimeout(andIntervalRef.current)
        andIntervalRef.current = null
      }
    }
  }, [])

  const advanceRep = useCallback(() => {
    if (isLastRep && isLastSide) {
      // All reps and sides complete
      setRepState('completed')
      // Auto-advance after a short delay
      setTimeout(() => {
        onComplete?.()
      }, 1500)
    } else if (isLastRep && !isLastSide) {
      // Finished all reps for current side, move to next side
      setCurrentSideIndex(prev => prev + 1)
      setCurrentRep(1)
    } else {
      // Just advance the rep count
      setCurrentRep(prev => prev + 1)
    }
  }, [isLastRep, isLastSide, onComplete])

  const reset = useCallback(() => {
    stopVoiceCounting()
    setCurrentRep(1)
    setCurrentSideIndex(0)
    setRepState('counting')
    hasSpokenStartRef.current = false
  }, [stopVoiceCounting])

  // Reset when props change (new activity)
  useEffect(() => {
    reset()
  }, [targetCount, side, sideLabels, reset])

  const isCompleted = repState === 'completed'
  const progressPercentage = ((currentSideIndex * targetCount + currentRep) / (totalSides * targetCount)) * 100

  return (
    <div className={`rep-counter ${isCompleted ? "completed" : ""}`}>
      {/* Side indicator for "each side" exercises */}
      {side === "each" && currentSideLabel && (
        <div className="side-indicator">
          <span className="side-label">{currentSideLabel}</span>
          <span className="side-progress">
            Side {currentSideIndex + 1} of {totalSides}
          </span>
        </div>
      )}

      {/* Large rep display */}
      <div className={`rep-display ${isCompleted ? "flash" : ""}`}>
        <span className="current-rep">{currentRep}</span>
        <span className="rep-separator">/</span>
        <span className="target-rep">{targetCount}</span>
      </div>

      {/* Progress bar */}
      <div className="rep-progress-bar">
        <div
          className="rep-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Voice Counting Controls */}
      {voiceCountingAvailable && !isCompleted && (
        <div className="voice-controls">
          <button
            className={`voice-control-btn ${voiceCountingActive ? "active" : ""}`}
            onClick={toggleVoiceCounting}
          >
            <span className="voice-icon">
              {voiceCountingActive ? "🔊" : "🔇"}
            </span>
            <span className="voice-btn-text">
              {voiceCountingActive ? "STOP COUNTING" : "START VOICE"}
            </span>
            {voiceCountingActive && (
              <span className="voice-indicator-dot"></span>
            )}
          </button>

          {/* Consolidated Pace Control UI */}
          <div className="pace-control-container">
            <button
              className="pace-adjust-btn pace-decrement"
              onClick={decrementPace}
              disabled={currentPace <= MIN_PACE}
              aria-label="Decrease pace by 0.2 seconds"
            >
              −
            </button>
            <button
              className="pace-value-btn"
              onClick={() => setShowPaceSetter(true)}
              title="Tap to set custom pace"
            >
              {currentPace > 0 ? `${currentPace.toFixed(1)}s` : "set pace"}
            </button>
            <button
              className="pace-adjust-btn pace-increment"
              onClick={incrementPace}
              disabled={currentPace >= MAX_PACE}
              aria-label="Increase pace by 0.2 seconds"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Graceful degradation messages */}
      {settings.voiceCountingEnabled && !synthesisAvailable && !isCompleted && (
        <div className="voice-unavailable-message">
          Voice counting not available on this browser
        </div>
      )}

      {/* Controls */}
      <div className="rep-controls">
        {!isCompleted && (
          <button className="rep-btn next-btn" onClick={advanceRep}>
            {isLastRep && !isLastSide ? "NEXT SIDE" : "NEXT REP"}
          </button>
        )}

        {isCompleted && (
          <>
            <div className="completion-message">Set Complete!</div>
            <button className="rep-btn reset-btn" onClick={reset}>
              RESTART
            </button>
          </>
        )}
      </div>

      {/* Pace Setter Modal */}
      {showPaceSetter && (
        <PaceSetter
          currentPace={currentPace}
          onPaceSet={(pace) => setActivityPace(activityId, pace)}
          onClose={() => setShowPaceSetter(false)}
        />
      )}
    </div>
  );
}

export default RepCounter
