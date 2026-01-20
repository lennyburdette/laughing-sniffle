import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimer } from '../context/TimerContext'
import { useWorkout } from '../context/WorkoutContext'
import { workout } from '../data'
import type { Section } from '../data/workoutTypes'

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
    isWorkoutStarted,
    goToActivity
  } = useWorkout()

  const [showWeeklyView, setShowWeeklyView] = useState(false)

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

  const handleJumpToSection = (sectionId: string) => {
    let activityIndex = 0

    for (const section of workout.sections) {
      if (section.id === sectionId) {
        break
      }
      activityIndex += section.activities.length
    }

    reset()
    start()
    startWorkout()
    goToActivity(activityIndex)
    navigate(`/activity/${activityIndex}`)
  }

  const getTodaySchedule = () => {
    const today = new Date().getDay()
    const dayOfWeek = today === 0 ? 7 : today
    return workout.weeklyStructure.days.find(d => d.day === dayOfWeek)
  }

  const todaySchedule = getTodaySchedule()

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'warmup': return '🔥'
      case 'mobility': return '🧘'
      case 'strength': return '💪'
      case 'recovery': return '🌿'
      default: return '•'
    }
  }

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>{workout.workout.name}</h1>
        <p className="home-subtitle">{workout.workout.estimatedDuration}</p>
      </div>

      <p className="home-description">{workout.workout.description}</p>

      {/* Today's Schedule Card */}
      {todaySchedule && (
        <div className="today-card">
          <div className="today-header">
            <span className="today-label">Today - {todaySchedule.name}</span>
            <span className="today-type">{todaySchedule.type}</span>
          </div>
          <p className="today-description">{todaySchedule.description}</p>
        </div>
      )}

      {/* Start/Resume Buttons */}
      {hasSavedProgress ? (
        <div className="resume-section">
          <p className="resume-info">
            Workout in progress ({completedCount}/{totalActivities} completed)
          </p>
          <button onClick={handleResumeWorkout} className="start-button">
            RESUME WORKOUT
          </button>
          <button onClick={handleDiscardProgress} className="secondary-button">
            START NEW
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

      {/* Quick Section Jump */}
      <div className="section-jump">
        <h3 className="section-jump-title">Jump to Section</h3>
        <div className="section-list">
          {workout.sections.map((section: Section) => (
            <button
              key={section.id}
              className="section-btn"
              onClick={() => handleJumpToSection(section.id)}
            >
              <span className="section-icon">{getSectionIcon(section.id)}</span>
              <span className="section-name">{section.name}</span>
              <span className="section-duration">{section.estimatedDuration}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Structure Toggle */}
      <button
        className="weekly-toggle"
        onClick={() => setShowWeeklyView(!showWeeklyView)}
      >
        {showWeeklyView ? 'Hide Weekly Schedule' : 'View Weekly Schedule'}
      </button>

      {showWeeklyView && (
        <div className="weekly-structure">
          <h3 className="weekly-title">Weekly Structure</h3>
          <p className="weekly-description">{workout.weeklyStructure.description}</p>
          <div className="weekly-days">
            {workout.weeklyStructure.days.map(day => (
              <div
                key={day.day}
                className={`day-card ${todaySchedule?.day === day.day ? 'today' : ''}`}
              >
                <div className="day-header">
                  <span className="day-name">{day.name.substring(0, 3)}</span>
                  <span className={`day-type-badge ${day.type}`}>{day.type}</span>
                </div>
                <p className="day-description">{day.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="tips-section">
        <h3 className="tips-title">Quick Tips</h3>
        <ul className="tips-list">
          {workout.tips.slice(0, 3).map((tip, index) => (
            <li key={index} className="tip-item">{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Home
