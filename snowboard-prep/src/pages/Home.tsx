import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const handleStartWorkout = () => {
    navigate('/activity/0')
  }

  return (
    <div className="home-screen">
      <h1>Snowboard Prep Workout</h1>
      <p>25-30 minute routine</p>
      <button onClick={handleStartWorkout} className="start-button">
        START WORKOUT
      </button>
    </div>
  )
}

export default Home
