import { useNavigate } from 'react-router-dom'
import { useTimer } from '../context/TimerContext'
import { useWorkout } from '../context/WorkoutContext'

function Complete() {
  const navigate = useNavigate()
  const { elapsedSeconds, formatTime, reset: resetTimer, start } = useTimer()
  const { completedCount, totalActivities, restartWorkout, resetWorkout } = useWorkout()

  const handleRestart = () => {
    resetTimer()
    start()
    restartWorkout()
    navigate('/activity/0')
  }

  const handleHome = () => {
    resetTimer()
    resetWorkout()
    navigate('/')
  }

  const completionPercentage = totalActivities > 0
    ? Math.round((completedCount / totalActivities) * 100)
    : 100

  return (
    <div className="complete-screen">
      <h1>Workout Complete!</h1>
      <p className="complete-message">Great job finishing your snowboard prep routine!</p>

      <div className="complete-stats">
        <p className="final-time">Total Time: {formatTime(elapsedSeconds)}</p>
        <p className="final-progress">
          Activities Completed: {completedCount} / {totalActivities}
          {completionPercentage === 100 && <span className="perfect-badge"> Perfect!</span>}
        </p>
      </div>

      <div className="complete-actions">
        <button onClick={handleRestart} className="restart-btn">
          RESTART WORKOUT
        </button>
        <button onClick={handleHome} className="home-btn">
          HOME
        </button>
      </div>
    </div>
  )
}

export default Complete
