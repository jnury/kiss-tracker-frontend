import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrackingCard from '../components/TrackingCard';
import { trackingStorage, SavedTracking } from '../services/trackingStorage';
import { useToast } from '../components/Toast';

interface BatchTrackingData {
  trackingNumber: string;
  kissProvider: string;
  destination: string;
  eta: string | null;
  status: string;
  recordCount: number;
  lastUpdate: string;
  error?: string;
}

const MyTrackings: React.FC = () => {
  const [savedTrackings, setSavedTrackings] = useState<SavedTracking[]>([]);
  const [trackingData, setTrackingData] = useState<BatchTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    trackingNumber: '',
    updateKey: ''
  });
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadSavedTrackings();
  }, []);

  const loadSavedTrackings = async () => {
    try {
      setLoading(true);
      const saved = trackingStorage.getSavedTrackings();

      // Filter out any trackings with invalid data before processing
      const validSaved = saved.filter(tracking => {
        const isValid = tracking &&
                       tracking.trackingNumber &&
                       typeof tracking.trackingNumber === 'string' &&
                       tracking.updateKey &&
                       typeof tracking.updateKey === 'string';

        if (!isValid) {
          console.warn('Found invalid tracking in localStorage:', tracking);
        }

        return isValid;
      });

      // If we filtered out invalid trackings, clean up localStorage
      if (validSaved.length !== saved.length) {
        console.log('Cleaning up invalid trackings from localStorage');
        // Clear and re-save only valid trackings
        trackingStorage.clearAllTrackings();
        validSaved.forEach(tracking => {
          trackingStorage.saveTracking(tracking);
        });
      }

      setSavedTrackings(validSaved);

      if (validSaved.length === 0) {
        setLoading(false);
        return;
      }

      const batchRequest = validSaved.map(t => ({
        trackingNumber: t.trackingNumber,
        updateKey: t.updateKey
      }));

      const response = await axios.post(`${API_URL}/api/tracking/batch`, {
        trackings: batchRequest
      });

      // Filter out any trackings with errors and validate dates
      const validTrackings: BatchTrackingData[] = [];
      const invalidTrackingNumbers: string[] = [];

      response.data.trackings.forEach((tracking: BatchTrackingData) => {
        if (tracking.error) {
          console.warn(`Tracking ${tracking.trackingNumber} has error:`, tracking.error);
          invalidTrackingNumbers.push(tracking.trackingNumber);
          return;
        }

        // Validate lastUpdate date
        const lastUpdateDate = new Date(tracking.lastUpdate);
        if (isNaN(lastUpdateDate.getTime())) {
          console.warn(`Tracking ${tracking.trackingNumber} has invalid lastUpdate:`, tracking.lastUpdate);
          tracking.lastUpdate = new Date().toISOString(); // Fallback to current time
        }

        validTrackings.push(tracking);
      });

      // Remove invalid trackings from localStorage
      if (invalidTrackingNumbers.length > 0) {
        console.log('Removing invalid trackings from localStorage:', invalidTrackingNumbers);
        invalidTrackingNumbers.forEach(trackingNumber => {
          trackingStorage.removeTracking(trackingNumber);
        });

        // Update saved trackings state to reflect removals
        setSavedTrackings(prev =>
          prev.filter(t => !invalidTrackingNumbers.includes(t.trackingNumber))
        );

        if (invalidTrackingNumbers.length === 1) {
          showToast('Removed 1 invalid tracking from your list', 'success');
        } else {
          showToast(`Removed ${invalidTrackingNumbers.length} invalid trackings from your list`, 'success');
        }
      }

      setTrackingData(validTrackings);
    } catch (error) {
      console.error('Error loading trackings:', error);
      showToast('Failed to load tracking data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTracking = (trackingNumber: string) => {
    trackingStorage.removeTracking(trackingNumber);
    setSavedTrackings(prev => prev.filter(t => t.trackingNumber !== trackingNumber));
    setTrackingData(prev => prev.filter(t => t.trackingNumber !== trackingNumber));
    showToast('Tracking removed from list', 'success');
  };

  const handleViewTracking = (trackingNumber: string) => {
    trackingStorage.updateLastViewed(trackingNumber);
    navigate(`/track/${trackingNumber}`);
  };

  const handleEditTracking = (trackingNumber: string) => {
    const savedTrackings = trackingStorage.getSavedTrackings();
    const tracking = savedTrackings.find(t => t.trackingNumber === trackingNumber);
    if (tracking) {
      navigate(`/update/${trackingNumber}?key=${tracking.updateKey}`);
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addFormData.trackingNumber.trim() || !addFormData.updateKey.trim()) {
      showToast('Please enter both tracking number and update key', 'error');
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/tracking/${addFormData.trackingNumber}/update?key=${addFormData.updateKey}`
      );

      trackingStorage.addTrackingFromData(response.data, addFormData.updateKey);
      showToast('Tracking added to your list', 'success');

      setAddFormData({ trackingNumber: '', updateKey: '' });
      setShowAddForm(false);

      await loadSavedTrackings();
    } catch (error) {
      console.error('Error adding tracking:', error);
      showToast('Failed to add tracking. Check your tracking number and update key.', 'error');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all trackings from your list?')) {
      trackingStorage.clearAllTrackings();
      setSavedTrackings([]);
      setTrackingData([]);
      showToast('All trackings cleared', 'success');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💫</div>
          <p>Loading your trackings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title" style={{ textAlign: 'center' }}>My Trackings</h1>
      </div>


      {/* Add Tracking Form */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', margin: 0 }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.5rem', color: '#333' }}>
              Add Existing Tracking
            </h2>
            <form onSubmit={handleAddTracking}>
              <div className="input-group">
                <label className="label">Tracking Number</label>
                <input
                  type="text"
                  value={addFormData.trackingNumber}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="input"
                  placeholder="Enter tracking number"
                  required
                />
              </div>
              <div className="input-group">
                <label className="label">Update Key</label>
                <input
                  type="text"
                  value={addFormData.updateKey}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, updateKey: e.target.value }))}
                  className="input"
                  placeholder="Enter update key from your email/SMS"
                  required
                />
              </div>
              <div className="button-center">
                <button type="submit" className="button" style={{ marginRight: '1rem' }}>
                  Add Tracking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddFormData({ trackingNumber: '', updateKey: '' });
                  }}
                  className="button"
                  style={{
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trackings Display */}
      {savedTrackings.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#333' }}>No trackings yet</h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              Create a new tracking or add an existing one to get started
            </p>
            <div className="button-center">
              <button
                onClick={() => navigate('/create')}
                className="button"
                style={{ marginRight: '1rem' }}
              >
                Create New Tracking
              </button>
            </div>
          </div>
        </div>
      ) : (
        trackingData.map((tracking) => (
          <TrackingCard
            key={tracking.trackingNumber}
            trackingNumber={tracking.trackingNumber}
            kissProvider={tracking.kissProvider}
            destination={tracking.destination}
            eta={tracking.eta}
            status={tracking.status}
            recordCount={tracking.recordCount}
            lastUpdate={tracking.lastUpdate}
            onRemove={handleRemoveTracking}
            onView={handleViewTracking}
            onEdit={handleEditTracking}
          />
        ))
      )}

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
  );
};

export default MyTrackings;