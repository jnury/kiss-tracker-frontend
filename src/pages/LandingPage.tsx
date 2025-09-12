import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { config } from '../config'

function LandingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const navigate = useNavigate()
  
  // Randomly select a logo from available logos
  const getRandomLogo = () => {
    const logoNumbers = [1, 2, 3, 4, 5, 6, 7, 8]
    const randomIndex = Math.floor(Math.random() * logoNumbers.length)
    return `/logo_0${logoNumbers[randomIndex]}.png`
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
      <Helmet>
        <title>Kiss Tracker - Romantic Delivery Tracking</title>
        <meta name="description" content="Track your love delivery with romantic precision. Create and track kiss deliveries in real time with Kiss Tracker." />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Kiss Tracker" />
        <meta property="og:description" content="Track your love delivery with romantic precision. Create and track kiss deliveries in real time with Kiss Tracker." />
        <meta property="og:image" content="/logo_01.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : '/'} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Kiss Tracker" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kiss Tracker" />
        <meta name="twitter:description" content="Track your love delivery with romantic precision. Create and track kiss deliveries in real time with Kiss Tracker." />
        <meta name="twitter:image" content="/logo_01.png" />
      </Helmet>

      <div className="header">
        <div className="logo">
          <img src={logoSrc} alt="Kiss Tracker" style={{ height: '150px' }} />
        </div>
        <h1 className="title">Kiss Tracker</h1>
        <p className="subtitle">Track your love delivery with romantic precision</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          Enter Tracking Number
        </h2>
        <form onSubmit={handleTrack}>
          <div className="input-group">
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
              Track My Kiss
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
          <button className="button" onClick={handleCreateNew}>
            Create New Tracking
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage