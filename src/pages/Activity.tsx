import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import ActivityScreen from '../components/ActivityScreen'

function Activity() {
  const { activityIndex } = useParams<{ activityIndex: string }>()
  const navigate = useNavigate()
  const {
    activities,
    isWorkoutStarted,
    goToActivity,
    markActivityCompleted,
    isActivityCompleted,
    completeWorkout
  } = useWorkout()

  const currentIndex = parseInt(activityIndex || '0', 10)
  const activity = activities[currentIndex]

  // Sync URL param with workout context
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < activities.length) {
      goToActivity(currentIndex)
    }
  }, [currentIndex, activities.length, goToActivity])

  // If workout hasn't started, redirect to home
  useEffect(() => {
    if (!isWorkoutStarted) {
      navigate('/')
    }
  }, [isWorkoutStarted, navigate])

  // If invalid index, redirect to home
  if (!activity || currentIndex < 0 || currentIndex >= activities.length) {
    navigate('/')
    return null
  }

  const handleNext = () => {
    // Mark current activity as completed when advancing
    markActivityCompleted(currentIndex)

    const nextIndex = currentIndex + 1
    if (nextIndex < activities.length) {
      navigate(`/activity/${nextIndex}`)
    } else {
      completeWorkout()
      navigate('/complete')
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      navigate(`/activity/${currentIndex - 1}`)
    } else {
      navigate('/')
    }
  }

  const handleComplete = () => {
    markActivityCompleted(currentIndex)
    completeWorkout()
    navigate('/complete')
  }

  const handleActivityComplete = () => {
    // Called when timer/rep counter completes
    markActivityCompleted(currentIndex)
  }

  return (
    <ActivityScreen
      activity={activity}
      currentIndex={currentIndex}
      totalActivities={activities.length}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
      onActivityComplete={handleActivityComplete}
      isCompleted={isActivityCompleted(currentIndex)}
    />
  )
}

export default Activity
