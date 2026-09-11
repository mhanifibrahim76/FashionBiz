'use client'

import { Tag, X } from 'lucide-react'

export function SimulationControls({
  discount,
  newPriceInput,
  useCustomPrice,
  onDiscountChange,
  onCustomPriceChange,
  onChangePrice,
  onRemovePrice,
}: {
  discount: number
  newPriceInput: string
  useCustomPrice: boolean
  onDiscountChange: (value: number) => void
  onCustomPriceChange: (value: string) => void
  onChangePrice: () => void
  onRemovePrice: () => void
}) {
  return (
    <div className="mt-6 flex flex-col gap-5">
      <div>
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <strong>{discount}%</strong>
        </div>
        <div className="mt-4 w-full rounded-lg bg-muted h-2">
          <div
            className="bg-accent h-2 rounded-lg transition-all"
            style={{ width: `${Math.min(discount, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={discount}
          onChange={(e) => onDiscountChange(parseInt(e.target.value, 10))}
          className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted outline-none"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
          <Tag className="size-3" />
          Atau masukkan harga baru langsung
        </label>
        {useCustomPrice ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rp</span>
            <input
              type="number"
              value={newPriceInput}
              onChange={(e) => onCustomPriceChange(e.target.value)}
              className="field w-32"
              min={0}
              step={1000}
            />
            <button
              type="button"
              onClick={onRemovePrice}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Use discount"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onChangePrice}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Tag className="size-3" />
            Set harga baru
          </button>
        )}
      </div>
    </div>
  )
}
