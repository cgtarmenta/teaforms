import { readBody } from 'h3'
import { getUser, requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!requireRole(user, ['clinician','sysadmin'])) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const id = event.context.params?.id as string
  const fieldId = event.context.params?.fieldId as string
  const patch = await readBody(event)
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const updated = await forms.updateField(id, fieldId, patch)
  if (!updated) {
    setResponseStatus(event, 404)
    return { error: 'not found' }
  }
  return updated
})

