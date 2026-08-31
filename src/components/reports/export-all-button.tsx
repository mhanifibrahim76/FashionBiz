'use client'

import { Download } from 'lucide-react'

export function ExportAllButton({ range = '30d' }: { range?: string }) {
  const handleExportAll = async () => {
    const types = ['sales', 'profit', 'inventory', 'products']

    for (const type of types) {
      const url = '/api/reports?type=' + type + '&range=' + range
      const res = await fetch(url)
      if (res.ok) {
        const blob = await res.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = type + '-report.csv'
        a.click()
        URL.revokeObjectURL(downloadUrl)
      }
    }
  }

  return (
    <button onClick={handleExportAll} className="button-primary">
      <Download className="mr-1 size-4" /> Export all
    </button>
  )
}
