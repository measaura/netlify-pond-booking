/**
 * Server-side helper to derive a user id from an incoming Request.
 *
 * Heuristics (in order):
 *  - cookie named `userId` (plain numeric)
 *  - cookie named `authState` (URL-encoded JSON with `user.id` produced by client for dev)
 *  - header `x-user-id` (deprecated fallback for dev/testing)
 *
 * Returns `number | null`.
 */
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'session'
const DEFAULT_SESSION_SECRET = 'dev-session-secret-please-change'

function base64UrlEncode(str: string) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(b64: string) {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  // pad
  while (b64.length % 4) b64 += '='
  return Buffer.from(b64, 'base64').toString('utf8')
}

function getSecret() {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET
}

export function signSession(payload: Record<string, any>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const secret = getSecret()
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64')
  const sigUrl = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${header}.${body}.${sigUrl}`
}

export function verifySession(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const secret = getSecret()
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    if (sig !== expectedSig) return null
    const payloadJson = base64UrlDecode(body)
    return JSON.parse(payloadJson)
  } catch (e) {
    return null
  }
}

export function getUserIdFromRequest(req: Request): number | null {
  try {
    // Parse cookies
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, part) => {
        const idx = part.indexOf('=')
        if (idx === -1) return acc
        const key = part.slice(0, idx)
        const val = part.slice(idx + 1)
        acc[key] = decodeURIComponent(val)
        return acc
      }, {})

    // Prefer signed session cookie
    if (cookies[SESSION_COOKIE_NAME]) {
      const verified = verifySession(cookies[SESSION_COOKIE_NAME])
      const id = verified?.userId
      if (typeof id === 'number') return id
      if (typeof id === 'string') {
        const n = parseInt(id, 10)
        if (!isNaN(n)) return n
      }
    }

    // Back-compat: look for numeric userId cookie (legacy/dev)
    if (cookies.userId) {
      const n = parseInt(cookies.userId, 10)
      if (!isNaN(n)) return n
    }

    // Back-compat: authState cookie (client-side localStorage mirrored or set for dev)
    if (cookies.authState) {
      try {
        const parsed = JSON.parse(cookies.authState)
        const id = parsed?.user?.id
        if (typeof id === 'number') return id
        if (typeof id === 'string') {
          const n = parseInt(id, 10)
          if (!isNaN(n)) return n
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    // Deprecated/dev fallback: allow x-user-id header (keeps existing dev workflows working)
    const headerUser = req.headers.get('x-user-id')
    if (headerUser) {
      const n = parseInt(headerUser, 10)
      if (!isNaN(n)) return n
    }

    return null
  } catch (e) {
    return null
  }
}
