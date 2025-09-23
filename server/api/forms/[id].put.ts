import { readBody } from 'h3'
import { getUser, requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['clinician','sysadmin'])) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const id = event.context.params?.id as string
  const body = await readBody(event)
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const f = await forms.update(id, { title: body?.title, status: body?.status })
  if (!f) {
    setResponseStatus(event, 404)
    return { error: 'not found' }
  }
  return f
})

