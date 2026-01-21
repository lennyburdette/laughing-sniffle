import { useState, useCallback, useEffect, useRef } from 'react'
import { useSound } from '../context/SoundContext'
import { useVoice } from '../context/VoiceContext'
import { useSettings } from '../context/SettingsContext'

interface RepCounterProps {
  targetCount: number
  side?: 'each' | null
  sideLabels?: string[]
  onComplete?: () => void
  isPaused?: boolean
}

type RepState = 'counting' | 'completed'

function RepCounter({ targetCount, side, sideLabels, onComplete, isPaused = false }: RepCounterProps) {
  const [currentRep, setCurrentRep] = useState(1)
  const [currentSideIndex, setCurrentSideIndex] = useState(0)
  const [repState, setRepState] = useState<RepState>('counting')
  const [voiceCountingActive, setVoiceCountingActive] = useState(false)
  const { playSetComplete, playClick, vibrate } = useSound()
  const { synthesisAvailable, speak, cancelSpeech } = useVoice()
  const { settings } = useSettings()

  // Refs for voice counting interval
  const voiceIntervalRef = useRef<number | null>(null)
  const currentRepRef = useRef(currentRep)
  const currentSideIndexRef = useRef(currentSideIndex)
  const isCompletedRef = useRef(false)

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

  // Stop voice counting
  const stopVoiceCounting = useCallback(() => {
    if (voiceIntervalRef.current !== null) {
      clearInterval(voiceIntervalRef.current)
      voiceIntervalRef.current = null
    }
    setVoiceCountingActive(false)
    cancelSpeech()
  }, [cancelSpeech])

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

    // Speak the current rep number
    speak(String(rep), {
      rate: settings.voiceRate,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume
    })

    // Play click sound
    playClick()

    // Advance the rep
    if (isLastRepNow && isLastSideNow) {
      // All reps and sides complete - handled by advanceRep which will be called
      // We need to actually update state here
      setRepState('completed')
      playSetComplete()
      vibrate([100, 50, 100, 50, 100])
      stopVoiceCounting()
      setTimeout(() => {
        onComplete?.()
      }, 1500)
    } else if (isLastRepNow && !isLastSideNow) {
      // Move to next side
      setCurrentSideIndex(prev => prev + 1)
      setCurrentRep(1)
    } else {
      // Just advance the rep
      setCurrentRep(prev => prev + 1)
    }
  }, [targetCount, totalSides, speak, settings.voiceRate, settings.voicePitch, settings.voiceVolume, playClick, playSetComplete, vibrate, onComplete, stopVoiceCounting])

  // Start voice counting
  const startVoiceCounting = useCallback(() => {
    if (!voiceCountingAvailable || repState === 'completed') {
      return
    }

    // Clear any existing interval
    if (voiceIntervalRef.current !== null) {
      clearInterval(voiceIntervalRef.current)
    }

    setVoiceCountingActive(true)

    // Immediately do first count
    voiceCountTick()

    // Set up interval for subsequent counts
    const intervalMs = settings.voiceCountingPace * 1000
    voiceIntervalRef.current = window.setInterval(voiceCountTick, intervalMs)
  }, [voiceCountingAvailable, repState, voiceCountTick, settings.voiceCountingPace])

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
    }
  }, [])

  const advanceRep = useCallback(() => {
    playClick()

    if (isLastRep && isLastSide) {
      // All reps and sides complete
      setRepState('completed')
      playSetComplete()
      vibrate([100, 50, 100, 50, 100]) // Triple vibration pattern
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
  }, [isLastRep, isLastSide, playClick, playSetComplete, vibrate, onComplete])

  const reset = useCallback(() => {
    stopVoiceCounting()
    setCurrentRep(1)
    setCurrentSideIndex(0)
    setRepState('counting')
  }, [stopVoiceCounting])

  // Reset when props change (new activity)
  useEffect(() => {
    reset()
  }, [targetCount, side, sideLabels, reset])

  const isCompleted = repState === 'completed'
  const progressPercentage = ((currentSideIndex * targetCount + currentRep) / (totalSides * targetCount)) * 100

  return (
    <div className={`rep-counter ${isCompleted ? 'completed' : ''}`}>
      {/* Side indicator for "each side" exercises */}
      {side === 'each' && currentSideLabel && (
        <div className="side-indicator">
          <span className="side-label">{currentSideLabel}</span>
          <span className="side-progress">
            Side {currentSideIndex + 1} of {totalSides}
          </span>
        </div>
      )}

      {/* Large rep display */}
      <div className={`rep-display ${isCompleted ? 'flash' : ''}`}>
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
            className={`voice-control-btn ${voiceCountingActive ? 'active' : ''}`}
            onClick={toggleVoiceCounting}
          >
            <span className="voice-icon">{voiceCountingActive ? '🔊' : '🔇'}</span>
            <span className="voice-btn-text">
              {voiceCountingActive ? 'STOP COUNTING' : 'START VOICE'}
            </span>
            {voiceCountingActive && (
              <span className="voice-indicator-dot"></span>
            )}
          </button>
          {voiceCountingActive && (
            <div className="voice-active-indicator">
              <span className="voice-pulse"></span>
              <span className="voice-status-text">
                Counting every {settings.voiceCountingPace}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Graceful degradation message */}
      {settings.voiceCountingEnabled && !synthesisAvailable && !isCompleted && (
        <div className="voice-unavailable-message">
          Voice counting not available on this browser
        </div>
      )}

      {/* Controls */}
      <div className="rep-controls">
        {!isCompleted && (
          <button className="rep-btn next-btn" onClick={advanceRep}>
            {isLastRep && !isLastSide ? 'NEXT SIDE' : 'NEXT REP'}
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
    </div>
  )
}

export default RepCounter
