import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import faviconIco from './assets/favicon.ico'
import faviconPng from './assets/favicon.png'

// Update favicon links dynamically
const updateFavicon = () => {
  const existingLinks = document.querySelectorAll('link[rel*="icon"]')
  existingLinks.forEach(link => link.remove())
  
  const iconLink = document.createElement('link')
  iconLink.rel = 'icon'
  iconLink.type = 'image/x-icon'
  iconLink.href = faviconIco
  document.head.appendChild(iconLink)
  
  const pngLink = document.createElement('link')
  pngLink.rel = 'icon'
  pngLink.type = 'image/png'
  pngLink.sizes = '32x32'
  pngLink.href = faviconPng
  document.head.appendChild(pngLink)
  
  const appleLink = document.createElement('link')
  appleLink.rel = 'apple-touch-icon'
  appleLink.sizes = '180x180'
  appleLink.href = faviconPng
  document.head.appendChild(appleLink)
}

updateFavicon()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)