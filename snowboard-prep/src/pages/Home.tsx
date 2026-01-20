import { useNavigate } from 'react-router-dom'
import { useTimer } from '../context/TimerContext'
import { useWorkout } from '../context/WorkoutContext'

function Home() {
  const navigate = useNavigate()
  const { start, reset } = useTimer()
  const {
    startWorkout,
    resumeWorkout,
    hasSavedProgress,
    clearSavedProgress,
    currentActivityIndex,
    completedCount,
    totalActivities,
    isWorkoutStarted
  } = useWorkout()

  const handleStartWorkout = () => {
    reset()
    start()
    startWorkout()
    navigate('/activity/0')
  }

  const handleResumeWorkout = () => {
    resumeWorkout()
    navigate(`/activity/${currentActivityIndex}`)
  }

  const handleDiscardProgress = () => {
    clearSavedProgress()
    reset()
  }

  return (
    <div className="home-screen">
      <h1>Snowboard Prep Workout</h1>
      <p className="home-subtitle">25-30 minute routine</p>

      {hasSavedProgress ? (
        <div className="resume-section">
          <p className="resume-info">
            You have a workout in progress ({completedCount}/{totalActivities} activities completed)
          </p>
          <button onClick={handleResumeWorkout} className="start-button">
            RESUME WORKOUT
          </button>
          <button onClick={handleDiscardProgress} className="secondary-button">
            START NEW WORKOUT
          </button>
        </div>
      ) : isWorkoutStarted ? (
        <div className="resume-section">
          <p className="resume-info">Workout in progress</p>
          <button onClick={() => navigate(`/activity/${currentActivityIndex}`)} className="start-button">
            CONTINUE WORKOUT
          </button>
        </div>
      ) : (
        <button onClick={handleStartWorkout} className="start-button">
          START WORKOUT
        </button>
      )}
    </div>
  )
}

export default Home
