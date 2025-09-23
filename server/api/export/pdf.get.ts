import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const { ensureRepos } = await import('#repos')
  const { episodes, forms } = await ensureRepos()
  let list = await episodes.list()
  const formId = q.formId as string | undefined
  const from = q.from as string | undefined
  const to = q.to as string | undefined
  const context = q.context as string | undefined
  if (formId) list = list.filter(e => e.formId === formId)
  if (context) list = list.filter(e => e.context === context)
  if (from) { const f=new Date(from).getTime(); if(!Number.isNaN(f)) list=list.filter(e=> new Date(e.timestamp).getTime()>=f) }
  if (to) { const t=new Date(to).getTime(); if(!Number.isNaN(t)) list=list.filter(e=> new Date(e.timestamp).getTime()<=t) }

  const formsList = await (forms.list?.() ?? [])
  const formMap = new Map(formsList.map((f:any)=>[f.id, f.title]))
  const rawCookie = event.node.req.headers.cookie || ''
  const localeCookie = rawCookie.split('locale=')[1]?.split(';')[0]
  const accept = String(event.node.req.headers['accept-language'] || '')
  const locale = localeCookie || (accept.toLowerCase().startsWith('en')?'en':'es')
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle:'medium', timeStyle:'short' })

  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const pageSize:[number,number] = [595.28,841.89]
  let page = doc.addPage(pageSize)
  const margin=40
  const cellPad = 2
  const contentWidth = page.getWidth()-margin*2
  let y = page.getHeight()-margin
  const title = locale==='es'?'Exportación de episodios':'Episodes Export'
  const headers = locale==='es' ? ['ID','Fecha','Formulario','Contexto','Autor'] : ['ID','Timestamp','Form','Context','By']
  const colWidths = [60,160,220,75,60]
  const colX = [margin]
  for (let i=1;i<colWidths.length;i++) colX[i] = colX[i-1] + colWidths[i-1]

  function drawHeader(){
    page.drawText(title, { x:margin, y, size:16, font:fontBold, color: rgb(0,0,0) })
    y-=24
    headers.forEach((h,i)=> page.drawText(h, { x:colX[i]+cellPad, y, size:12, font:fontBold }))
    y-=16
    page.drawLine({ start:{x:margin,y}, end:{x:margin+contentWidth,y}, thickness:1, color:rgb(0.6,0.6,0.6) })
    y-=6
  }
  function newPage(){ page=doc.addPage(pageSize); y=page.getHeight()-margin; drawHeader() }

  function wrapText(text:string, maxWidth:number, size:number, maxLines=2) {
    const words = String(text||'').split(/\s+/)
    const lines:string[] = []
    let line=''
    const ellipsis = '…'
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      const wWidth = font.widthOfTextAtSize(test, size)
      if (wWidth <= maxWidth) {
        line = test
      } else {
        if (line) lines.push(line)
        line = w
        if (lines.length >= maxLines-1) {
          let trimmed = line
          while (font.widthOfTextAtSize(trimmed + ellipsis, size) > maxWidth && trimmed.length>0) {
            trimmed = trimmed.slice(0, -1)
          }
          lines.push(trimmed + ellipsis)
          return lines
        }
      }
    }
    if (line) lines.push(line)
    if (lines.length>maxLines) return lines.slice(0, maxLines)
    return lines
  }

  drawHeader()
  for (const e of list) {
    const rowVals = [ String(e.id).slice(0,12), dtf.format(new Date(e.timestamp)), String(formMap.get(e.formId)||e.formId), String(e.context||''), String(e.createdBy||'') ]
    const linesPerCol = rowVals.map((txt,i)=> wrapText(txt, colWidths[i]-cellPad*2, 10, i===2?3:2))
    const lineHeights = linesPerCol.map(ls=> ls.length)
    const rowHeight = Math.max(...lineHeights) * 12 + 4
    if (y - rowHeight < 50) newPage()
    const rowTop = y + 10
    const rowBottom = y - rowHeight + 10
    page.drawLine({ start:{x:margin,y:rowTop}, end:{x:margin,y:rowBottom}, thickness:0.5, color: rgb(0.85,0.85,0.85) })
    page.drawLine({ start:{x:margin+contentWidth,y:rowTop}, end:{x:margin+contentWidth,y:rowBottom}, thickness:0.5, color: rgb(0.85,0.85,0.85) })
    for (let i=1;i<colX.length-1;i++) {
      page.drawLine({ start:{x:colX[i],y:rowTop}, end:{x:colX[i],y:rowBottom}, thickness:0.5, color: rgb(0.9,0.9,0.9) })
    }
    for (let i=0;i<linesPerCol.length;i++) {
      const ls = linesPerCol[i]
      let ty = y
      for (const line of ls) {
        page.drawText(line, { x:colX[i]+cellPad, y:ty, size:10, font, color: rgb(0,0,0) })
        ty -= 12
      }
    }
    page.drawLine({ start:{x:margin,y:rowBottom}, end:{x:margin+contentWidth,y:rowBottom}, thickness:0.5, color: rgb(0.9,0.9,0.9) })
    y -= rowHeight
  }
  const bytes = await doc.save()
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'attachment; filename="episodes.pdf"')
  return Buffer.from(bytes)
})

