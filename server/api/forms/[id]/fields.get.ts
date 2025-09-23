export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const items = await forms.listFields(id)
  return items
})

