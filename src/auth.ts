// Sign-in with the Cognito user pool in infra/cognito.tf. The browser calls Cognito
// directly. The session (a 1-hour access token and a 10-year refresh token) lives in
// localStorage, so a wiped device signs in again and restores its data from the server.
const CLIENT_ID = '173jgk211fk91kibj6fgg90jal'
const ENDPOINT = 'https://cognito-idp.us-east-1.amazonaws.com/'
const SESSION_KEY = 'auth'

type Session = { email: string; access: string; refresh: string; expires: number }

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function cognito<T>(action: string, body: object): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify({ ClientId: CLIENT_ID, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new AuthError(String(data.__type).split('#').pop() ?? '', data.message ?? 'Something went wrong')
  return data
}

const listeners = new Set<() => void>()

export const onAuthChange = (fn: () => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

const read = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

const save = (s: Session | null) => {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else localStorage.removeItem(SESSION_KEY)
  listeners.forEach(fn => fn())
}

export const signedInEmail = () => read()?.email ?? null

type Tokens = { AuthenticationResult: { AccessToken: string; RefreshToken?: string; ExpiresIn: number } }

export async function signIn(email: string, password: string) {
  const { AuthenticationResult: r } = await cognito<Tokens>('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  })
  save({ email, access: r.AccessToken, refresh: r.RefreshToken!, expires: Date.now() + r.ExpiresIn * 1000 })
}

export const signUp = (email: string, password: string) =>
  cognito('SignUp', { Username: email, Password: password, UserAttributes: [{ Name: 'email', Value: email }] })

export const confirmSignUp = (email: string, code: string) =>
  cognito('ConfirmSignUp', { Username: email, ConfirmationCode: code })

export const resendCode = (email: string) => cognito('ResendConfirmationCode', { Username: email })

export const forgotPassword = (email: string) => cognito('ForgotPassword', { Username: email })

export const resetPassword = (email: string, code: string, password: string) =>
  cognito('ConfirmForgotPassword', { Username: email, ConfirmationCode: code, Password: password })

// Signing out clears all local data, so the next person on this device starts clean.
export function signOut() {
  const s = read()
  if (s) cognito('RevokeToken', { Token: s.refresh }).catch(() => {})
  localStorage.clear()
  save(null)
}

// Returns a valid access token, renewing it when it has under a minute left.
// Returns null when signed out. Throws when offline, and keeps the session.
export async function getAccessToken() {
  const s = read()
  if (!s) return null
  if (s.expires - Date.now() > 60_000) return s.access
  try {
    const { AuthenticationResult: r } = await cognito<Tokens>('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: s.refresh },
    })
    const next = { ...s, access: r.AccessToken, expires: Date.now() + r.ExpiresIn * 1000 }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    return next.access
  } catch (e) {
    // The refresh token expired or was revoked: the user must sign in again. Clear local
    // data as signOut does, so a different user who signs in next does not upload it.
    if (e instanceof AuthError && e.code === 'NotAuthorizedException') {
      localStorage.clear()
      save(null)
    }
    throw e
  }
}
