import { useTimer } from '../context/TimerContext'

function OverallTimer() {
  const { elapsedSeconds, isRunning, isPaused, pause, resume, formatTime } = useTimer()

  // Only show when workout is running
  if (!isRunning) {
    return null
  }

  const handleTogglePause = () => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }

  return (
    <div className="overall-timer">
      <div className="overall-timer-display">
        <span className="timer-label">Total Time</span>
        <span className={`timer-value ${isPaused ? 'paused' : ''}`}>
          {formatTime(elapsedSeconds)}
        </span>
      </div>
      <button
        className="timer-toggle-btn"
        onClick={handleTogglePause}
        aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>
    </div>
  )
}

export default OverallTimer
