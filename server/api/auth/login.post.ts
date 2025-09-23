import { readBody } from 'h3'
import { setSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = body?.email || 'user@example.com'
  const role = body?.role || 'teacher'
  const user = { email, role }
  setSession(event, user as any)
  return { user }
})

