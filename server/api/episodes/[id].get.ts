export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const { ensureRepos } = await import('#repos')
  const { episodes } = await ensureRepos()
  const e = await episodes.get(id)
  if (!e) { setResponseStatus(event, 404); return { error: 'not found' } }
  return e
})

