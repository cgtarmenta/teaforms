import { readBody } from 'h3'
import { getUser, requireRole } from '../../utils/auth'

export default defineEventHandler( async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['clinician','sysadmin'])) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const body = await readBody(event)
  const title = body?.title
  const status = body?.status || 'active'
  if (!title) {
    setResponseStatus(event, 400)
    return { error: 'title required' }
  }
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const created = await forms.create({ title, status })
  return created
})

