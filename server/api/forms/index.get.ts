export default defineEventHandler(async (event) => {
  const { ensureRepos } = await import('#repos')
  const { forms } = await ensureRepos()
  const list = await forms.list()
  return list
})

