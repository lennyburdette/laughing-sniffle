import { useParams, useNavigate } from 'react-router-dom'

function Activity() {
  const { activityIndex } = useParams<{ activityIndex: string }>()
  const navigate = useNavigate()

  const handleNext = () => {
    const nextIndex = parseInt(activityIndex || '0') + 1
    // This will be replaced with actual workout data length check
    navigate(`/activity/${nextIndex}`)
  }

  const handleBack = () => {
    const prevIndex = parseInt(activityIndex || '0') - 1
    if (prevIndex >= 0) {
      navigate(`/activity/${prevIndex}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="activity-screen">
      <h2>Activity {parseInt(activityIndex || '0') + 1}</h2>
      <div className="activity-content">
        {/* Illustration placeholder */}
        <div className="illustration-placeholder">
          [Exercise Illustration]
        </div>
        {/* Timer or rep counter will go here */}
        <div className="controls-placeholder">
          [Timer / Rep Counter]
        </div>
      </div>
      <div className="navigation">
        <button onClick={handleBack}>BACK</button>
        <button onClick={handleNext}>NEXT</button>
      </div>
    </div>
  )
}

export default Activity
