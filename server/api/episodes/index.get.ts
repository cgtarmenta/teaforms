export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const { ensureRepos } = await import('#repos')
  const { episodes } = await ensureRepos()
  let list = await episodes.list()
  const formId = q.formId as string | undefined
  const from = q.from as string | undefined
  const to = q.to as string | undefined
  const context = q.context as string | undefined
  const sort = (q.sort as string | undefined) || 'timestamp'
  const order = ((q.order as string | undefined) || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const all = String(q.all || '').toLowerCase() === 'true'
  if (formId) list = list.filter(e => e.formId === formId)
  if (context) list = list.filter(e => e.context === context)
  if (from) {
    const f = new Date(from).getTime(); if (!Number.isNaN(f)) list = list.filter(e=> new Date(e.timestamp).getTime() >= f)
  }
  if (to) {
    const t = new Date(to).getTime(); if (!Number.isNaN(t)) list = list.filter(e=> new Date(e.timestamp).getTime() <= t)
  }
  // sorting
  list.sort((a:any,b:any)=>{
    let av:any, bv:any
    switch (sort) {
      case 'formId': av = a.formId; bv = b.formId; break
      case 'context': av = a.context; bv = b.context; break
      case 'createdBy': av = a.createdBy || ''; bv = b.createdBy || ''; break
      case 'timestamp':
      default:
        av = new Date(a.timestamp).getTime(); bv = new Date(b.timestamp).getTime(); break
    }
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
  // Teacher restriction
  const { getUser } = await import('../../utils/auth')
  const user = getUser(event)
  if (user?.role === 'teacher') {
    list = list.filter(e => !user.email || e.createdBy === user.email)
  }
  // All data for sysadmin analytics
  if (all && user?.role === 'sysadmin') {
    return { items: list, total: list.length, page: 1, pageSize: list.length }
  }
  const page = Math.max(1, parseInt(String(q.page||'1'),10) || 1)
  const pageSize = Math.max(1, Math.min(100, parseInt(String(q.pageSize||'20'),10) || 20))
  const total = list.length
  const start = (page-1)*pageSize
  const items = list.slice(start, start+pageSize)
  return { items, total, page, pageSize }
})

