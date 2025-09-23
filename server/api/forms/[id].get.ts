export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const f = await forms.get(id)
  if (!f) {
    setResponseStatus(event, 404)
    return { error: 'not found' }
  }
  return f
})

