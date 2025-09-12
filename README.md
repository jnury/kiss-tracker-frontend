# 😘 Kiss Tracker Frontend

Romantic parcel tracking experience for couples with real-time updates and social sharing.

## Features

- 🏠 **Landing Page**: Enter tracking number or create new tracking with random romantic logos
- 💌 **Create Tracking**: Set up kiss delivery with provider name, destination, and ETA
- 👀 **Public Tracking**: Beautiful timeline view of delivery progress with real-time updates
- 📱 **Update Interface**: Private update page for providers to add locations and modify details
- ⚡ **Real-time Updates**: Server-Sent Events (SSE) for instant notifications
- 🌐 **Social Sharing**: Open Graph meta tags optimized for WhatsApp/social media
- 📊 **Performance**: Optimized images (58% size reduction) for fast loading

## Tech Stack

- **React 18 + TypeScript**: Modern React with full type safety
- **Vite**: Fast build tooling and hot module replacement
- **React Router**: Client-side routing with React Router v6
- **React Helmet Async**: Dynamic SEO meta tags and Open Graph data
- **Axios**: HTTP client for API communication
- **Server-Sent Events**: Real-time updates without WebSocket complexity
- **Responsive Design**: Mobile-first CSS with romantic styling

## Pages & Routes

- `/` - Landing page with tracking lookup and creation
- `/create` - Create new kiss delivery tracking
- `/track/:trackingNumber` - Public tracking view with timeline
- `/update/:trackingNumber?key=SECRET` - Private update interface

## Real-time Features

### Server-Sent Events (SSE)
- **Auto-reconnection**: 5-second reconnect on connection loss
- **Event Types**: 
  - `location-update` - New location added to timeline
  - `status-change` - Delivery status updated
  - `eta-change` - ETA modified
  - `destination-change` - Destination updated
  - `delivery-removed` - Delivery records cleaned up

### Toast Notifications
- Success/error feedback for all user actions
- Clipboard copy confirmations
- Real-time update notifications

## Social Media Integration

### Open Graph Support
- **Dedicated logo**: High-quality `logo.png` (512x512) for social sharing
- **Dynamic meta tags**: Different descriptions per page
- **Consistent branding**: "Kiss Tracker" title across all platforms
- **WhatsApp preview**: Optimized for messaging app previews

### SEO Features
- Dynamic page titles with tracking numbers
- Descriptive meta descriptions
- Twitter Card support
- Favicon management

## Asset Management

### Image Optimization
- **UI Logos**: 8 romantic logos optimized to 256x256 (59-87KB each)
- **Open Graph**: Dedicated `logo.png` at full 512x512 quality (270KB)
- **Favicon**: Optimized to 64x64 (5.2KB)
- **Total savings**: 58% reduction from 2.1MB to 876KB

### Static Assets
- All assets in `public/` folder for direct serving
- No import statements needed - simple `/logo_01.png` paths
- Vite automatically copies to build output
- Git-tracked for deployment

## Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Configuration

### API Integration
Centralized in `src/config.ts`:
```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
}
```

### Build Process
- **Development**: Vite dev server with hot reload
- **Production**: Static build with asset optimization
- **Assets**: Public files copied as-is (no hashing)

## Deployment

### Render.com Static Site
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `./dist`
- **Routing**: SPA routing with `/index.html` fallback
- **Security Headers**: X-Frame-Options, X-Content-Type-Options
- **Custom Domain**: kiss-tracker.com, www.kiss-tracker.com

### Environment Setup
```bash
# Production
VITE_API_URL=https://track.kiss-tracker.com
```

## Project Structure

```
src/
├── components/
│   └── Toast.tsx          # Toast notification system
├── pages/
│   ├── LandingPage.tsx    # Home page with random logos
│   ├── CreateTracking.tsx # New tracking creation
│   ├── TrackingPage.tsx   # Public tracking view
│   └── UpdateTracking.tsx # Private update interface
├── config.ts              # Centralized configuration
├── index.css              # Global styles
└── main.tsx               # App entry point

public/
├── logo_01.png - logo_08.png  # Optimized UI logos (256x256)
├── logo.png                # Open Graph logo (512x512)
├── favicon.ico                # Browser favicon
└── favicon.png                # PNG favicon (64x64)
```

## API Integration

Frontend connects to Kiss Tracker backend API for:

### Public Operations
- **Get tracking info**: Display timeline and status
- **Real-time updates**: SSE connection for live changes

### Authenticated Operations (require update key)
- **Create tracking**: Generate new tracking with dual links
- **Add locations**: Update delivery timeline
- **Modify details**: Change ETA, status, destination
- **Access update page**: Private interface for providers

## Performance Features

- **Optimized images**: 58% size reduction while maintaining quality
- **Asset caching**: Efficient browser caching for static files
- **Code splitting**: Vite automatic bundle optimization  
- **SSE efficiency**: Lightweight real-time updates vs WebSockets
- **Responsive design**: Mobile-optimized for all screen sizes

## Browser Support

- Modern browsers with ES2020+ support
- Server-Sent Events compatibility
- CSS Grid and Flexbox support
- Mobile-first responsive design