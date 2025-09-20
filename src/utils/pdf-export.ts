import jsPDF from 'jspdf'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Episode } from '../server/routes/api/episodes.js'

interface ExportOptions {
  title?: string
  startDate?: string
  endDate?: string
  generatedBy?: string
}

export async function exportToPDF(
  episodes: Episode[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const {
    title = 'Registro de Episodios Conductuales',
    startDate,
    endDate,
    generatedBy = 'Sistema'
  } = options

  // Document styling
  const primaryColor = [29, 78, 216] // Blue-700
  const headerHeight = 40
  const margin = 15
  const lineHeight = 7
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (margin * 2)

  // Header
  doc.setFillColor(...primaryColor as [number, number, number])
  doc.rect(0, 0, pageWidth, headerHeight, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text(title, pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(10)
  const dateRange = startDate && endDate
    ? `${format(parseISO(startDate), 'dd/MM/yyyy')} - ${format(parseISO(endDate), 'dd/MM/yyyy')}`
    : 'Todos los registros'
  doc.text(dateRange, pageWidth / 2, 25, { align: 'center' })
  
  doc.setTextColor(200, 200, 200)
  doc.text(`Generado por: ${generatedBy}`, pageWidth / 2, 32, { align: 'center' })

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Summary section
  let yPosition = headerHeight + 10
  doc.setFontSize(14)
  doc.text('Resumen', margin, yPosition)
  
  yPosition += 8
  doc.setFontSize(10)
  doc.text(`Total de episodios: ${episodes.length}`, margin, yPosition)
  
  // Context summary
  const contextCounts: Record<string, number> = {}
  episodes.forEach(ep => {
    contextCounts[ep.context] = (contextCounts[ep.context] || 0) + 1
  })
  
  yPosition += 6
  doc.text('Por contexto:', margin, yPosition)
  Object.entries(contextCounts).forEach(([context, count]) => {
    yPosition += 5
    const contextLabel = {
      'class': 'Clase',
      'recess': 'Recreo',
      'lunch': 'Almuerzo',
      'hall': 'Pasillo',
      'other': 'Otro'
    }[context] || context
    doc.text(`  • ${contextLabel}: ${count}`, margin + 5, yPosition)
  })

  // Start new page for table
  doc.addPage()
  yPosition = margin

  // Table headers
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  
  const columns = [
    { label: 'Fecha/Hora', width: 35 },
    { label: 'Docente', width: 35 },
    { label: 'Contexto', width: 25 },
    { label: 'Disparador', width: 50 },
    { label: 'Respuesta', width: 50 },
    { label: 'Duración', width: 25 },
    { label: 'Resolución', width: 45 }
  ]

  // Draw table header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F')
  
  let xPosition = margin
  columns.forEach(col => {
    doc.text(col.label, xPosition + 2, yPosition)
    xPosition += col.width
  })

  yPosition += lineHeight
  doc.setFont('helvetica', 'normal')

  // Table rows
  episodes.forEach((episode, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
      
      // Redraw headers on new page
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPosition - 5, contentWidth, 8, 'F')
      
      xPosition = margin
      columns.forEach(col => {
        doc.text(col.label, xPosition + 2, yPosition)
        xPosition += col.width
      })
      
      yPosition += lineHeight
      doc.setFont('helvetica', 'normal')
    }

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition - 5, contentWidth, 7, 'F')
    }

    // Format date
    const date = format(parseISO(episode.timestamp), 'dd/MM/yy HH:mm', { locale: es })
    
    // Format context
    const contextLabel = {
      'class': 'Clase',
      'recess': 'Recreo',
      'lunch': 'Almuerzo',
      'hall': 'Pasillo',
      'other': 'Otro'
    }[episode.context] || episode.context

    // Draw row
    xPosition = margin
    const rowData = [
      { text: date, width: columns[0].width },
      { text: episode.teacherName || 'N/A', width: columns[1].width },
      { text: contextLabel, width: columns[2].width },
      { text: truncateText(episode.trigger, 45), width: columns[3].width },
      { text: truncateText(episode.response, 45), width: columns[4].width },
      { text: episode.duration || 'N/A', width: columns[5].width },
      { text: truncateText(episode.resolution || 'N/A', 40), width: columns[6].width }
    ]

    rowData.forEach(cell => {
      doc.text(cell.text, xPosition + 2, yPosition)
      xPosition += cell.width
    })

    yPosition += lineHeight
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // Convert to Buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}