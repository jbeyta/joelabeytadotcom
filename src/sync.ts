import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from './auth.ts'
import './sync.scss'

type Doc<T> = { updatedAt: number; data: T }

async function call<T>(key: string, doc?: Doc<T>): Promise<Doc<T> | null> {
  const token = await getAccessToken()
  if (!token) throw new Error('signed out')
  const res = await fetch(`/api/sync?key=${key}`, {
    method: doc ? 'PUT' : 'GET',
    headers: { authorization: `Bearer ${token}`, ...(doc && { 'content-type': 'application/json' }) },
    body: doc && JSON.stringify(doc),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`sync ${res.status}`)
  return doc ? null : res.json()
}

// Keeps `data` in step with the server copy. Each side has a stamp: the time of its last
// local change. The newer stamp wins. A device with no stamp never uploads, so a wiped
// device restores from the server and does not overwrite it.
export function useSync<T>(key: string, data: T, apply: (data: T) => void) {
  const stampKey = `sync:${key}`
  const [syncedAt, setSyncedAt] = useState(() => Number(localStorage.getItem(`sync:${key}:at`)) || 0)
  const [syncing, setSyncing] = useState(false)
  const latest = useRef(data)
  const applyRef = useRef(apply)
  const applied = useRef(data)
  const sync = useRef(() => {})
  const timer = useRef(0)

  useEffect(() => {
    latest.current = data
    applyRef.current = apply
  })

  useEffect(() => {
    const stamp =() => Number(localStorage.getItem(stampKey)) || 0
    const run = async () => {
      setSyncing(true)
      try {
        const remote = await call<T>(key)
        const local = stamp()
        if (remote && remote.updatedAt > local) {
          localStorage.setItem(stampKey, String(remote.updatedAt))
          applied.current = remote.data
          applyRef.current(remote.data)
        } else if (local > (remote?.updatedAt ?? 0)) {
          await call(key, { updatedAt: local, data: latest.current })
        }
        const now = Date.now()
        localStorage.setItem(`${stampKey}:at`, String(now))
        setSyncedAt(now)
      } finally {
        setSyncing(false)
      }
    }
    let queue = Promise.resolve()
    const trigger = () => { queue = queue.then(run).catch(() => {}) }
    const onVisible = () => document.visibilityState === 'visible' && trigger()
    sync.current = trigger
    trigger()
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key, stampKey])

  useEffect(() => {
    if (data === applied.current) return
    localStorage.setItem(stampKey, String(Date.now()))
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => sync.current(), 1000)
  }, [data, stampKey])

  const synced = syncedAt
    ? new Date(syncedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'never'
  return { synced, syncing }
}
