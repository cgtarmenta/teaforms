import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'

const sessions = new Map() // token -> user (fallback)
const isProd = process.env.NODE_ENV === 'production'
const secret = process.env.SESSION_SECRET || (isProd ? '' : 'dev-insecure-secret')
const useJwt = !!secret

export function createSession(user) {
  if (useJwt) {
    const token = jwt.sign({ email: user.email, role: user.role }, secret, { expiresIn: '7d' })
    return token
  }
  const token = randomBytes(24).toString('hex')
  sessions.set(token, { ...user, createdAt: Date.now() })
  return token
}

export function getUserByToken(token) {
  if (!token) return null
  if (useJwt) {
    try {
      const payload = jwt.verify(token, secret)
      return { email: payload.email, role: payload.role }
    } catch { return null }
  }
  return sessions.get(token) || null
}

export function deleteSession(token) {
  if (!token) return
  if (useJwt) return
  sessions.delete(token)
}
