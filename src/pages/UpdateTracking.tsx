import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../components/Toast'

interface TrackingData {
  trackingNumber: string
  kissProvider: string
  destination: string
  eta: string
  shareLink: string
  updateLink: string
}

function UpdateTracking() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>()
  const [searchParams] = useSearchParams()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [currentLocation, setCurrentLocation] = useState('')
  const [newEta, setNewEta] = useState('')
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
  
  // Convert ISO string to datetime-local format
  const formatDateForInput = (isoString: string) => {
    const date = new Date(isoString)
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

  const handleUpdateEta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEta) return

    setUpdating(true)
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking/${trackingNumber}/eta?key=${updateKey}`, {
        eta: newEta
      })
      setTrackingData(prev => prev ? { ...prev, eta: newEta } : null)
      showToast('ETA updated successfully! ⏰')
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
        <div className="logo">😘</div>
        <h1 className="title">Update Kiss Delivery</h1>
        <p className="subtitle">#{trackingData.trackingNumber}</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>📤 Share with Your Special Someone</h2>
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

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>📍 Add Current Location</h2>
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
              {updating ? '📍 Updating...' : '📍 Update Location'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>⏰ Update ETA</h2>
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
              {updating ? '⏰ Updating...' : '⏰ Update ETA'}
            </button>
          </div>
        </form>
      </div>

      <div className="button-center" style={{ gap: '1rem' }}>
        <button 
          className="button button-secondary" 
          onClick={() => navigate(`/track/${trackingNumber}`)}
        >
          👀 View Tracking Page
        </button>
        <button className="button button-secondary" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
      {ToastComponent}
    </div>
  )
}

export default UpdateTracking