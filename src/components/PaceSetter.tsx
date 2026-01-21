import { useState, useCallback, useRef, useEffect } from 'react'

interface PaceSetterProps {
  currentPace: number
  onPaceSet: (pace: number) => void
  onClose: () => void
}

function PaceSetter({ currentPace, onPaceSet, onClose }: PaceSetterProps) {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'success'>('idle')
  const [newPace, setNewPace] = useState<number | null>(null)
  const firstTapTimeRef = useRef<number | null>(null)

  // Reset on mount
  useEffect(() => {
    firstTapTimeRef.current = null
    setStatus('idle')
    setNewPace(null)
  }, [])

  const handleTap = useCallback(() => {
    const now = Date.now()

    if (firstTapTimeRef.current === null) {
      // First tap
      firstTapTimeRef.current = now
      setStatus('waiting')
      setNewPace(null)

      // Reset if no second tap within 10 seconds
      setTimeout(() => {
        if (firstTapTimeRef.current !== null && status === 'waiting') {
          firstTapTimeRef.current = null
          setStatus('idle')
        }
      }, 10000)
    } else {
      // Second tap - calculate pace
      const interval = (now - firstTapTimeRef.current) / 1000 // Convert to seconds

      // Validate interval (must be between 0.5 and 10 seconds)
      if (interval < 0.5) {
        // Too fast, ignore
        return
      }

      if (interval > 10) {
        // Too slow, reset
        firstTapTimeRef.current = now
        setStatus('waiting')
        setNewPace(null)
        return
      }

      // Round to 1 decimal place
      const pace = Math.round(interval * 10) / 10
      setNewPace(pace)
      setStatus('success')
      firstTapTimeRef.current = null

      // Save the pace after showing success message
      setTimeout(() => {
        onPaceSet(pace)
        onClose()
      }, 1000)
    }
  }, [status, onPaceSet, onClose])

  const handleCancel = useCallback(() => {
    firstTapTimeRef.current = null
    setStatus('idle')
    setNewPace(null)
    onClose()
  }, [onClose])

  return (
    <div className="pace-setter-overlay">
      <div className="pace-setter-modal">
        <h3>Set Counting Pace</h3>

        <div className="pace-setter-content">
          {status === 'idle' && (
            <>
              <p className="pace-instruction">
                Tap the button twice at your desired pace
              </p>
              <p className="pace-current">
                Current pace: <strong>{currentPace.toFixed(1)}s</strong>
              </p>
            </>
          )}

          {status === 'waiting' && (
            <>
              <p className="pace-instruction pulse">
                Tap again at your desired pace...
              </p>
              <div className="pace-waiting-indicator">
                <div className="waiting-pulse"></div>
              </div>
            </>
          )}

          {status === 'success' && newPace !== null && (
            <>
              <p className="pace-success">
                Pace set!
              </p>
              <p className="pace-new-value">
                <strong>{newPace.toFixed(1)}s</strong>
              </p>
            </>
          )}

          <button
            className="pace-tap-button"
            onClick={handleTap}
            disabled={status === 'success'}
          >
            {status === 'idle' ? 'TAP HERE' : status === 'waiting' ? 'TAP AGAIN' : '✓'}
          </button>
        </div>

        <div className="pace-setter-actions">
          <button
            className="pace-cancel-btn"
            onClick={handleCancel}
            disabled={status === 'success'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaceSetter
