import { useEffect, useRef, useState } from 'react'
import './List.scss'

type Item = { id: string; text: string; checked: boolean }

const KEY = 'checklist:v1'
const newItem = (): Item => ({ id: crypto.randomUUID(), text: '', checked: false })

function load(): { items: Item[]; locked: boolean } {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '')
    if (Array.isArray(d.items) && d.items.length) return { items: d.items, locked: !!d.locked }
  } catch { /* ignore */ }
  return { items: [newItem()], locked: false }
}

export default function List() {
  const [state] = useState(load)
  const [items, setItems] = useState<Item[]>(state.items)
  const [locked, setLocked] = useState(state.locked)
  const refs = useRef<Record<string, HTMLInputElement | null>>({})
  const focusId = useRef<string | null>(null)

  useEffect(() => {
    document.title = 'List'
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ items, locked }))
    } catch { /* ignore */ }
  }, [items, locked])

  useEffect(() => {
    if (focusId.current) {
      refs.current[focusId.current]?.focus()
      focusId.current = null
    }
  }, [items])

  const update = (id: string, patch: Partial<Item>) =>
    setItems(its => its.map(i => (i.id === id ? { ...i, ...patch } : i)))

  const insertAfter = (id: string) => {
    const n = newItem()
    focusId.current = n.id
    setItems(its => {
      const idx = its.findIndex(i => i.id === id)
      return [...its.slice(0, idx + 1), n, ...its.slice(idx + 1)]
    })
  }

  const remove = (id: string) => {
    const idx = items.findIndex(i => i.id === id)
    if (items.length === 1) return update(id, { text: '' })
    focusId.current = items[idx > 0 ? idx - 1 : 1].id
    setItems(its => its.filter(i => i.id !== id))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: Item) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      insertAfter(item.id)
    } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
      e.preventDefault()
      remove(item.id)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const idx = items.findIndex(i => i.id === item.id)
      const t = items[idx + (e.key === 'ArrowUp' ? -1 : 1)]
      if (t) {
        e.preventDefault()
        refs.current[t.id]?.focus()
      }
    }
  }

  const clearChecked = () => {
    if (!items.some(i => i.checked)) return
    if (!window.confirm('Clear all checked items?')) return
    const rest = items.filter(i => !i.checked)
    setItems(rest.length ? rest : [newItem()])
  }

  return (
    <div className="list-page">
      <div className="list-bar">
        <button
          aria-label="Lock"
          aria-pressed={locked}
          onClick={() => setLocked(l => !l)}
        >
          <svg viewBox="0 0 12 14" width="24" height="28" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
            {locked ? (
              <path d="M3 0h6v1h1v4H7V2H5v3H2V1h1z" />
            ) : (
              <path d="M3 0h6v1H3z M3 1h2v2H3z M7 1h2v4H7z" />
            )}
            <path fillRule="evenodd" d="M1 5h10v8H1z M5 7h2v3H5z" />
          </svg>
        </button>
        {items.some(i => i.checked) && (
          <button aria-label="Clear checked" onClick={clearChecked}>
            <svg viewBox="0 0 12 14" width="24" height="28" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
              <path d="M4 0h4v1h3v2H1V1h3z M2 4h8v10H2z M4 6v6h1V6z M7 6v6h1V6z" fillRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <ul className="list-items">
        {items.map(item => (
          <li key={item.id} className={item.checked ? 'done' : ''}>
            <input
              type="checkbox"
              className="box"
              aria-label="Done"
              checked={item.checked}
              onChange={e => update(item.id, { checked: e.target.checked })}
            />
            <input
              type="text"
              className="text"
              ref={el => { refs.current[item.id] = el }}
              value={item.text}
              readOnly={locked}
              placeholder="Item"
              autoComplete="off"
              enterKeyHint="next"
              onChange={e => update(item.id, { text: e.target.value })}
              onKeyDown={e => !locked && onKeyDown(e, item)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
