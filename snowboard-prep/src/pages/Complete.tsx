import { useNavigate } from 'react-router-dom'

function Complete() {
  const navigate = useNavigate()

  const handleRestart = () => {
    navigate('/activity/0')
  }

  const handleHome = () => {
    navigate('/')
  }

  return (
    <div className="complete-screen">
      <h1>Workout Complete!</h1>
      <p>Great job finishing your snowboard prep routine!</p>
      <div className="complete-actions">
        <button onClick={handleRestart}>RESTART</button>
        <button onClick={handleHome}>HOME</button>
      </div>
    </div>
  )
}

export default Complete
