import { useState, useCallback, useEffect } from 'react'
import { useSound } from '../context/SoundContext'

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
  const { playSetComplete, playClick, vibrate } = useSound()

  // Determine the sides to track
  const sides = side === 'each' && sideLabels ? sideLabels : [null]
  const totalSides = sides.length
  const isLastSide = currentSideIndex === totalSides - 1
  const isLastRep = currentRep === targetCount
  const currentSideLabel = sides[currentSideIndex]

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
