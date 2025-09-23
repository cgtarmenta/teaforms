import { readBody } from 'h3'
import { getUser, requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['clinician','sysadmin'])) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const id = event.context.params?.id as string
  const body = await readBody(event)
  if (!body?.label || !body?.type) {
    setResponseStatus(event, 400)
    return { error: 'label and type are required' }
  }
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const created = await forms.createField(id, body)
  setResponseStatus(event, 201)
  return created
})

