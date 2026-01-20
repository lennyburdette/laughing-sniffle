import { useCallback, useState, useEffect, useRef } from 'react'
import type { Activity } from '../data/workoutTypes'
import ActivityTimer from './ActivityTimer'
import RepCounter from './RepCounter'
import { getIllustration, getFallbackIcon } from '../utils/illustrations'
import { useSettings } from '../context/SettingsContext'

interface ActivityScreenProps {
  activity: Activity
  currentIndex: number
  totalActivities: number
  onNext: () => void
  onBack: () => void
  onComplete?: () => void
  onActivityComplete?: () => void
  isCompleted?: boolean
}

function ActivityScreen({
  activity,
  currentIndex,
  totalActivities,
  onNext,
  onBack,
  onComplete,
  onActivityComplete,
  isCompleted = false
}: ActivityScreenProps) {
  const { settings } = useSettings()
  const [isResting, setIsResting] = useState(false)
  const [restSeconds, setRestSeconds] = useState(0)
  const restIntervalRef = useRef<number | null>(null)

  // Clear rest interval on unmount or activity change
  useEffect(() => {
    return () => {
      if (restIntervalRef.current !== null) {
        clearInterval(restIntervalRef.current)
        restIntervalRef.current = null
      }
    }
  }, [])

  // Reset rest state when activity changes
  useEffect(() => {
    setIsResting(false)
    setRestSeconds(0)
    if (restIntervalRef.current !== null) {
      clearInterval(restIntervalRef.current)
      restIntervalRef.current = null
    }
  }, [activity.id])

  const handleActivityComplete = useCallback(() => {
    // Notify parent that activity is complete (for tracking)
    if (onActivityComplete) {
      onActivityComplete()
    }

    // If rest time is configured and not the last activity, show rest countdown
    const isLast = currentIndex === totalActivities - 1
    if (settings.restTimeBetweenActivities > 0 && !isLast) {
      setIsResting(true)
      setRestSeconds(settings.restTimeBetweenActivities)

      restIntervalRef.current = window.setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            if (restIntervalRef.current !== null) {
              clearInterval(restIntervalRef.current)
              restIntervalRef.current = null
            }
            setIsResting(false)
            onNext()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      // Auto-advance to next after a short delay on completion
      setTimeout(() => {
        onNext()
      }, 500)
    }
  }, [onNext, onActivityComplete, settings.restTimeBetweenActivities, currentIndex, totalActivities])

  const skipRest = useCallback(() => {
    if (restIntervalRef.current !== null) {
      clearInterval(restIntervalRef.current)
      restIntervalRef.current = null
    }
    setIsResting(false)
    onNext()
  }, [onNext])

  const isFirstActivity = currentIndex === 0
  const isLastActivity = currentIndex === totalActivities - 1

  // Get illustration for current activity
  const illustration = getIllustration(activity.id)
  const fallbackIcon = getFallbackIcon(activity.id)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset image state when activity changes
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [activity.id])

  // Get duration - use first value of range if available, otherwise duration
  const getDuration = (): number => {
    if (activity.duration) return activity.duration
    if (activity.durationRange) return activity.durationRange[0]
    return 30 // fallback
  }

  // Get count - use first value of range if available, otherwise count
  const getCount = (): number => {
    if (activity.count) return activity.count
    if (activity.countRange) return activity.countRange[0]
    return 10 // fallback
  }

  // Show rest screen between activities
  if (isResting) {
    return (
      <div className="activity-screen-container rest-screen">
        <div className="rest-content">
          <div className="rest-icon">⏸️</div>
          <h2 className="rest-title">Rest</h2>
          <div className="rest-countdown">{restSeconds}</div>
          <p className="rest-message">Get ready for the next exercise</p>
          <button className="timer-btn start-btn" onClick={skipRest}>
            SKIP REST
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`activity-screen-container ${isCompleted ? 'activity-completed' : ''}`}>
      {/* Progress indicator */}
      <div className="activity-progress">
        <span className="progress-text">
          Activity {currentIndex + 1} of {totalActivities}
          {isCompleted && <span className="completed-badge"> ✓</span>}
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / totalActivities) * 100}%` }}
          />
        </div>
      </div>

      {/* Activity name */}
      <h2 className="activity-name">{activity.name}</h2>

      {/* Activity description */}
      <p className="activity-description">{activity.description}</p>

      {/* Activity illustration */}
      <div className="activity-illustration">
        {illustration && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="illustration-placeholder-img">
                <span className="placeholder-icon">{fallbackIcon}</span>
              </div>
            )}
            <img
              src={illustration}
              alt={activity.name}
              className={`activity-illustration-img ${!imageLoaded ? 'loading' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <div className="illustration-placeholder-img">
            <span className="placeholder-icon">{fallbackIcon}</span>
          </div>
        )}
      </div>

      {/* Timer or Rep Counter */}
      <div className="activity-controls">
        {activity.type === 'timer' ? (
          <ActivityTimer
            duration={getDuration()}
            onComplete={handleActivityComplete}
          />
        ) : (
          <RepCounter
            targetCount={getCount()}
            side={activity.side}
            sideLabels={activity.sideLabels}
            onComplete={handleActivityComplete}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="activity-navigation">
        <button
          className="nav-btn back-btn"
          onClick={onBack}
          disabled={isFirstActivity}
        >
          {isFirstActivity ? 'HOME' : 'BACK'}
        </button>
        <button
          className="nav-btn next-btn"
          onClick={isLastActivity ? onComplete : onNext}
        >
          {isLastActivity ? 'FINISH' : 'SKIP'}
        </button>
      </div>
    </div>
  )
}

export default ActivityScreen
