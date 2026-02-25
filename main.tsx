import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: '#12121a',
          color: '#f8fafc',
          border: '1px solid #2d3748',
        },
      }}
    />
    <App />
  </StrictMode>,
)
