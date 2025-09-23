import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'

type User = { email: string; role: 'teacher'|'clinician'|'sysadmin' }

function getSecret() {
  const cfg = useRuntimeConfig()
  const prod = process.env.NODE_ENV === 'production'
  return cfg.SESSION_SECRET || (prod ? '' : 'dev-insecure-secret')
}

export function getUser(event: H3Event): User|null {
  const token = getCookie(event, 'sid')
  if (!token) return null
  const secret = getSecret()
  if (!secret) return null
  try {
    const payload = jwt.verify(token, secret) as any
    if (payload && payload.email && payload.role) return { email: payload.email, role: payload.role }
    return null
  } catch {
    return null
  }
}

export function setSession(event: H3Event, user: User) {
  const secret = getSecret()
  const token = jwt.sign({ email: user.email, role: user.role }, secret, { expiresIn: '7d' })
  const prod = process.env.NODE_ENV === 'production'
  setCookie(event, 'sid', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: prod })
}

export function clearSession(event: H3Event) {
  deleteCookie(event, 'sid', { path: '/' })
}

export function requireRole(user: User|null, roles: string[]) {
  if (!user) return false
  return roles.includes(user.role)
}

