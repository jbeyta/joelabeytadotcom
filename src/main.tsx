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

const swScope = isList ? '/list' : isGoals ? '/goals' : null
if (swScope && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: swScope }))
}
