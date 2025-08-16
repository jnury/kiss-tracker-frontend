import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

interface TrackingData {
  trackingNumber: string
  kissProvider: string
  destination: string
  eta: string
  trackRecords: {
    id: string
    location: string
    timestamp: string
  }[]
}

function TrackingPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}`)
        setTrackingData(response.data)
      } catch (error) {
        setError('Tracking number not found')
      } finally {
        setLoading(false)
      }
    }

    if (trackingNumber) {
      fetchTrackingData()
    }
  }, [trackingNumber])

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💫</div>
          <p>Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2>Tracking Not Found</h2>
          <p>Sorry, we couldn't find tracking information for this number.</p>
          <div className="button-center">
            <button className="button" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (index: number) => {
    const icons = ['🚀', '🛣️', '🏃‍♂️', '🎯', '💕']
    return icons[index % icons.length]
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">😘</div>
        <h1 className="title">Kiss Tracking</h1>
        <p className="subtitle">#{trackingData.trackingNumber}</p>
      </div>

      <div className="card">
        <div className="tracking-info">
          <div className="info-item">
            <span className="info-label">Kiss Provider</span>
            <span className="info-value">{trackingData.kissProvider}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Destination</span>
            <span className="info-value">{trackingData.destination}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Expected Arrival</span>
            <span className="info-value">{formatDateTime(trackingData.eta)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>📍 Delivery Progress</h2>
        {trackingData.trackRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <p>No updates yet. Your kiss delivery will begin soon!</p>
          </div>
        ) : (
          <div className="timeline">
            {trackingData.trackRecords.map((record, index) => (
              <div key={record.id} className="timeline-item">
                <div className="timeline-dot">
                  {getStatusIcon(index)}
                </div>
                <div className="timeline-content">
                  <div className="timeline-location">{record.location}</div>
                  <div className="timeline-time">{formatDateTime(record.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="button-center">
        <button className="button button-secondary" onClick={() => navigate('/')}>
          ← Track Another Kiss
        </button>
      </div>
    </div>
  )
}

export default TrackingPage