'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export type ProductFormData = {
  id?: string
  name: string
  category: string
  sku: string
  costPrice: number
  sellingPrice: number
  stock: number
  minStock: number
  variants?: { stock: number }[]
  categoryData?: { name: string }
}

export type SavedProduct = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  status?: string
  category: { name: string }
  variants: { id: string; size: string | null; color: string | null; colorCode: string | null; stock: number }[]
}

type ProductModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (product: SavedProduct) => void
  product?: ProductFormData | null
  categories: string[]
}

export function ProductModal({ isOpen, onClose, onSave, product, categories }: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(
    product || {
      name: '',
      category: categories[0] || '',
      sku: '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 10,
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(product || {
      name: '',
      category: categories[0] || '',
      sku: '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 10,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = product?.id ? `/api/products/${product.id}` : '/api/products'
      const method = product?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to save product')
      }

      const saved = await res.json()
      onSave(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div role="dialog" aria-modal="true" className="modal">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{product?.id ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label>Product name</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kaos Oversize Hitam"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Category</label>
              <select
                className="select-compact w-full"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label>SKU</label>
              <input
                className="field"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. KS-BLK-01"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Cost price</label>
              <input
                type="number"
                className="field"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                placeholder="55000"
                required
              />
            </div>
            <div>
              <label>Selling price</label>
              <input
                type="number"
                className="field"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                placeholder="89900"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Current stock</label>
              <div className="mt-1 flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground">
                {form.stock} pcs
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Stock is managed through Inventory and Purchases.
              </p>
            </div>
            <div>
              <label>Minimum stock</label>
              <input
                type="number"
                className="field"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                placeholder="10"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="button-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="button-primary flex-1">
              {loading ? 'Saving...' : product?.id ? 'Update' : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
