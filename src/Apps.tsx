import { useEffect, useState, type FormEvent } from 'react'
import { AuthError, confirmSignUp, forgotPassword, onAuthChange, resendCode, resetPassword, signedInEmail, signIn, signUp } from './auth.ts'
import Goals from './Goals.tsx'
import List from './List.tsx'
import './Apps.scss'

// One installed app at /apps. Pages are hash routes, so the whole app stays in one
// Home Screen scope and one sign-in: /apps, /apps#list, /apps#goals.
const route = () => window.location.hash.slice(1)

export default function Apps() {
  const [email, setEmail] = useState(signedInEmail)
  const [page, setPage] = useState(route)

  useEffect(() => onAuthChange(() => setEmail(signedInEmail())), [])

  useEffect(() => {
    const onHash = () => setPage(route())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="apps">
      {!email ? <SignIn /> : page === 'goals' ? <Goals /> : page === 'list' ? <List /> : (
        <nav className="apps-home">
          <a href="#list">List</a>
          <a href="#goals">Goals</a>
        </nav>
      )}
    </div>
  )
}

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset'

const TITLES: Record<Mode, string> = {
  signin: 'Sign in',
  signup: 'Create account',
  confirm: 'Confirm email',
  forgot: 'Reset password',
  reset: 'Reset password',
}

const SUBMIT: Record<Mode, string> = {
  signin: 'Sign in',
  signup: 'Create',
  confirm: 'Confirm',
  forgot: 'Send code',
  reset: 'Save',
}

function SignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const go = (next: Mode, message = '') => {
    setMode(next)
    setNote(message)
    setError('')
    setCode('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signin') await signIn(email, password)
      if (mode === 'signup') {
        await signUp(email, password)
        go('confirm', 'We sent a code to your email.')
      }
      if (mode === 'confirm') {
        await confirmSignUp(email, code)
        await signIn(email, password)
      }
      if (mode === 'forgot') {
        await forgotPassword(email)
        go('reset', 'We sent a code to your email.')
      }
      if (mode === 'reset') {
        await resetPassword(email, code, password)
        await signIn(email, password)
      }
    } catch (err) {
      if (err instanceof AuthError && err.code === 'UserNotConfirmedException') {
        await resendCode(email).catch(() => {})
        go('confirm', 'Confirm your email first. We sent a new code.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setBusy(false)
    }
  }

  const needsEmail = mode === 'signin' || mode === 'signup' || mode === 'forgot'
  const needsCode = mode === 'confirm' || mode === 'reset'
  const needsPassword = mode === 'signin' || mode === 'signup' || mode === 'reset'

  return (
    <form className="apps-form" onSubmit={submit}>
      <h1>{TITLES[mode]}</h1>
      {note && <p className="apps-note">{note}</p>}
      {needsEmail && (
        <input
          type="email"
          placeholder="email"
          aria-label="Email"
          autoComplete="username"
          required
          value={email}
          onChange={e => setEmail(e.target.value.trim())}
        />
      )}
      {needsCode && (
        <input
          inputMode="numeric"
          placeholder="code"
          aria-label="Code"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={e => setCode(e.target.value.trim())}
        />
      )}
      {needsPassword && (
        <input
          type="password"
          placeholder={mode === 'reset' ? 'new password' : 'password'}
          aria-label="Password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={8}
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      )}
      {error && <p className="apps-error">{error}</p>}
      <button type="submit" className="apps-submit" disabled={busy}>{busy ? '...' : SUBMIT[mode]}</button>
      <div className="apps-links">
        {mode === 'signin' ? (
          <>
            <button type="button" onClick={() => go('signup')}>create account</button>
            <button type="button" onClick={() => go('forgot')}>forgot password</button>
          </>
        ) : (
          <button type="button" onClick={() => go('signin')}>back to sign in</button>
        )}
      </div>
    </form>
  )
}
