import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useSound } from '../context/SoundContext'

function Settings() {
  const navigate = useNavigate()
  const { settings, updateSetting, resetSettings } = useSettings()
  const { playClick } = useSound()

  const handleToggle = (key: 'soundEnabled' | 'vibrationEnabled') => {
    playClick()
    updateSetting(key, !settings[key])
  }

  const handleRestTimeChange = (value: number) => {
    playClick()
    updateSetting('restTimeBetweenActivities', value)
  }

  const handleBufferTimeChange = (value: number) => {
    playClick()
    updateSetting('timerBufferTime', value)
  }

  const handleReset = () => {
    playClick()
    resetSettings()
  }

  const handleBack = () => {
    playClick()
    navigate('/')
  }

  const restTimeOptions = [
    { value: 0, label: 'None' },
    { value: 5, label: '5 sec' },
    { value: 10, label: '10 sec' },
    { value: 15, label: '15 sec' },
    { value: 30, label: '30 sec' },
  ]

  const bufferTimeOptions = [
    { value: 0, label: 'None' },
    { value: 3, label: '3 sec' },
    { value: 5, label: '5 sec' },
    { value: 10, label: '10 sec' },
  ]

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-btn-header" onClick={handleBack} aria-label="Go back">
          ← Back
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Sound & Feedback</h2>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Sound Effects</span>
            <span className="setting-description">Play sounds when timers complete</span>
          </div>
          <button
            className={`toggle-btn ${settings.soundEnabled ? 'active' : ''}`}
            onClick={() => handleToggle('soundEnabled')}
            aria-pressed={settings.soundEnabled}
            aria-label={settings.soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Vibration</span>
            <span className="setting-description">Vibrate on timer completion</span>
          </div>
          <button
            className={`toggle-btn ${settings.vibrationEnabled ? 'active' : ''}`}
            onClick={() => handleToggle('vibrationEnabled')}
            aria-pressed={settings.vibrationEnabled}
            aria-label={settings.vibrationEnabled ? 'Disable vibration' : 'Enable vibration'}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Timer Settings</h2>

        <div className="setting-item stacked">
          <div className="setting-info">
            <span className="setting-label">Countdown Buffer</span>
            <span className="setting-description">Delay before each timer starts</span>
          </div>
          <div className="option-buttons">
            {bufferTimeOptions.map(option => (
              <button
                key={option.value}
                className={`option-btn ${settings.timerBufferTime === option.value ? 'selected' : ''}`}
                onClick={() => handleBufferTimeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item stacked">
          <div className="setting-info">
            <span className="setting-label">Rest Between Activities</span>
            <span className="setting-description">Pause time between exercises</span>
          </div>
          <div className="option-buttons">
            {restTimeOptions.map(option => (
              <button
                key={option.value}
                className={`option-btn ${settings.restTimeBetweenActivities === option.value ? 'selected' : ''}`}
                onClick={() => handleRestTimeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Data</h2>

        <button className="reset-settings-btn" onClick={handleReset}>
          Reset to Defaults
        </button>
        <p className="reset-description">
          Restores all settings to their default values
        </p>
      </div>

      <div className="settings-footer">
        <p className="version-info">Snowboard Prep v1.0</p>
      </div>
    </div>
  )
}

export default Settings
