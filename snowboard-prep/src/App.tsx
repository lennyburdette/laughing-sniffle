import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import { WorkoutProvider } from './context/WorkoutContext'
import { SoundProvider } from './context/SoundContext'
import { WakeLockProvider } from './context/WakeLockContext'
import { OfflineProvider } from './context/OfflineContext'
import OverallTimer from './components/OverallTimer'
import OfflineIndicator from './components/OfflineIndicator'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Complete from './pages/Complete'
import './App.css'

function App() {
  return (
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
                </Routes>
              </BrowserRouter>
            </WorkoutProvider>
          </TimerProvider>
        </SoundProvider>
      </WakeLockProvider>
    </OfflineProvider>
  )
}

export default App
