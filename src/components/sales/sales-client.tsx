'use client'

import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { SaleModal } from '@/components/sales/sale-modal'
import { formatCurrency } from '@/lib/utils'

type ProductVariant = {
  id: string
  size: string | null
  color: string | null
  stock: number
}

type Product = {
  id: string
  name: string
  sku: string
  sellingPrice: number
  costPrice: number
  variants: ProductVariant[]
}

type SaleItem = {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: {
    name: string
    sku: string
  }
}

type Sale = {
  id: string
  invoiceNumber: string
  date: string
  total: number
  paymentMethod: string
  salesChannel: string
  items: SaleItem[]
}

type SalesClientProps = {
  initialSales: Sale[]
  products: Product[]
}

export function SalesClient({ initialSales, products }: SalesClientProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleDownloadTemplate = () => {
    window.location.href = '/api/sales/template?format=sample'
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('csvFile', file)

    try {
      const res = await fetch('/api/sales/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setImportResult({
          success: data.success || 0,
          errors: data.errors || [],
        })

        if (data.success > 0) {
          window.location.reload()
        }
      } else {
        setImportResult({ success: 0, errors: [data.message || 'Import failed'] })
      }
    } catch (err) {
      setImportResult({ success: 0, errors: ['Terjadi kesalahan jaringan'] })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const avgOrderValue = sales.length > 0
    ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length
    : 0

  const handleRecordSale = () => {
    setIsModalOpen(true)
  }

  const handleSaleSaved = () => {
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Transactions</p>
          <h1 className="page-title">Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record transactions and keep your inventory truth in sync.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download template
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCSV}
              disabled={importing}
            />
          </label>
          <button className="button-primary" onClick={handleRecordSale}>
            <span className="mr-1">+</span> Record sale
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`rounded-lg border p-4 ${importResult.errors.length > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-green-50 border-green/20'}`}>
          <p className={`text-sm font-medium ${importResult.errors.length > 0 ? 'text-destructive' : 'text-green-700'}`}>
            Import selesai: {importResult.success} berhasil, {importResult.errors.length} error
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-destructive">
              {importResult.errors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 10 && (
                <li>+{importResult.errors.length - 10} more errors</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Transactions recorded</p>
          <p className="mt-3 text-2xl font-semibold">{sales.length || 0}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Average order value</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(avgOrderValue)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Payment success</p>
          <p className="mt-3 text-2xl font-semibold">98.2%</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="section-heading p-5">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2 className="section-title">Transaction history</h2>
          </div>
          <button className="button-secondary">Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Revenue</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="font-semibold">{sale.invoiceNumber}</td>
                  <td>{sale.items[0]?.product?.name || 'Multiple products'}</td>
                  <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</td>
                  <td>{formatCurrency(sale.total)}</td>
                  <td>{sale.paymentMethod}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No sales recorded yet. Import from CSV or click {'"Record sale"'} to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaleSaved}
        products={products}
      />
    </div>
  )
}
