import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { trackingStorage } from '../services/trackingStorage';

interface TrackingCardProps {
  trackingNumber: string;
  kissProvider: string;
  destination: string;
  eta: string | null;
  status: string;
  recordCount: number;
  lastUpdate: string;
  onRemove?: (trackingNumber: string) => void;
  onView: (trackingNumber: string) => void;
  onEdit?: (trackingNumber: string) => void;
}

const TrackingCard: React.FC<TrackingCardProps> = ({
  trackingNumber,
  kissProvider,
  destination,
  eta,
  status,
  recordCount,
  lastUpdate,
  onRemove,
  onView,
  onEdit
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { backgroundColor: '#10b981', color: 'white' };
      case 'In Transit':
        return { backgroundColor: '#3b82f6', color: 'white' };
      case 'Out for Delivery':
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'Delayed':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const formatEta = (eta: string | null) => {
    if (!eta) return 'No ETA';
    try {
      const etaDate = new Date(eta);
      const now = new Date();

      // Check if the date is valid
      if (isNaN(etaDate.getTime())) {
        return 'Invalid ETA';
      }

      if (etaDate < now) {
        return `${formatDistanceToNow(etaDate)} ago`;
      } else {
        return `in ${formatDistanceToNow(etaDate)}`;
      }
    } catch {
      return 'Invalid ETA';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(trackingNumber);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(trackingNumber);
    }
  };

  return (
    <div
      className="card"
      style={{
        transition: 'transform 0.2s ease',
        position: 'relative',
        minWidth: '320px',
        padding: '0.75rem',
        marginBottom: '0.75rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{
          fontSize: '1.4rem',
          color: '#333',
          fontWeight: 'bold'
        }}>
          #{trackingNumber}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          ...getStatusStyle(status)
        }}>
          {status}
        </div>
      </div>

      <div className="tracking-info" style={{ marginBottom: '1.5rem' }}>
        <div className="info-item">
          <span className="info-label">Destination</span>
          <span className="info-value">{destination}</span>
        </div>

        <div className="info-item">
          <span className="info-label">ETA</span>
          <span className="info-value">{formatEta(eta)}</span>
        </div>
      </div>

      <div style={{
        paddingTop: '1rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        {onEdit && (
          <button
            onClick={handleEdit}
            className="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            Edit
          </button>
        )}
        {onRemove && (
          <button
            onClick={handleRemove}
            className="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackingCard;