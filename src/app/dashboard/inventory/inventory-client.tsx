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

type InventoryClientProps = {
  products: Product[]
  suppliers: Supplier[]
  pendingPurchases: { productId: string; quantity: number }[]
}

export function InventoryClient({ products, suppliers, pendingPurchases }: InventoryClientProps) {
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

  const totalSKU = products.length
  const totalUnits = products.reduce((sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0), 0)
  const lowStockItems = products.filter(p => p.variants.some(v => v.stock <= p.minStock)).length

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="page-title">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep every unit visible and every reorder intentional.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total SKU</p>
          <p className="mt-3 text-2xl font-semibold">{totalSKU}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total Units</p>
          <p className="mt-3 text-2xl font-semibold">{totalUnits.toLocaleString('id-ID')}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Low stock items</p>
          <p className="mt-3 text-2xl font-semibold text-destructive">{lowStockItems}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Stock levels</p>
              <h2 className="section-title">All inventory</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            {products.flatMap(p => p.variants.map(v => ({
              id: v.id,
              name: p.name,
              sku: p.sku,
              size: v.size || '-',
              color: v.color || '-',
              stock: v.stock,
              minStock: p.minStock,
              category: p.category?.name,
            }))).map((item) => {
              const isLow = item.stock <= item.minStock
              return (
                <div className="product-row" key={item.id}>
                  <div className={`product-swatch ${item.category === 'Celana' ? 'bg-[#c9b58a]' : item.category === 'Hoodie' ? 'bg-slate-400' : item.category === 'Jaket' ? 'bg-blue-900' : 'bg-slate-900'}`}>
                    <span>{item.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.sku} · {item.size} / {item.color}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.stock} pcs</p>
                    <p className="mt-1 text-xs text-muted-foreground">min {item.minStock}</p>
                  </div>
                  <span className={`status-badge ${isLow ? 'status-warn' : 'status-good'}`}>
                    {isLow ? 'Low stock' : 'Healthy'}
                  </span>
                </div>
              )
            })}
            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No inventory items yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Action needed</p>
              <h2 className="section-title">Low stock alerts</h2>
            </div>
            <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
              {lowStockItems} alerts
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {products.filter(p => p.variants.some(v => v.stock <= p.minStock)).slice(0, 5).map((p) => {
              const onOrder = getOnOrder(p.id)
              return (
                <div className="alert-row" key={p.id}>
                  <div className={`product-swatch ${p.category?.name === 'Celana' ? 'bg-[#c9b58a]' : p.category?.name === 'Hoodie' ? 'bg-slate-400' : p.category?.name === 'Jaket' ? 'bg-blue-900' : 'bg-slate-900'}`}>
                    <span>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.variants.reduce((sum, v) => sum + v.stock, 0)} pcs left · min {p.minStock}
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
            {lowStockItems === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">All items are well stocked.</p>
            )}
          </div>
        </section>
      </div>

      <ReorderModal
        isOpen={reorderModalOpen}
        onClose={closeReorderModal}
        product={reorderProduct}
        suppliers={suppliers}
        onReorder={handleReorder}
      />
    </div>
  )
}