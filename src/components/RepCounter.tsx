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
  const [voiceListeningActive, setVoiceListeningActive] = useState(false)
  const { playSetComplete, playClick, vibrate } = useSound()
  const { synthesisAvailable, speak, cancelSpeech, recognitionAvailable, isListening, startListening, stopListening, recognitionError } = useVoice()
  const { settings } = useSettings()

  // Refs for voice counting interval
  const voiceIntervalRef = useRef<number | null>(null)
  const currentRepRef = useRef(currentRep)
  const currentSideIndexRef = useRef(currentSideIndex)
  const isCompletedRef = useRef(false)

  // Ref for voice command debouncing
  const lastCommandTimeRef = useRef<number>(0)
  const COMMAND_DEBOUNCE_MS = 500 // Minimum time between commands

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

  // Check if voice commands should be available
  const voiceCommandsAvailable = recognitionAvailable && settings.voiceCommandsEnabled

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

  // Voice command handler - processes recognized speech commands
  const handleVoiceCommand = useCallback((command: string) => {
    // Debounce repeated commands
    const now = Date.now()
    if (now - lastCommandTimeRef.current < COMMAND_DEBOUNCE_MS) {
      return
    }
    lastCommandTimeRef.current = now

    // Don't process commands if completed
    if (isCompletedRef.current) {
      return
    }

    // Normalize command (already lowercase and trimmed from VoiceContext)
    const normalizedCommand = command

    // Commands to advance rep: 'next', 'rep', 'count', 'go'
    if (['next', 'rep', 'count', 'go'].some(cmd => normalizedCommand.includes(cmd))) {
      // Directly advance the rep (similar to advanceRep but using refs for current state)
      const rep = currentRepRef.current
      const sideIdx = currentSideIndexRef.current
      const isLastRepNow = rep === targetCount
      const isLastSideNow = sideIdx === totalSides - 1

      playClick()

      if (isLastRepNow && isLastSideNow) {
        // All reps and sides complete
        setRepState('completed')
        playSetComplete()
        vibrate([100, 50, 100, 50, 100])
        stopVoiceCounting()
        setTimeout(() => {
          onComplete?.()
        }, 1500)
      } else if (isLastRepNow && !isLastSideNow) {
        // Finished all reps for current side, move to next side
        setCurrentSideIndex(prev => prev + 1)
        setCurrentRep(1)
      } else {
        // Just advance the rep count
        setCurrentRep(prev => prev + 1)
      }
      return
    }

    // Commands to pause voice counting: 'pause', 'stop'
    if (['pause', 'stop'].some(cmd => normalizedCommand.includes(cmd))) {
      if (voiceCountingActive) {
        stopVoiceCounting()
      }
      return
    }

    // Commands to resume voice counting: 'resume', 'start', 'continue'
    if (['resume', 'start', 'continue'].some(cmd => normalizedCommand.includes(cmd))) {
      if (!voiceCountingActive && voiceCountingAvailable) {
        startVoiceCounting()
      }
      return
    }
  }, [targetCount, totalSides, playClick, playSetComplete, vibrate, onComplete, voiceCountingActive, voiceCountingAvailable, stopVoiceCounting, startVoiceCounting])

  // Start voice command listening
  const startVoiceListening = useCallback(() => {
    if (!voiceCommandsAvailable || repState === 'completed') {
      return
    }
    setVoiceListeningActive(true)
    startListening(handleVoiceCommand)
  }, [voiceCommandsAvailable, repState, startListening, handleVoiceCommand])

  // Stop voice command listening
  const stopVoiceListening = useCallback(() => {
    setVoiceListeningActive(false)
    stopListening()
  }, [stopListening])

  // Toggle voice command listening
  const toggleVoiceListening = useCallback(() => {
    if (voiceListeningActive || isListening) {
      stopVoiceListening()
    } else {
      startVoiceListening()
    }
  }, [voiceListeningActive, isListening, stopVoiceListening, startVoiceListening])

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

  // Handle completion - stop voice listening
  useEffect(() => {
    if (repState === 'completed' && (voiceListeningActive || isListening)) {
      stopVoiceListening()
    }
  }, [repState, voiceListeningActive, isListening, stopVoiceListening])

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

  // Auto-start voice commands if setting is enabled
  useEffect(() => {
    if (settings.voiceCommandsEnabled && voiceCommandsAvailable && repState === 'counting' && !voiceListeningActive && !isListening && !isPaused) {
      // Small delay to let the component settle
      const timer = setTimeout(() => {
        startVoiceListening()
      }, 600) // Slightly longer delay than voice counting
      return () => clearTimeout(timer)
    }
  }, [settings.voiceCommandsEnabled, voiceCommandsAvailable, repState, isPaused]) // Intentionally exclude voiceListeningActive, isListening, startVoiceListening to avoid loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceIntervalRef.current !== null) {
        clearInterval(voiceIntervalRef.current)
        voiceIntervalRef.current = null
      }
      // Voice listening cleanup is handled by VoiceContext
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
    stopVoiceListening()
    setCurrentRep(1)
    setCurrentSideIndex(0)
    setRepState('counting')
  }, [stopVoiceCounting, stopVoiceListening])

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

      {/* Voice Commands Controls */}
      {voiceCommandsAvailable && !isCompleted && (
        <div className="voice-commands-controls">
          <button
            className={`voice-command-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceListening}
          >
            <span className={`mic-icon ${isListening ? 'pulse' : ''}`}>🎤</span>
            <span className="voice-cmd-btn-text">
              {isListening ? 'STOP LISTENING' : 'VOICE COMMANDS'}
            </span>
            {isListening && (
              <span className="voice-listening-indicator"></span>
            )}
          </button>
          {isListening && (
            <div className="voice-listening-status">
              <span className="listening-pulse"></span>
              <span className="listening-text">
                Say "next", "pause", "start"...
              </span>
            </div>
          )}
          {recognitionError && !isListening && (
            <div className="voice-error-message">
              {recognitionError}
            </div>
          )}
        </div>
      )}

      {/* Graceful degradation messages */}
      {settings.voiceCountingEnabled && !synthesisAvailable && !isCompleted && (
        <div className="voice-unavailable-message">
          Voice counting not available on this browser
        </div>
      )}
      {settings.voiceCommandsEnabled && !recognitionAvailable && !isCompleted && (
        <div className="voice-unavailable-message">
          Voice commands only available on Chrome/Edge
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
