import { Router } from 'express'
import { createSession, deleteSession, getUserByToken } from '../auth/session.js'

export const authRouter = Router()

function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  const attrs = [
    `sid=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (isProd) attrs.push('Secure')
  res.setHeader('Set-Cookie', attrs.join('; '))
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax')
}

authRouter.post('/login', (req, res) => {
  const { email = 'user@example.com', role = 'teacher' } = req.body || {}
  // In real life validate against Cognito. Here, accept any.
  const user = { email, role }
  const token = createSession(user)
  setSessionCookie(res, token)
  res.json({ user })
})

authRouter.post('/logout', (req, res) => {
  const sid = (req.headers.cookie || '').split('sid=')[1]?.split(';')[0]
  if (sid) deleteSession(sid)
  clearSessionCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', (req, res) => {
  const sid = (req.headers.cookie || '').split('sid=')[1]?.split(';')[0]
  const user = getUserByToken(sid)
  res.json({ user: user || null })
})

