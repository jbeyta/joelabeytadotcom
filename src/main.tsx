import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Apps from './Apps.tsx'

const isApps = /^\/apps\/?$/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isApps ? <Apps /> : <App />}
  </StrictMode>,
)

if (isApps && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: '/apps' }))
}
