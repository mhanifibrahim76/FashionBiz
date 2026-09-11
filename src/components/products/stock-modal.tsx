'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type StockModalProps = {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onUpdated: (newStock: number) => void
}

export function StockModal({ isOpen, onClose, productId, productName, onUpdated }: StockModalProps) {
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const qtyInput = form.elements.namedItem('quantity') as HTMLInputElement
    const notesInput = form.elements.namedItem('notes') as HTMLInputElement
    const qty = parseInt(qtyInput.value, 10)

    if (isNaN(qty) || qty <= 0) {
      alert('Jumlah harus berupa angka positif')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, notes: notesInput.value }),
      })

      const data = await res.json()

      if (res.ok) {
        onUpdated(data.newStock)
        onClose()
      } else {
        alert(data.message || 'Gagal menambah stok')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div role="dialog" aria-modal="true" className="modal">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tambah stok</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Produk: <span className="font-semibold text-foreground">{productName}</span>
            </p>
          </div>
          <div>
            <label>Jumlah (pcs)</label>
            <input
              name="quantity"
              type="number"
              min="1"
              className="field"
              placeholder="50"
              required
            />
          </div>
          <div>
            <label>Catatan (opsional)</label>
            <input
              name="notes"
              type="text"
              className="field"
              placeholder="e.g. Restock from supplier"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="button-secondary flex-1">Batal</button>
            <button type="submit" disabled={submitting} className="button-primary flex-1">
              {submitting ? 'Menambah...' : 'Tambah stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
