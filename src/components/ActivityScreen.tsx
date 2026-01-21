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

const AUTO_ADVANCE_DURATION = 3 // seconds

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

  // Auto-advance countdown state
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(AUTO_ADVANCE_DURATION)
  const autoAdvanceIntervalRef = useRef<number | null>(null)

  // Clear intervals on unmount or activity change
  useEffect(() => {
    return () => {
      if (restIntervalRef.current !== null) {
        clearInterval(restIntervalRef.current)
        restIntervalRef.current = null
      }
      if (autoAdvanceIntervalRef.current !== null) {
        clearInterval(autoAdvanceIntervalRef.current)
        autoAdvanceIntervalRef.current = null
      }
    }
  }, [])

  // Reset rest and auto-advance state when activity changes
  useEffect(() => {
    setIsResting(false)
    setRestSeconds(0)
    setIsAutoAdvancing(false)
    setAutoAdvanceSeconds(AUTO_ADVANCE_DURATION)
    if (restIntervalRef.current !== null) {
      clearInterval(restIntervalRef.current)
      restIntervalRef.current = null
    }
    if (autoAdvanceIntervalRef.current !== null) {
      clearInterval(autoAdvanceIntervalRef.current)
      autoAdvanceIntervalRef.current = null
    }
  }, [activity.id])

  // Start auto-advance countdown
  const startAutoAdvance = useCallback(() => {
    setIsAutoAdvancing(true)
    setAutoAdvanceSeconds(AUTO_ADVANCE_DURATION)

    autoAdvanceIntervalRef.current = window.setInterval(() => {
      setAutoAdvanceSeconds(prev => {
        if (prev <= 1) {
          if (autoAdvanceIntervalRef.current !== null) {
            clearInterval(autoAdvanceIntervalRef.current)
            autoAdvanceIntervalRef.current = null
          }
          setIsAutoAdvancing(false)
          onNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onNext])

  // Handle immediate advancement (GO NOW button)
  const handleGoNow = useCallback(() => {
    if (autoAdvanceIntervalRef.current !== null) {
      clearInterval(autoAdvanceIntervalRef.current)
      autoAdvanceIntervalRef.current = null
    }
    setIsAutoAdvancing(false)
    onNext()
  }, [onNext])

  const handleActivityComplete = useCallback(() => {
    // Notify parent that activity is complete (for tracking)
    if (onActivityComplete) {
      onActivityComplete()
    }

    // Check if this is the last activity
    const isLast = currentIndex === totalActivities - 1

    // Last activity: no auto-advance (user must manually click FINISH WORKOUT)
    if (isLast) {
      return
    }

    // If rest time is configured, show rest countdown (takes precedence over auto-advance)
    if (settings.restTimeBetweenActivities > 0) {
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
      // Show auto-advance countdown overlay
      startAutoAdvance()
    }
  }, [onNext, onActivityComplete, settings.restTimeBetweenActivities, currentIndex, totalActivities, startAutoAdvance])

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

  // Calculate progress for circular indicator (0 to 1, inverted for countdown effect)
  const autoAdvanceProgress = (AUTO_ADVANCE_DURATION - autoAdvanceSeconds) / AUTO_ADVANCE_DURATION

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
      {/* Auto-advance countdown overlay */}
      {isAutoAdvancing && (
        <div className="auto-advance-overlay">
          <div className="auto-advance-content">
            <div className="auto-advance-ring-container">
              <svg className="auto-advance-ring" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  className="auto-advance-ring-bg"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="6"
                />
                {/* Progress circle */}
                <circle
                  className="auto-advance-ring-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - autoAdvanceProgress)}`,
                  }}
                />
              </svg>
              <div className="auto-advance-countdown">{autoAdvanceSeconds}</div>
            </div>
            <p className="auto-advance-message">Auto-advancing to next activity...</p>
            <button className="auto-advance-go-btn" onClick={handleGoNow}>
              GO NOW
            </button>
          </div>
        </div>
      )}

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
            side={activity.side}
            sideLabels={activity.sideLabels}
          />
        ) : (
          <RepCounter
            activityId={activity.id}
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
          {isLastActivity ? 'FINISH WORKOUT' : 'SKIP ACTIVITY'}
        </button>
      </div>
    </div>
  )
}

export default ActivityScreen
