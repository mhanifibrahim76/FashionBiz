'use client'

import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Download } from 'lucide-react'

type ReportData = {
  title: string
  headers: string[]
  rows: any[][]
  filename: string
  additionalInfo?: Record<string, any>
}

async function exportReportToPDF(reportUrl: string) {
  const res = await fetch(reportUrl + '&format=json')
  if (!res.ok) {
    alert('Gagal mengekspor PDF')
    return
  }

  const data: ReportData = await res.json()

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()

  pdf.setFontSize(20)
  pdf.text(data.title, pageWidth / 2, 40, { align: 'center' })

  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 60, { align: 'center' })

  pdf.autoTable({
    startY: 75,
    head: [data.headers],
    body: data.rows.filter((row) => row.length > 0 && typeof row[0] !== 'string' || (row[0] !== 'Summary' && row.length === data.headers.length)),
    theme: 'striped',
    styles: { fontSize: 8, cellWidth: 'wrap' },
    headStyles: { fillColor: [13, 28, 44], fontSize: 9 },
    margin: { left: 20, right: 20 },
  })

  if (data.additionalInfo) {
    const startY = (pdf as any).lastAutoTable?.finalY || 200
    pdf.setFontSize(11)
    pdf.text('Summary', 20, startY + 25)
    pdf.setFontSize(9)
    Object.entries(data.additionalInfo).forEach(([key, value], i) => {
      pdf.text(`${key}: ${value}`, 20, startY + 40 + i * 14)
    })
  }

  pdf.save(data.filename + '.pdf')
}

export function PdfExportButton({ reportType, range }: { reportType: string; range: string }) {
  const handleClick = async () => {
    const url = `/api/reports?type=${reportType}&range=${range}`
    await exportReportToPDF(url)
  }

  return (
    <button
      onClick={handleClick}
      className="button-secondary text-xs"
    >
      <Download className="mr-1 size-3" />
      PDF
    </button>
  )
}
