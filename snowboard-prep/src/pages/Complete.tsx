import { useNavigate } from 'react-router-dom'
import { useTimer } from '../context/TimerContext'

function Complete() {
  const navigate = useNavigate()
  const { elapsedSeconds, formatTime, reset, start } = useTimer()

  const handleRestart = () => {
    reset()
    start()
    navigate('/activity/0')
  }

  const handleHome = () => {
    reset()
    navigate('/')
  }

  return (
    <div className="complete-screen">
      <h1>Workout Complete!</h1>
      <p>Great job finishing your snowboard prep routine!</p>
      <p className="final-time">Total Time: {formatTime(elapsedSeconds)}</p>
      <div className="complete-actions">
        <button onClick={handleRestart}>RESTART</button>
        <button onClick={handleHome}>HOME</button>
      </div>
    </div>
  )
}

export default Complete
