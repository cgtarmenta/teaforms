// Minimal auth middleware for dev.
// Reads role from header `x-role` or defaults to `anonymous`.
// In production, replace with Cognito/JWT verification.

import { getUserByToken } from './auth/session.js'

function parseCookie(cookie) {
  const out = {}
  if (!cookie) return out
  cookie.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=')
    out[k] = decodeURIComponent(v.join('='))
  })
  return out
}

export function attachAuth(req, _res, next) {
  try {
    const cookies = parseCookie(req.headers.cookie || '')
    const sid = cookies.sid
    const sessionUser = getUserByToken(sid)
    if (sessionUser) {
      req.user = sessionUser
      return next()
    }
  } catch {}
  const role = req.header('x-role') || 'anonymous'
  req.user = { role }
  next()
}
