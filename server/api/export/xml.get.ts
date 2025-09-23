import { create } from 'xmlbuilder2'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const { ensureRepos } = await import('#repos')
  const { episodes } = await ensureRepos()
  let list = await episodes.list()
  const formId = q.formId as string | undefined
  const from = q.from as string | undefined
  const to = q.to as string | undefined
  const context = q.context as string | undefined
  if (formId) list = list.filter(e => e.formId === formId)
  if (context) list = list.filter(e => e.context === context)
  if (from) { const f=new Date(from).getTime(); if(!Number.isNaN(f)) list=list.filter(e=> new Date(e.timestamp).getTime()>=f) }
  if (to) { const t=new Date(to).getTime(); if(!Number.isNaN(t)) list=list.filter(e=> new Date(e.timestamp).getTime()<=t) }

  const root = create({ version:'1.0', encoding:'UTF-8' }).ele('episodes', { xmlns:'urn:episode-registry:v1' })
  for (const e of list) {
    const ep = root.ele('episode', { id: e.id })
    ep.ele('timestamp').txt(new Date(e.timestamp).toISOString())
    ep.ele('formId').txt(String(e.formId))
    ep.ele('context').txt(String(e.context||''))
    ep.ele('createdBy').txt(String(e.createdBy||''))
    const data = ep.ele('data')
    if (e.data && typeof e.data==='object') {
      for (const [k,v] of Object.entries(e.data)) data.ele('field', { id:k }).txt(String(v))
    }
  }
  const xml = root.end({ prettyPrint:true })
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Content-Disposition', 'attachment; filename="episodes.xml"')
  return xml
})

