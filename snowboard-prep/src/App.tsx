import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Complete from './pages/Complete'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity/:activityIndex" element={<Activity />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
