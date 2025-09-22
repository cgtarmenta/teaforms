import { Router } from 'express'
import { ensureRepos } from '../repositories/index.js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { create } from 'xmlbuilder2'

export const exportRouter = Router()

function filterEpisodes(list, { formId, from, to, context }) {
  let out = list
  if (formId) out = out.filter((e) => e.formId === formId)
  if (context) out = out.filter((e) => e.context === context)
  if (from) {
    const f = new Date(from).getTime()
    if (!Number.isNaN(f)) out = out.filter((e) => new Date(e.timestamp).getTime() >= f)
  }
  if (to) {
    const t = new Date(to).getTime()
    if (!Number.isNaN(t)) out = out.filter((e) => new Date(e.timestamp).getTime() <= t)
  }
  return out
}

exportRouter.get('/pdf', async (req, res) => {
  const { episodes, forms } = await ensureRepos()
  const list = await episodes.list()
  const q = {
    formId: req.query.formId,
    from: req.query.from,
    to: req.query.to,
    context: req.query.context,
  }
  const filtered = filterEpisodes(list, q)
  const formsList = await (forms.list?.() ?? [])
  const formMap = new Map(formsList.map((f) => [f.id, f.title]))

  // Locale detection similar to SSR
  const rawCookie = req.headers.cookie || ''
  const localeCookie = rawCookie.split('locale=')[1]?.split(';')[0]
  const accept = String(req.headers['accept-language'] || '')
  const locale = localeCookie || (accept.toLowerCase().startsWith('en') ? 'en' : 'es')
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })

  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageSize = [595.28, 841.89] // A4 portrait
  let page = doc.addPage(pageSize)
  const margin = 40
  const contentWidth = page.getWidth() - margin * 2
  let y = page.getHeight() - margin

  const t = locale === 'es' ? 'Exportación de episodios' : 'Episodes Export'
  const headers = locale === 'es' ? ['ID', 'Fecha', 'Formulario', 'Contexto', 'Autor'] : ['ID', 'Timestamp', 'Form', 'Context', 'By']
  const colWidths = [60, 160, 180, 60, 55]
  const colX = [margin]
  for (let i = 1; i < colWidths.length; i++) colX[i] = colX[i - 1] + colWidths[i - 1]

  function drawHeader() {
    page.drawText(t, { x: margin, y, size: 16, font: fontBold, color: rgb(0, 0, 0) })
    y -= 24
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], { x: colX[i], y, size: 12, font: fontBold })
    }
    y -= 16
    // underline
    page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 8
  }

  function newPage() {
    page = doc.addPage(pageSize)
    y = page.getHeight() - margin
    drawHeader()
  }

  drawHeader()
  for (const e of filtered) {
    if (y < 60) newPage()
    const formTitle = formMap.get(e.formId) || String(e.formId)
    const row = [String(e.id).slice(0, 8), dtf.format(new Date(e.timestamp)), String(formTitle).slice(0, 28), String(e.context || ''), String(e.createdBy || '')]
    for (let i = 0; i < row.length; i++) {
      page.drawText(row[i], { x: colX[i], y, size: 10, font })
    }
    y -= 14
  }

  const bytes = await doc.save()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="episodes.pdf"')
  res.send(Buffer.from(bytes))
})

exportRouter.get('/xml', async (req, res) => {
  const { episodes } = await ensureRepos()
  const list = await episodes.list()
  const filtered = filterEpisodes(list, {
    formId: req.query.formId,
    from: req.query.from,
    to: req.query.to,
    context: req.query.context,
  })

  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('episodes', { xmlns: 'urn:episode-registry:v1' })
  for (const e of filtered) {
    const ep = root.ele('episode', { id: e.id })
    ep.ele('timestamp').txt(new Date(e.timestamp).toISOString())
    ep.ele('formId').txt(String(e.formId))
    ep.ele('context').txt(String(e.context || ''))
    ep.ele('createdBy').txt(String(e.createdBy || ''))
    const data = ep.ele('data')
    if (e.data && typeof e.data === 'object') {
      for (const [k, v] of Object.entries(e.data)) {
        data.ele('field', { id: k }).txt(String(v))
      }
    }
  }
  const xml = root.end({ prettyPrint: true })
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Content-Disposition', 'attachment; filename="episodes.xml"')
  res.send(xml)
})
