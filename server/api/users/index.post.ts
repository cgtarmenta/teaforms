import { readBody } from 'h3'
import { getUser, requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['sysadmin'])) { setResponseStatus(event,403); return { error:'forbidden' } }
  const body = await readBody(event)
  const email = body?.email
  const role = body?.role || 'teacher'
  const active = body?.active ?? true
  if (!email) { setResponseStatus(event,400); return { error:'email required' } }
  const { ensureRepos } = await import('#repos')
  const { users } = await ensureRepos()
  const created = await users.create({ email, role, active })
  setResponseStatus(event,201)
  return created
})

