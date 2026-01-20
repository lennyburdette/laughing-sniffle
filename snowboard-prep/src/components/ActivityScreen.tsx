import { useCallback, useState } from 'react'
import type { Activity } from '../data/workoutTypes'
import ActivityTimer from './ActivityTimer'
import RepCounter from './RepCounter'
import { getIllustration, getFallbackIcon } from '../utils/illustrations'

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
  const handleActivityComplete = useCallback(() => {
    // Notify parent that activity is complete (for tracking)
    if (onActivityComplete) {
      onActivityComplete()
    }
    // Auto-advance to next after a short delay on completion
    // The timer/rep counter already handles their own completion sound
    setTimeout(() => {
      onNext()
    }, 500)
  }, [onNext, onActivityComplete])

  const isFirstActivity = currentIndex === 0
  const isLastActivity = currentIndex === totalActivities - 1

  // Get illustration for current activity
  const illustration = getIllustration(activity.id)
  const fallbackIcon = getFallbackIcon(activity.id)
  const [imageError, setImageError] = useState(false)

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
          <img
            src={illustration}
            alt={activity.name}
            className="activity-illustration-img"
            onError={() => setImageError(true)}
          />
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
