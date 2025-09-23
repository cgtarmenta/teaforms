import { readBody } from 'h3'
import { setSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Ensure session secret is configured in production to avoid 500s from JWT
  const cfg = useRuntimeConfig()
  const envSecret = process.env.SESSION_SECRET || process.env.NUXT_SESSION_SECRET
  if (process.env.NODE_ENV === 'production' && !(cfg.SESSION_SECRET || envSecret)) {
    setResponseStatus(event, 500)
    return { error: 'SESSION_SECRET is not configured. Set it in Amplify branch env vars.' }
  }
  const body = await readBody(event)
  const email = body?.email || 'user@example.com'
  const role = body?.role || 'teacher'
  const user = { email, role }
  setSession(event, user as any)
  return { user }
})
