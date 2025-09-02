import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../components/Toast'

function CreateTracking() {
  // Generate default ETA (now + 1 hour)
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

  const [formData, setFormData] = useState({
    kissProvider: '',
    destination: '',
    eta: getDefaultEta()
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tracking`, formData)
      // Extract the update key from the updateLink URL
      const updateLink = response.data.updateLink
      const urlParams = new URLSearchParams(updateLink.split('?')[1])
      const updateKey = urlParams.get('key')
      navigate(`/update/${response.data.trackingNumber}?key=${updateKey}`)
    } catch (error) {
      console.error('Error creating tracking:', error)
      showToast('Error creating tracking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title" style={{ textAlign: 'center' }}>Create Kiss Delivery</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>Set up tracking for your romantic journey</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">Kiss Provider Name</label>
            <input
              type="text"
              name="kissProvider"
              className="input"
              placeholder="Your name (who's delivering the kiss)"
              value={formData.kissProvider}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="label">Destination</label>
            <input
              type="text"
              name="destination"
              className="input"
              placeholder="Where are you going? (e.g., Sarah's house)"
              value={formData.destination}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="label">Estimated Time of Arrival</label>
            <input
              type="datetime-local"
              name="eta"
              className="input"
              value={formData.eta}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="button-center">
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tracking'}
            </button>
          </div>
        </form>
      </div>

      <div className="button-center" style={{ marginTop: '2rem' }}>
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

export default CreateTracking