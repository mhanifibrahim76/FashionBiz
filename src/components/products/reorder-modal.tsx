'use client'

import { useState } from 'react'
import { X, Truck } from 'lucide-react'

type Variant = {
  id: string
  size: string | null
  color: string | null
  stock: number
}

type Supplier = {
  id: string
  name: string
  contact: string | null
  address: string | null
}

type Product = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  variants: Variant[]
}

type ReorderModalProps = {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  suppliers: Supplier[]
  onReorder: (data: {
    productId: string
    supplierId: string
    items: { variantId: string; quantity: number; unitPrice: number }[]
    notes: string
  }) => Promise<void>
}

export function ReorderModal({ isOpen, onClose, product, suppliers, onReorder }: ReorderModalProps) {
  const [supplierId, setSupplierId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !product) return null

  const handleQuantityChange = (variantId: string, value: string) => {
    const qty = parseInt(value, 10) || 0
    setQuantities((prev) => ({ ...prev, [variantId]: qty }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const items = product.variants
      .map((v) => ({
        variantId: v.id,
        quantity: quantities[v.id] || 0,
        unitPrice: product.costPrice,
      }))
      .filter((i) => i.quantity > 0)

    if (items.length === 0) {
      setError('Masukkan quantity minimal 1 varian')
      return
    }

    setSubmitting(true)
    try {
      await onReorder({
        productId: product.id,
        supplierId,
        items,
        notes,
      })
      setSupplierId('')
      setQuantities({})
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)
  const estimatedCost = totalItems * product.costPrice

  return (
    <div className="modal-backdrop" role="presentation">
      <div role="dialog" aria-modal="true" className="modal max-w-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Reorder Product</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">Produk</p>
            <p className="font-semibold">{product.name}</p>
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          </div>

          <div>
            <label>Supplier (Opsional)</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="select-compact mt-1"
            >
              <option value="">Pilih supplier (opsional)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Kosongkan jika stok berasal dari produksi sendiri atau tidak ingin mencatat supplier.
            </p>
          </div>

          <div>
            <label>Quantity per Varian</label>
            <div className="mt-2 flex flex-col gap-2">
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {v.size || '-'} / {v.color || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Stok: {v.stock} pcs</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantities[v.id] || ''}
                    onChange={(e) => handleQuantityChange(v.id, e.target.value)}
                    className="field w-24"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>Catatan (opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field mt-1"
              placeholder="e.g. Prioritas tinggi, dikirim cepat"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total item</span>
              <span className="font-semibold">{totalItems} pcs</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimasi biaya</span>
              <span className="font-semibold">
                Rp {estimatedCost.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="button-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="button-primary flex-1">
              {submitting ? 'Menyimpan...' : 'Buat Reorder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}