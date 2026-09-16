'use client'

import { useState } from 'react'
import { ReorderModal } from '@/components/products/reorder-modal'

type Variant = {
  id: string
  size: string | null
  color: string | null
  stock: number
}

type Category = {
  name: string
}

type Product = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  status: string
  category: Category | null
  variants: Variant[]
}

type Supplier = {
  id: string
  name: string
  contact: string | null
  address: string | null
}

type LowStockAlertsProps = {
  products: Product[]
  suppliers: Supplier[]
  pendingPurchases: { productId: string; quantity: number }[]
}

export function LowStockAlerts({ products, suppliers, pendingPurchases }: LowStockAlertsProps) {
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null)
  const [reorderModalOpen, setReorderModalOpen] = useState(false)

  const onOrderMap = new Map<string, number>()
  pendingPurchases.forEach((pp) => {
    onOrderMap.set(pp.productId, (onOrderMap.get(pp.productId) || 0) + pp.quantity)
  })

  const getOnOrder = (productId: string) => onOrderMap.get(productId) || 0

  const openReorderModal = (product: Product) => {
    setReorderProduct(product)
    setReorderModalOpen(true)
  }

  const closeReorderModal = () => {
    setReorderProduct(null)
    setReorderModalOpen(false)
  }

  const handleReorder = async (data: {
    productId: string
    supplierId: string
    items: { variantId: string; quantity: number; unitPrice: number }[]
    notes: string
  }) => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.message || 'Gagal membuat reorder')
    }

    const result = await res.json()
    alert(`Reorder dibuat: ${result.purchaseNumber}`)
  }

  const categoryColor = (category: string | null | undefined): string => {
    if (!category) return 'bg-slate-900'
    const map: Record<string, string> = {
      Kaos: 'bg-primary',
      Hoodie: 'bg-slate-400',
      Celana: 'bg-[#c9b58a]',
      Jaket: 'bg-blue-900',
      Kemeja: 'bg-blue-500',
    }
    return map[category] || 'bg-slate-900'
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Action needed</p>
            <h2 className="section-title">Low stock alerts</h2>
          </div>
          <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
            {products.length} alerts
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {products.slice(0, 5).map((p) => {
            const onOrder = getOnOrder(p.id)
            return (
              <div className="alert-row" key={p.id}>
                <div className={`product-swatch ${categoryColor(p.category?.name)}`}>
                  <span>{p.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.variants.reduce((sum, v) => sum + v.stock, 0)} pcs left - min {p.minStock}
                    {onOrder > 0 && (
                      <span className="ml-1 text-accent-foreground">· On Order: {onOrder} pcs</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => openReorderModal(p)}
                  className="button-small"
                >
                  Reorder
                </button>
              </div>
            )
          })}
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Semua stok dalam keadaan baik.
            </p>
          )}
        </div>
      </section>

      <ReorderModal
        isOpen={reorderModalOpen}
        onClose={closeReorderModal}
        product={reorderProduct}
        suppliers={suppliers}
        onReorder={handleReorder}
      />
    </>
  )
}