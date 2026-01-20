import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import { WorkoutProvider } from './context/WorkoutContext'
import { SoundProvider } from './context/SoundContext'
import { WakeLockProvider } from './context/WakeLockContext'
import { OfflineProvider } from './context/OfflineContext'
import { SettingsProvider } from './context/SettingsContext'
import OverallTimer from './components/OverallTimer'
import OfflineIndicator from './components/OfflineIndicator'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Complete from './pages/Complete'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <SettingsProvider>
      <OfflineProvider>
        <WakeLockProvider>
          <SoundProvider>
            <TimerProvider>
              <WorkoutProvider>
                <BrowserRouter>
                  <OfflineIndicator />
                  <OverallTimer />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/activity/:activityIndex" element={<Activity />} />
                    <Route path="/complete" element={<Complete />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </BrowserRouter>
              </WorkoutProvider>
            </TimerProvider>
          </SoundProvider>
        </WakeLockProvider>
      </OfflineProvider>
    </SettingsProvider>
  )
}

export default App
