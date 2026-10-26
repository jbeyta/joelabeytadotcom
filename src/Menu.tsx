import { useEffect, useState } from 'react'
import { signOut } from './auth.ts'

// Hamburger button that opens a small box with links to the other pages.
// Each page passes the class for its own buttons, so the icon matches the page.
export default function Menu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <div className="menu">
      <button
        className={className}
        aria-label="Menu"
        aria-expanded={open}
        onClick={e => {
          e.stopPropagation()
          setOpen(o => !o)
        }}
      >
        <svg width="20" height="20" viewBox="0 0 7 7" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M0 1h7v1H0zM0 3h7v1H0zM0 5h7v1H0z" />
        </svg>
      </button>
      {open && (
        <nav className="menu-box">
          <a href="#list">List</a>
          <a href="#goals">Goals</a>
          <button
            className="menu-signout"
            onClick={() => window.confirm('Sign out? Changes that have not synced yet are lost.') && signOut()}
          >
            sign out
          </button>
        </nav>
      )}
    </div>
  )
}
