import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useSound } from '../context/SoundContext'
import { useVoice } from '../context/VoiceContext'

function Settings() {
  const navigate = useNavigate()
  const { settings, updateSetting, resetSettings } = useSettings()
  const { playClick } = useSound()
  const { synthesisAvailable, recognitionAvailable, speak, isSpeaking } = useVoice()

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

  const handleVoiceToggle = (key: 'voiceCountingEnabled' | 'voiceCommandsEnabled' | 'autoStartVoiceCounting') => {
    playClick()
    updateSetting(key, !settings[key])
  }

  const handleVoicePaceChange = (value: number) => {
    playClick()
    updateSetting('voiceCountingPace', value)
  }

  const handleVoiceVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSetting('voiceVolume', parseFloat(e.target.value))
  }

  const handleVoiceRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSetting('voiceRate', parseFloat(e.target.value))
  }

  const handleVoicePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSetting('voicePitch', parseFloat(e.target.value))
  }

  const handleTestVoice = () => {
    playClick()
    if (synthesisAvailable && !isSpeaking) {
      speak('1, 2, 3, 4, 5', {
        rate: settings.voiceRate,
        pitch: settings.voicePitch,
        volume: settings.voiceVolume
      })
    }
  }

  const paceOptions = [
    { value: 1, label: '1s' },
    { value: 2, label: '2s' },
    { value: 3, label: '3s' },
    { value: 4, label: '4s' },
    { value: 5, label: '5s' },
  ]

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
        <h2 className="settings-section-title">Voice Assistance</h2>

        {!synthesisAvailable && (
          <div className="compatibility-warning">
            Voice features are not supported in this browser.
          </div>
        )}

        {synthesisAvailable && (
          <>
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">
                  Voice Counting
                  {synthesisAvailable && <span className="availability-badge available">Available</span>}
                </span>
                <span className="setting-description">Count reps out loud during exercises</span>
              </div>
              <button
                className={`toggle-btn ${settings.voiceCountingEnabled ? 'active' : ''}`}
                onClick={() => handleVoiceToggle('voiceCountingEnabled')}
                aria-pressed={settings.voiceCountingEnabled}
                aria-label={settings.voiceCountingEnabled ? 'Disable voice counting' : 'Enable voice counting'}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">
                  Voice Commands
                  {recognitionAvailable ? (
                    <span className="availability-badge available">Available</span>
                  ) : (
                    <span className="availability-badge unavailable">Not available</span>
                  )}
                </span>
                <span className="setting-description">
                  Control the app with voice commands
                  {!recognitionAvailable && ' (Chrome/Edge only, not iOS)'}
                </span>
              </div>
              <button
                className={`toggle-btn ${settings.voiceCommandsEnabled ? 'active' : ''}`}
                onClick={() => handleVoiceToggle('voiceCommandsEnabled')}
                disabled={!recognitionAvailable}
                aria-pressed={settings.voiceCommandsEnabled}
                aria-label={settings.voiceCommandsEnabled ? 'Disable voice commands' : 'Enable voice commands'}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-item stacked">
              <div className="setting-info">
                <span className="setting-label">Counting Pace</span>
                <span className="setting-description">Time between each counted rep</span>
              </div>
              <div className="pace-options">
                {paceOptions.map(option => (
                  <button
                    key={option.value}
                    className={`pace-btn ${settings.voiceCountingPace === option.value ? 'selected' : ''}`}
                    onClick={() => handleVoicePaceChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Auto-start Voice Counting</span>
                <span className="setting-description">Begin counting when activity starts</span>
              </div>
              <button
                className={`toggle-btn ${settings.autoStartVoiceCounting ? 'active' : ''}`}
                onClick={() => handleVoiceToggle('autoStartVoiceCounting')}
                aria-pressed={settings.autoStartVoiceCounting}
                aria-label={settings.autoStartVoiceCounting ? 'Disable auto-start' : 'Enable auto-start'}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-item stacked">
              <div className="setting-info">
                <span className="setting-label">Voice Volume</span>
                <span className="setting-description">{Math.round(settings.voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                className="voice-slider"
                min="0"
                max="1"
                step="0.1"
                value={settings.voiceVolume}
                onChange={handleVoiceVolumeChange}
                aria-label="Voice volume"
              />
            </div>

            <div className="setting-item stacked">
              <div className="setting-info">
                <span className="setting-label">Voice Speed</span>
                <span className="setting-description">{settings.voiceRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                className="voice-slider"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceRate}
                onChange={handleVoiceRateChange}
                aria-label="Voice speed"
              />
            </div>

            <div className="setting-item stacked">
              <div className="setting-info">
                <span className="setting-label">Voice Pitch</span>
                <span className="setting-description">{settings.voicePitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                className="voice-slider"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voicePitch}
                onChange={handleVoicePitchChange}
                aria-label="Voice pitch"
              />
            </div>

            <button
              className="test-voice-btn"
              onClick={handleTestVoice}
              disabled={!synthesisAvailable || isSpeaking}
            >
              {isSpeaking ? 'Speaking...' : 'Test Voice'}
            </button>
          </>
        )}
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
