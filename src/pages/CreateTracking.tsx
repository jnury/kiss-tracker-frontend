import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function CreateTracking() {
  // Generate default ETA (now + 1 hour)
  const getDefaultEta = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  }

  const [formData, setFormData] = useState({
    kissProvider: '',
    destination: '',
    eta: getDefaultEta()
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      alert('Error creating tracking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">😘</div>
        <h1 className="title">Create Kiss Delivery</h1>
        <p className="subtitle">Set up tracking for your romantic journey</p>
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
              {loading ? '💫 Creating...' : '💌 Create Tracking'}
            </button>
          </div>
        </form>
      </div>

      <div className="button-center" style={{ marginTop: '2rem' }}>
        <button className="button button-secondary" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default CreateTracking