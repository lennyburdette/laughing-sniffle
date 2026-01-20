import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import OverallTimer from './components/OverallTimer'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Complete from './pages/Complete'
import './App.css'

function App() {
  return (
    <TimerProvider>
      <BrowserRouter>
        <OverallTimer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activity/:activityIndex" element={<Activity />} />
          <Route path="/complete" element={<Complete />} />
        </Routes>
      </BrowserRouter>
    </TimerProvider>
  )
}

export default App
