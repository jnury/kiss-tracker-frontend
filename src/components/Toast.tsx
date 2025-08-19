import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#333',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out'
    }}>
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
  }

  const hideToast = () => {
    setToast(null)
  }

  const ToastComponent = toast ? <Toast message={toast} onClose={hideToast} /> : null

  return { showToast, ToastComponent }
}