'use client'

import { ChevronDown } from 'lucide-react'
import type { SimProduct } from '@/app/dashboard/profit-simulator/page'

export function ProductSelect({
  products,
  value,
  onChange,
}: {
  products: SimProduct[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="mt-6 relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-compact w-full appearance-none pr-8"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.sku}) — Rp{p.sellingPrice.toLocaleString('id-ID')}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    </div>
  )
}
