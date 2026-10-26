import { useEffect, useRef, useState } from 'react'

type Doc<T> = { updatedAt: number; data: T }

const TOKEN_KEY = 'sync-token'
let token: string | null | undefined

// Ask once per page load. Keep the token in a password manager: a wiped device needs it to restore.
const getToken = () => {
  if (token === undefined) {
    token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      token = window.prompt('Sync token (cancel to keep data on this device only)')?.trim() || null
      if (token) localStorage.setItem(TOKEN_KEY, token)
    }
  }
  return token
}

async function call<T>(key: string, doc?: Doc<T>): Promise<Doc<T> | null> {
  const t = getToken()
  if (!t) throw new Error('no sync token')
  const res = await fetch(`/api/sync?key=${key}`, {
    method: doc ? 'PUT' : 'GET',
    headers: { authorization: `Bearer ${t}`, ...(doc && { 'content-type': 'application/json' }) },
    body: doc && JSON.stringify(doc),
    cache: 'no-store',
  })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    token = null
  }
  if (!res.ok) throw new Error(`sync ${res.status}`)
  return doc ? null : res.json()
}

// Keeps `data` in step with the server copy. Each side has a stamp: the time of its last
// local change. The newer stamp wins. A device with no stamp never uploads, so a wiped
// device restores from the server and does not overwrite it.
export function useSync<T>(key: string, storageKey: string, data: T, apply: (data: T) => void) {
  const [stampKey] = useState(() => {
    const k = `sync:${key}`
    // Data saved before sync existed: stamp 1 uploads it only when the server has nothing.
    if (!localStorage.getItem(k) && localStorage.getItem(storageKey)) localStorage.setItem(k, '1')
    return k
  })
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
    if (!import.meta.env.PROD) return
    const stamp = () => Number(localStorage.getItem(stampKey)) || 0
    const run = async () => {
      const remote = await call<T>(key)
      const local = stamp()
      if (remote && remote.updatedAt > local) {
        localStorage.setItem(stampKey, String(remote.updatedAt))
        applied.current = remote.data
        applyRef.current(remote.data)
      } else if (local > (remote?.updatedAt ?? 0)) {
        await call(key, { updatedAt: local, data: latest.current })
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
}
