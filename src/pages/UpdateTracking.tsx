import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../components/Toast'

interface TrackingData {
  trackingNumber: string
  kissProvider: string
  destination: string
  eta: string
  status: string
  shareLink: string
  updateLink: string
}

function UpdateTracking() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>()
  const [searchParams] = useSearchParams()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [currentLocation, setCurrentLocation] = useState('')
  const [newEta, setNewEta] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()
  
  const updateKey = searchParams.get('key')

  // Generate default ETA (now + 1 hour) for updates
  const getDefaultEta = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    // Format for datetime-local input using local timezone
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  // Convert UTC ISO string to datetime-local format (local timezone)
  const formatDateForInput = (utcIsoString: string) => {
    const date = new Date(utcIsoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!updateKey) {
        setError('Update key is required to access this page')
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/update?key=${updateKey}`)
        setTrackingData(response.data)
        // Use existing ETA (converted to local format) or default to now + 1 hour
        setNewEta(response.data.eta ? formatDateForInput(response.data.eta) : getDefaultEta())
        setNewStatus(response.data.status || 'Preparing')
      } catch (error: any) {
        console.error('Error fetching tracking data:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError('Invalid or missing update key. You need the correct update link to access this page.')
        } else {
          setError('Error loading tracking data')
        }
      } finally {
        setLoading(false)
      }
    }

    if (trackingNumber) {
      fetchTrackingData()
    }
  }, [trackingNumber, updateKey])

  // SSE connection for real-time updates  
  useEffect(() => {
    if (!trackingNumber || loading || error) return

    let eventSource: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null
    let isConnected = false

    const connect = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      eventSource = new EventSource(`${apiUrl}/api/tracking/${trackingNumber}/events`)
      
      console.log('📡 Update page connecting to SSE for tracking:', trackingNumber)
      
      eventSource.addEventListener('connected', (event) => {
        console.log('📡 SSE connected on update page:', JSON.parse(event.data))
        isConnected = true
      })
      
      eventSource.addEventListener('status-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 Status update received:', data)
        setTrackingData(prev => prev ? { ...prev, status: data.status } : prev)
        setNewStatus(data.status)
      })
      
      eventSource.addEventListener('eta-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 ETA update received:', data)
        setTrackingData(prev => prev ? { ...prev, eta: data.eta } : prev)
        setNewEta(formatDateForInput(data.eta))
      })
      
      eventSource.addEventListener('destination-change', (event) => {
        const data = JSON.parse(event.data)
        console.log('📡 Destination update received:', data)
        setTrackingData(prev => prev ? { ...prev, destination: data.destination } : prev)
      })
      
      eventSource.addEventListener('delivery-removed', (event) => {
        console.log('📡 Delivery records removed on update page')
        setTrackingData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            trackRecords: prev.trackRecords?.filter(record => record.location !== 'Delivered') || []
          }
        })
      })
      
      eventSource.onerror = (error) => {
        console.error('📡 SSE error on update page:', error)
        isConnected = false
        
        // Auto-reconnect after 5 seconds
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            console.log('📡 Attempting SSE reconnection on update page...')
            eventSource?.close()
            reconnectTimer = null
            connect()
          }, 5000)
        }
      }
    }

    connect()

    return () => {
      console.log('📡 Closing SSE connection from update page')
      isConnected = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      eventSource?.close()
    }
  }, [trackingNumber, loading, error])

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLocation.trim()) return

    setUpdating(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/location?key=${updateKey}`, {
        location: currentLocation.trim()
      })
      setCurrentLocation('')
      showToast('Location updated successfully! 📍')
    } catch (error: any) {
      console.error('Error updating location:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('Authentication error. Please use the correct update link.')
      } else {
        showToast('Error updating location. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  // Convert datetime-local to UTC ISO string
  const convertToUTC = (datetimeLocal: string) => {
    const localDate = new Date(datetimeLocal)
    return localDate.toISOString()
  }

  const handleUpdateEta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEta) return

    setUpdating(true)
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/eta?key=${updateKey}`, {
        eta: convertToUTC(newEta)
      })
      setTrackingData(prev => prev ? { ...prev, eta: convertToUTC(newEta) } : null)
      showToast('ETA updated successfully!')
    } catch (error: any) {
      console.error('Error updating ETA:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('Authentication error. Please use the correct update link.')
      } else {
        showToast('Error updating ETA. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingData) return

    setUpdating(true)
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/destination?key=${updateKey}`, {
        destination: trackingData.destination
      })
      showToast('Destination updated successfully!')
    } catch (error: any) {
      console.error('Error updating destination:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('Authentication error. Please use the correct update link.')
      } else {
        showToast('Error updating destination. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) return

    setUpdating(true)
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/status?key=${updateKey}`, {
        status: newStatus
      })
      setTrackingData(prev => prev ? { ...prev, status: newStatus } : null)
      showToast('Status updated successfully!')
    } catch (error: any) {
      console.error('Error updating status:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('Authentication error. Please use the correct update link.')
      } else {
        showToast('Error updating status. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  const copyShareLink = () => {
    if (trackingData?.shareLink) {
      navigator.clipboard.writeText(trackingData.shareLink)
      showToast('Share link copied to clipboard! 📋')
    }
  }

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

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2>Access Denied</h2>
          <p style={{ marginBottom: '2rem' }}>{error}</p>
          <div className="button-center">
            <button className="button" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!trackingData) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2>Tracking Not Found</h2>
          <div className="button-center">
            <button className="button" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title" style={{ textAlign: 'center' }}>Update Kiss Delivery</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>#{trackingData.trackingNumber}</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Share with Your Special Someone</h2>
        <div className="share-link">
          <p><strong>Public tracking link</strong> (for your recipient):</p>
          <div className="share-url" onClick={copyShareLink} style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ flex: 1, paddingRight: '0.5rem' }}>{trackingData.shareLink}</span>
            <span style={{ fontSize: '1.1rem', opacity: '0.6' }}>⎘</span>
          </div>
          
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e1e1e1' }} />
          
          <p><strong>Private update link</strong> (keep this secret!):</p>
          <div className="share-url" onClick={() => {
            navigator.clipboard.writeText(trackingData.updateLink)
            showToast('Private update link copied! 🔒')
          }} style={{ fontSize: '0.8rem', color: '#666', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ flex: 1, paddingRight: '0.5rem' }}>{trackingData.updateLink}</span>
            <span style={{ fontSize: '1.1rem', opacity: '0.6' }}>⎘</span>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem', fontStyle: 'italic' }}>
            💡 Share only the public link with your recipient. Keep the update link private!
          </p>
        </div>
      </div>

      {trackingData.status !== 'Delivered' && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Add Current Location</h2>
          <form onSubmit={handleAddLocation}>
            <div className="input-group">
              <input
                type="text"
                className="input"
                placeholder="Where are you right now? (e.g., Just left the coffee shop)"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
              />
            </div>
            <div className="button-center">
              <button type="submit" className="button" disabled={updating}>
                {updating ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Update Status</h2>
        <form onSubmit={handleUpdateStatus}>
          <div className="input-group">
            <select
              className="input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              <option value="Preparing">Preparing</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div className="button-center">
            <button type="submit" className="button" disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>

      {trackingData.status !== 'Delivered' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Update Destination</h2>
          <form onSubmit={handleUpdateDestination}>
            <div className="input-group">
              <input
                type="text"
                className="input"
                placeholder="New destination"
                value={trackingData.destination}
                onChange={(e) => setTrackingData(prev => prev ? { ...prev, destination: e.target.value } : null)}
              />
            </div>
            <div className="button-center">
              <button type="submit" className="button" disabled={updating}>
                {updating ? 'Updating...' : 'Update Destination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {trackingData.status !== 'Delivered' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Update ETA</h2>
          <form onSubmit={handleUpdateEta}>
            <div className="input-group">
              <input
                type="datetime-local"
                className="input"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
              />
            </div>
            <div className="button-center">
              <button type="submit" className="button" disabled={updating}>
                {updating ? 'Updating...' : 'Update ETA'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="button-center" style={{ gap: '1rem' }}>
        <button 
          className="button" 
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            fontWeight: 'bold'
          }}
          onClick={() => navigate(`/track/${trackingNumber}`)}
        >
          View Tracking Page
        </button>
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
          Back to Home
        </button>
      </div>
      {ToastComponent}
    </div>
  )
}

export default UpdateTracking