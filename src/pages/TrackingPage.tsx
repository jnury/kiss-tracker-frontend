import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

interface TrackingData {
  trackingNumber: string
  kissProvider: string
  destination: string
  eta: string
  status: string
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
  const [currentTime, setCurrentTime] = useState(new Date())
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

  // SSE connection for real-time updates
  useEffect(() => {
    if (!trackingNumber || loading || error) return

    let eventSource: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null
    let isConnected = false

    const connect = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      eventSource = new EventSource(`${apiUrl}/api/tracking/${trackingNumber}/events`)
      
      console.log('📡 Connecting to SSE for tracking:', trackingNumber)
      
      eventSource.addEventListener('connected', (event) => {
        console.log('📡 SSE connected:', JSON.parse(event.data))
        isConnected = true
      })
      
      eventSource.addEventListener('location-update', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 Location update:', data)
        
        setTrackingData(prev => {
          if (!prev) return prev
          const newRecord = {
            id: data.recordId.toString(),
            location: data.location,
            timestamp: data.timestamp
          }
          return {
            ...prev,
            trackRecords: [newRecord, ...prev.trackRecords]
          }
        })
      })
      
      eventSource.addEventListener('status-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 Status update:', data)
        setTrackingData(prev => prev ? { ...prev, status: data.status } : prev)
      })
      
      eventSource.addEventListener('eta-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 ETA update:', data)
        setTrackingData(prev => prev ? { ...prev, eta: data.eta } : prev)
      })
      
      eventSource.addEventListener('destination-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 Destination update:', data)
        setTrackingData(prev => prev ? { ...prev, destination: data.destination } : prev)
      })
      
      eventSource.addEventListener('delivery-removed', (event) => {
        console.log('📡 Delivery records removed')
        setTrackingData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            trackRecords: prev.trackRecords.filter(record => record.location !== 'Delivered')
          }
        })
      })
      
      eventSource.onerror = (error) => {
        console.error('📡 SSE error:', error)
        isConnected = false
        
        // Auto-reconnect after 5 seconds
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            console.log('📡 Attempting SSE reconnection...')
            eventSource?.close()
            reconnectTimer = null
            connect()
          }, 5000)
        }
      }
    }

    connect()

    return () => {
      console.log('📡 Closing SSE connection')
      isConnected = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      eventSource?.close()
    }
  }, [trackingNumber, loading, error])

  // Timer to update remaining time display every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

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

  const formatTimeRemaining = (etaString: string) => {
    const now = currentTime
    const eta = new Date(etaString)
    const diffMs = eta.getTime() - now.getTime()
    
    const absDiffMs = Math.abs(diffMs)
    const diffMinutes = Math.floor(absDiffMs / (1000 * 60))
    const diffHours = Math.floor(absDiffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24))
    const isPast = diffMs <= 0
    
    if (diffMinutes < 60) {
      const timeText = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
      return { text: isPast ? `${timeText} late` : `in ${timeText}`, isPast }
    } else if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60
      const hourText = `${diffHours}h`
      const minuteText = remainingMinutes > 0 ? `${remainingMinutes.toString().padStart(2, '0')}` : '00'
      const timeText = `${hourText}${minuteText}`
      return { text: isPast ? `${timeText} late` : `in ${timeText}`, isPast }
    } else {
      const remainingHours = diffHours % 24
      const dayText = `${diffDays} day${diffDays !== 1 ? 's' : ''}`
      const hourText = remainingHours > 0 ? ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''
      const timeText = `${dayText}${hourText}`
      return { text: isPast ? `${timeText} late` : `in ${timeText}`, isPast }
    }
  }

  const getStatusIcon = (index: number, location?: string, isFirstStep?: boolean) => {
    if (location === 'Delivered') {
      return '🥳'
    }
    if (isFirstStep) {
      return '🚀'
    }
    const icons = ['💘', '💖', '💝', '💕', '💞', '💗', '💓']
    return icons[index % icons.length]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Preparing': return '#6b7280'
      case 'In Transit': return '#1e40af'
      case 'Out for Delivery': return '#3b82f6'
      case 'Delivered': return '#10b981'
      case 'Delayed': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className="container">
      <h1 className="title" style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5em' }}>Kiss Tracking</h1>

      <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem', minWidth: '320px' }}>
        <div className="tracking-info" style={{ marginBottom: '0', gap: '0.5rem' }}>
          <div className="info-item">
            <span className="info-label">Tracking Number</span>
            <span className="info-value" style={{ fontWeight: 'bold' }}>#{trackingData.trackingNumber}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Kiss Provider</span>
            <span className="info-value" style={{ fontWeight: 'bold' }}>{trackingData.kissProvider}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Destination</span>
            <span className="info-value" style={{ fontWeight: 'bold' }}>{trackingData.destination}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status</span>
            <span className="info-value" style={{ 
              color: getStatusColor(trackingData.status || 'Preparing'),
              fontWeight: 'bold'
            }}>
              {trackingData.status || 'Preparing'}
            </span>
          </div>
        </div>
      </div>

      {trackingData.status !== 'Delivered' && (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem', minWidth: '320px' }}>
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5em', color: '#4a5568' }}>
            Expected Arrival
          </h2>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6b9d, #ff8fab)', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: formatTimeRemaining(trackingData.eta).isPast ? '#dc2626' : '#fff'
            }}>
              {formatTimeRemaining(trackingData.eta).text}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>
              {new Date(trackingData.eta).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })} at {new Date(trackingData.eta).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem', minWidth: '320px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5em', color: '#4a5568' }}>Delivery Progress</h2>
        {trackingData.trackRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔄</div>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>No updates yet. Your kiss delivery will begin soon!</p>
          </div>
        ) : (
          <div className="timeline" style={{ marginTop: '1rem' }}>
            {trackingData.trackRecords
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((record, index, sortedArray) => {
                const isFirstStep = index === sortedArray.length - 1;
                return (
                <div key={record.id} className="timeline-item">
                  <div className="timeline-dot">
                    {getStatusIcon(index, record.location, isFirstStep)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-location" style={{ fontSize: '1.3em', fontWeight: '500' }}>{record.location}</div>
                    <div className="timeline-time" style={{ fontSize: '0.8em' }}>{formatDateTime(record.timestamp)}</div>
                  </div>
                </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="button-center" style={{ marginTop: '1rem' }}>
        <button 
          className="button" 
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            fontWeight: 'bold'
          }}
          onClick={() => navigate('/')}
        >
          Track Another Kiss
        </button>
      </div>
    </div>
  )
}

export default TrackingPage