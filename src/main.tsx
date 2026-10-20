import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import List from './List.tsx'
import Goals from './Goals.tsx'

const isList = /^\/list\/?$/.test(window.location.pathname)
const isGoals = /^\/goals\/?$/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGoals ? <Goals /> : isList ? <List /> : <App />}
  </StrictMode>,
)

if (isGoals) {
  document.title = 'Goals'
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', '/goals.webmanifest')
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', '/goals-apple-touch-icon.png')
  document.querySelector('link[rel="icon"]')?.setAttribute('href', '/goals-icon.svg')
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', 'Goals')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000')
}

const swScope = isList ? '/list' : isGoals ? '/goals' : null
if (swScope && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: swScope }))
}
