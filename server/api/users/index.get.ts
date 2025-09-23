import { getUser, requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['sysadmin'])) { setResponseStatus(event,403); return { error:'forbidden' } }
  const { ensureRepos } = await import('#repos')
  const { users } = await ensureRepos()
  return users.list()
})

