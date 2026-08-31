'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string
  sellingPrice: number
  variants: { id: string; size: string | null; color: string | null; stock: number }[]
}

type SaleModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  products: Product[]
}

export function SaleModal({ isOpen, onClose, onSave, products }: SaleModalProps) {
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedProduct = products.find((p) => p.id === productId)
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === variantId)
  const unitPrice = selectedProduct?.sellingPrice ?? 0
  const total = Math.max(0, unitPrice * quantity - discount)

  const handleSubmit = async () => {
    if (!productId || !selectedVariant) return
    if (selectedVariant.stock < quantity) {
      alert('Stok tidak cukup')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
          discount,
          notes,
          paymentMethod,
          salesChannel: 'Toko Fisik',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        onSave()
        onClose()
      } else {
        alert(data.message || 'Gagal menyimpan penjualan')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setProductId('')
    setVariantId('')
    setQuantity(1)
    setDiscount(0)
    setNotes('')
    setPaymentMethod('Cash')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold">Record New Sale</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quick entry for in-store transactions.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Product</label>
            <select
              value={productId}
              onChange={(e) => {
                const p = products.find((prod) => prod.id === e.target.value)
                setProductId(e.target.value)
                setVariantId(p?.variants[0]?.id || '')
              }}
              className="select"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          {selectedProduct && selectedProduct.variants.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Variant</label>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="select"
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.size && v.size !== 'One Size' ? v.size : ''} {v.color || ''} ({v.stock} in stock)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Unit Price</label>
              <input
                type="number"
                value={unitPrice}
                readOnly
                className="field bg-muted"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Discount (Rp)</label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="field"
            />
          </div>

          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="select">
              <option value="Cash">Tunai</option>
              <option value="Transfer">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="Card">Kartu Debit/Kredit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bawa kemasan kertas"
              className="field"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <button onClick={handleClose} className="button-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!productId || !selectedVariant || saving}
            className="button-primary"
          >
            {saving ? 'Saving...' : 'Record Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}
