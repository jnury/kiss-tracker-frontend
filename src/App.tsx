import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreateTracking from './pages/CreateTracking'
import TrackingPage from './pages/TrackingPage'
import UpdateTracking from './pages/UpdateTracking'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateTracking />} />
        <Route path="/track/:trackingNumber" element={<TrackingPage />} />
        <Route path="/update/:trackingNumber" element={<UpdateTracking />} />
      </Routes>
    </div>
  )
}

export default App