import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const navigate = useNavigate()
  
  // Randomly select a logo from available logos
  const getRandomLogo = () => {
    const logos = ['logo_01.png', 'logo_02.png', 'logo_03.png', 'logo_04.png', 'logo_05.png', 'logo_06.png', 'logo_07.png', 'logo_08.png']
    const randomIndex = Math.floor(Math.random() * logos.length)
    return `/medias/${logos[randomIndex]}`
  }
  
  const [logoSrc] = useState(getRandomLogo())

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      navigate(`/track/${trackingNumber.trim()}`)
    }
  }

  const handleCreateNew = () => {
    navigate('/create')
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <img src={logoSrc} alt="Kiss Tracker" style={{ height: '150px' }} />
        </div>
        <h1 className="title">Kiss Tracker</h1>
        <p className="subtitle">Track your love delivery with romantic precision</p>
      </div>

      <div className="card">
        <form onSubmit={handleTrack}>
          <div className="input-group">
            <label className="label">Enter Tracking Number</label>
            <input
              type="text"
              className="input"
              placeholder="Enter your kiss tracking number..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="button-center">
            <button type="submit" className="button">
              💕 Track My Kiss
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          Planning a Kiss Delivery?
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Let your special someone track your journey to them
        </p>
        <div className="button-center">
          <button className="button button-secondary" onClick={handleCreateNew}>
            💌 Create New Tracking
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage