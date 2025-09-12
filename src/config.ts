// Application configuration
export const config = {
  // API URL for backend requests
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Frontend URL for sharing and Open Graph meta tags
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // Helper function to get absolute URLs for assets
  getAssetUrl: (path: string) => {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
}