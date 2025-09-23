import { getUser, requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['sysadmin'])) { setResponseStatus(event,403); return { error:'forbidden' } }
  const id = event.context.params?.id as string
  const { ensureRepos } = await import('#repos')
  const { users } = await ensureRepos()
  const removed = await users.remove(id)
  if (!removed) { setResponseStatus(event,404); return { error:'not found' } }
  return removed
})

