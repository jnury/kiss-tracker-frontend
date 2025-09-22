interface SavedTracking {
  trackingNumber: string;
  updateKey: string;
  destination: string;
  kissProvider: string;
  createdAt: string;
  lastViewedAt: string;
}

interface TrackingData {
  id: string;
  tracking_number: string;
  kiss_provider: string;
  destination: string;
  eta: string | null;
  created_at: string;
  updated_at: string;
}

class TrackingStorage {
  private readonly STORAGE_KEY = 'myTrackings';

  getSavedTrackings(): SavedTracking[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        console.warn('Invalid trackings data in localStorage, resetting');
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }

      // Filter out any invalid entries
      const validTrackings = parsed.filter(tracking =>
        tracking &&
        tracking.trackingNumber &&
        typeof tracking.trackingNumber === 'string' &&
        tracking.updateKey &&
        typeof tracking.updateKey === 'string'
      );

      // If we filtered out entries, save the cleaned data back
      if (validTrackings.length !== parsed.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validTrackings));
      }

      return validTrackings;
    } catch (error) {
      console.error('Error reading trackings from localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  saveTracking(tracking: SavedTracking): void {
    // Validate tracking data before saving
    if (!tracking || !tracking.trackingNumber || !tracking.updateKey) {
      console.error('Invalid tracking data provided to saveTracking:', tracking);
      return;
    }

    const trackings = this.getSavedTrackings();
    const existingIndex = trackings.findIndex(t => t.trackingNumber === tracking.trackingNumber);

    if (existingIndex >= 0) {
      trackings[existingIndex] = tracking;
    } else {
      trackings.push(tracking);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trackings));
  }

  removeTracking(trackingNumber: string): void {
    const trackings = this.getSavedTrackings();
    const filtered = trackings.filter(t => t.trackingNumber !== trackingNumber);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  isTrackingSaved(trackingNumber: string): boolean {
    const trackings = this.getSavedTrackings();
    return trackings.some(t => t.trackingNumber === trackingNumber);
  }

  updateLastViewed(trackingNumber: string): void {
    const trackings = this.getSavedTrackings();
    const tracking = trackings.find(t => t.trackingNumber === trackingNumber);

    if (tracking) {
      tracking.lastViewedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trackings));
    }
  }

  addTrackingFromData(trackingData: any, updateKey: string): void {
    // Handle both API response formats (create vs get)
    const savedTracking: SavedTracking = {
      trackingNumber: trackingData.trackingNumber || trackingData.tracking_number,
      updateKey: updateKey,
      destination: trackingData.destination,
      kissProvider: trackingData.kissProvider || trackingData.kiss_provider,
      createdAt: trackingData.createdAt || trackingData.created_at || new Date().toISOString(),
      lastViewedAt: new Date().toISOString()
    };

    // Validate that we have the required fields
    if (!savedTracking.trackingNumber || !savedTracking.updateKey || !savedTracking.destination || !savedTracking.kissProvider) {
      console.error('Missing required fields for tracking:', {
        trackingNumber: savedTracking.trackingNumber,
        updateKey: savedTracking.updateKey,
        destination: savedTracking.destination,
        kissProvider: savedTracking.kissProvider,
        originalData: trackingData
      });
      return;
    }

    this.saveTracking(savedTracking);
  }

  clearAllTrackings(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const trackingStorage = new TrackingStorage();
export type { SavedTracking, TrackingData };