import { useState, useCallback, useEffect } from 'react'

interface RepCounterProps {
  targetCount: number
  side?: 'each' | null
  sideLabels?: string[]
  onComplete?: () => void
}

type RepState = 'counting' | 'completed'

function RepCounter({ targetCount, side, sideLabels, onComplete }: RepCounterProps) {
  const [currentRep, setCurrentRep] = useState(1)
  const [currentSideIndex, setCurrentSideIndex] = useState(0)
  const [repState, setRepState] = useState<RepState>('counting')

  // Determine the sides to track
  const sides = side === 'each' && sideLabels ? sideLabels : [null]
  const totalSides = sides.length
  const isLastSide = currentSideIndex === totalSides - 1
  const isLastRep = currentRep === targetCount
  const currentSideLabel = sides[currentSideIndex]

  const playCompletionSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

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

      const now = audioContext.currentTime
      playBeep(now, 523.25)      // C5
      playBeep(now + 0.15, 659.25) // E5
      playBeep(now + 0.3, 783.99)  // G5
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }, [])

  const playClickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 440
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }, [])

  const advanceRep = useCallback(() => {
    playClickSound()

    if (isLastRep && isLastSide) {
      // All reps and sides complete
      setRepState('completed')
      playCompletionSound()
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
  }, [isLastRep, isLastSide, playClickSound, playCompletionSound, onComplete])

  const reset = useCallback(() => {
    setCurrentRep(1)
    setCurrentSideIndex(0)
    setRepState('counting')
  }, [])

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
