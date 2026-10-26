import { useEffect, useRef, useState } from 'react'
import './Goals.scss'
import { useSync } from './sync.ts'
import Menu from './Menu.tsx'

type Tab = { id: string; title: string; color: string; cells: boolean[]; lastTap: string | null; ready?: boolean }

const HOME = 'home'
const STORAGE_KEY = 'goals-tabs-v1'
const CELLS = 30
const PIXEL = 4

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const randomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`

const newTab = (): Tab => ({
  id: crypto.randomUUID(),
  title: 'Title',
  color: randomColor(),
  cells: Array(CELLS).fill(false),
  lastTap: null,
})

const load = (): { tabs: Tab[]; active: string } => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '')
    if (raw.tabs?.length) return { ...raw, active: HOME }
  } catch { /* fall through */ }
  const t = newTab()
  return { tabs: [t], active: HOME }
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }
type Rocket = { x: number; y: number; vy: number; targetY: number; color: string }

function Fireworks({ color, burst, constant }: { color: string; burst: { x: number; y: number } | null; constant: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rockets = useRef<Rocket[]>([])
  const constantRef = useRef(constant)
  const colorRef = useRef(color)

  useEffect(() => {
    constantRef.current = constant
    colorRef.current = color
  }, [constant, color])

  const explode = (x: number, y: number, c: string) => {
    const count = 36
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const s = 0.8 + Math.random() * 0.8
      particles.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 40 + Math.random() * 20, color: c })
    }
  }

  useEffect(() => {
    if (burst) explode(burst.x / PIXEL, burst.y / PIXEL, colorRef.current)
  }, [burst])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / PIXEL)
      canvas.height = Math.ceil(window.innerHeight / PIXEL)
    }
    resize()
    window.addEventListener('resize', resize)
    let frame = 0
    let raf = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (constantRef.current && frame % 45 === 0) {
        rockets.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vy: -(2 + Math.random()),
          targetY: canvas.height * (0.1 + Math.random() * 0.5),
          color: Math.random() < 0.5 ? colorRef.current : randomColor(),
        })
      }
      rockets.current = rockets.current.filter(r => {
        r.y += r.vy
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color)
          return false
        }
        ctx.fillStyle = '#fff'
        ctx.fillRect(Math.floor(r.x), Math.floor(r.y), 1, 2)
        return true
      })
      particles.current = particles.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02
        p.life--
        if (p.life <= 0) return false
        ctx.globalAlpha = Math.min(1, p.life / 15)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1)
        return true
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="goals-fireworks" />
}

export default function Goals() {
  const [state, setState] = useState(load)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const { tabs, active } = state
  const isHome = active === HOME
  const tab = tabs.find(t => t.id === active) ?? tabs[0]
  const full = !isHome && tab.cells.every(Boolean)
  const ready = !!tab.ready

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
    document.title = 'Goals'
  }, [state])

  const { synced, syncing } = useSync('goals', STORAGE_KEY, tabs, remote => {
    if (remote?.length) setState(s => ({ ...s, tabs: remote }))
  })

  const update = (id: string, patch: Partial<Tab>) =>
    setState(s => ({ ...s, tabs: s.tabs.map(t => (t.id === id ? { ...t, ...patch } : t)) }))

  const addTab = () => {
    const t = newTab()
    setState(s => ({ tabs: [...s.tabs, t], active: t.id }))
  }

  const removeTab = () => {
    if (!window.confirm(`Delete "${tab.title}"? This can't be undone.`)) return
    setState(s => {
      const rest = s.tabs.filter(t => t.id !== tab.id)
      if (!rest.length) return { tabs: [newTab()], active: HOME }
      return { tabs: rest, active: HOME }
    })
  }

  const tap = (i: number, el: HTMLElement) => {
    // Check the date at tap time: an installed app can stay open past midnight without a re-render.
    if (tab.cells[i]) {
      if (!ready) update(tab.id, { cells: tab.cells.map((c, j) => (j === i ? false : c)) })
      return
    }
    if (ready && tab.lastTap === today()) return
    const r = el.getBoundingClientRect()
    setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    update(tab.id, { cells: tab.cells.map((c, j) => (j === i ? true : c)), ...(ready ? { lastTap: today() } : {}) })
  }

  return (
    <div className="goals">
      <Fireworks color={isHome ? '#fff' : tab.color} burst={burst} constant={full} />
      <div className="goals-content">
        <div className="goals-tabs">
          <Menu className="goals-tab" />
          <button
            className={`goals-tab${isHome ? ' active' : ''}`}
            style={{ borderColor: isHome ? '#fff' : undefined }}
            onClick={() => setState(s => ({ ...s, active: HOME }))}
            aria-label="Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <path d="M3 11l9-8 9 8M5 10v11h5v-6h4v6h5V10" />
            </svg>
          </button>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`goals-tab${!isHome && t.id === tab.id ? ' active' : ''}`}
              style={{ borderColor: !isHome && t.id === tab.id ? t.color : undefined }}
              onClick={() => setState(s => ({ ...s, active: t.id }))}
              aria-label={`Open ${t.title}`}
            >
              <span style={{ background: t.color }} />
            </button>
          ))}
          <button className="goals-tab add" onClick={addTab} aria-label="Add tab">+</button>
          {!isHome && (
            <button className="goals-tab trash" onClick={removeTab} aria-label="Delete tab">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
              </svg>
            </button>
          )}
        </div>
        {isHome ? (
          <div className="goals-home">
            {tabs.map(t => (
              <button key={t.id} className="goals-summary" onClick={() => setState(s => ({ ...s, active: t.id }))}>
                <span className="goals-summary-title" style={{ color: t.color }}>{t.title}</span>
                <span className="goals-progress">
                  {t.cells.map((on, i) => (
                    <span key={i} style={{ background: on ? t.color : '#333' }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
        <input
          className="goals-title"
          style={{ color: tab.color }}
          value={tab.title}
          readOnly={ready}
          onChange={e => update(tab.id, { title: e.target.value })}
        />
        <div className="goals-grid">
          {tab.cells.map((on, i) => (
            <button
              key={i}
              className="goals-cell"
              style={{ color: tab.color }}
              onClick={e => tap(i, e.currentTarget)}
              aria-label={on ? 'Completed' : 'Mark today'}
            >
              {on ? 'X' : ''}
            </button>
          ))}
        </div>
        {ready && full && (
          <button
            className="goals-ready"
            style={{ color: tab.color, borderColor: tab.color }}
            onClick={() => window.confirm('Clear the grid and start a new round?') && update(tab.id, { cells: Array(CELLS).fill(false) })}
          >
            Restart
          </button>
        )}
        {!ready && (
          <button
            className="goals-ready"
            style={{ color: tab.color, borderColor: tab.color }}
            onClick={() => window.confirm('Lock the title and limit taps to one per day? This can\'t be undone.') && update(tab.id, { ready: true })}
          >
            Ready
          </button>
        )}
          </>
        )}
      </div>
      <div className="goals-synced">
        <span className="sync-status">
          {syncing && <span className="sync-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>}
          last synced - {synced}
        </span>
      </div>
    </div>
  )
}
