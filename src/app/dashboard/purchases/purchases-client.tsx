'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, Truck } from 'lucide-react'

type Supplier = {
  id: string
  name: string
}

type Product = {
  id: string
  name: string
}

type Variant = {
  id: string
  size: string | null
  color: string | null
}

type PurchaseItem = {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: Product
  variant: Variant | null
}

type Purchase = {
  id: string
  purchaseNumber: string
  date: Date
  status: string
  total: number
  supplier: Supplier | null
  items: PurchaseItem[]
}

type Tab = 'purchases' | 'suppliers'

export function PurchasesClient({ initialPurchases }: { initialPurchases: Purchase[] }) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('purchases')

  const handleReceive = async (purchase: Purchase) => {
    if (!confirm(`Terima barang untuk ${purchase.purchaseNumber}? Stok akan diperbarui.`)) return

    setReceivingId(purchase.id)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: purchase.id }),
      })

      const data = await res.json()

      if (res.ok) {
        setPurchases((prev) =>
          prev.map((p) =>
            p.id === purchase.id ? { ...p, status: 'COMPLETED' } : p
          )
        )
        alert(`Barang diterima: ${purchase.purchaseNumber}`)
      } else {
        alert(data.message || 'Gagal menerima barang')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setReceivingId(null)
    }
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0)
  const pendingCount = purchases.filter((p) => p.status === 'PENDING').length
  const completedCount = purchases.filter((p) => p.status === 'COMPLETED').length

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Keuangan</p>
          <h1 className="page-title">Pembelian</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pesanan supplier dan proses penerimaan barang.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'purchases'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="size-4" />
          Purchase History
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'suppliers'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="size-4" />
          Supplier Management
        </button>
      </div>

      {activeTab === 'purchases' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs text-muted-foreground">Total purchases</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalPurchases)}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="mt-3 text-2xl font-semibold">{pendingCount}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-3 text-2xl font-semibold">{completedCount}</p>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="section-heading p-5">
              <div>
                <p className="eyebrow">Orders</p>
                <h2 className="section-title">Purchase history</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{new Date(purchase.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="font-semibold">{purchase.supplier?.name || '—'}</td>
                      <td>{purchase.items.length} products</td>
                      <td>{formatCurrency(purchase.total)}</td>
                      <td>
                        <span className={`status-badge ${purchase.status === 'COMPLETED' ? 'status-good' : purchase.status === 'PENDING' ? 'status-warn' : 'status-risk'}`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td>
                        {purchase.status === 'PENDING' ? (
                          <button
                            onClick={() => handleReceive(purchase)}
                            disabled={receivingId === purchase.id}
                            className="text-xs font-semibold text-accent-foreground hover:underline disabled:opacity-50"
                          >
                            {receivingId === purchase.id ? 'Memproses...' : 'Receive'}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Diterima</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchases recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'suppliers' && (
        <div className="panel overflow-hidden">
          <div className="section-heading p-5">
            <div>
              <p className="eyebrow">Master data</p>
              <h2 className="section-title">Supplier Management</h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Kelola daftar supplier untuk kebutuhan reorder dan pembelian.
              Akses penuh ke fitur Supplier berada di halaman Supplier terpisah.
            </p>
            <a
              href="/dashboard/suppliers"
              className="button-primary mt-3 inline-flex"
            >
              Buka Supplier Management
            </a>
          </div>
        </div>
      )}
    </div>
  )
}