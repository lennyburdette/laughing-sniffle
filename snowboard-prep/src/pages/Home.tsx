import { useNavigate } from 'react-router-dom'
import { useTimer } from '../context/TimerContext'

function Home() {
  const navigate = useNavigate()
  const { start, reset, isRunning } = useTimer()

  const handleStartWorkout = () => {
    reset()
    start()
    navigate('/activity/0')
  }

  const handleResumeWorkout = () => {
    navigate('/activity/0')
  }

  return (
    <div className="home-screen">
      <h1>Snowboard Prep Workout</h1>
      <p>25-30 minute routine</p>
      {isRunning ? (
        <button onClick={handleResumeWorkout} className="start-button">
          RESUME WORKOUT
        </button>
      ) : (
        <button onClick={handleStartWorkout} className="start-button">
          START WORKOUT
        </button>
      )}
    </div>
  )
}

export default Home
