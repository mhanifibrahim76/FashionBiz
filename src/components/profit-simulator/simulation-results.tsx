'use client'

import { Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type SimResult = {
  product: {
    name: string
    sku: string
    category: string
    costPrice: number
    originalPrice: number
    totalStock: number
    unitsSold: number
    avgMonthlySales: number
  }
  simulation: {
    discount: number
    simulatedPrice: number
    discountAmount: number
    originalProfitPerUnit: number
    simulatedProfitPerUnit: number
    profitPerUnitChange: number
    originalMargin: string
    simulatedMargin: string
    marginDrop: string
    isProfitable: boolean
    isGoodMargin: boolean
    isGoodMove: boolean
  }
  recommendation: {
    text: string
    isGoodMove: boolean
    confidence: string
  }
}

export function SimulationResults({ result, effectiveDiscount }: { result: SimResult | null; effectiveDiscount: number }) {
  if (!result) {
    return (
      <section className="panel flex flex-col">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Simulation</p>
            <h2 className="section-title">Hasil simulasi</h2>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground py-12">
          Pilih produk dan atur diskon untuk melihat simulasi profit.
        </div>
      </section>
    )
  }

  const { product, simulation, recommendation } = result

  return (
    <section className="panel flex flex-col">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2 className="section-title">{product.name}</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="sim-stat">
          <span>Original price</span>
          <strong>{formatCurrency(product.originalPrice)}</strong>
        </div>
        <div className="sim-stat">
          <span>New price</span>
          <strong>{formatCurrency(simulation.simulatedPrice)}</strong>
        </div>
        <div className="sim-stat">
          <span>Discount</span>
          <strong>{effectiveDiscount}%</strong>
        </div>
        <div className="sim-stat">
          <span>Cost</span>
          <strong>{formatCurrency(product.costPrice)}</strong>
        </div>
        <div className="sim-stat">
          <span>Profit/unit</span>
          <strong className={simulation.profitPerUnitChange >= 0 ? 'text-accent-foreground' : 'text-destructive'}>
            {formatCurrency(simulation.simulatedProfitPerUnit)}
          </strong>
        </div>
        <div className="sim-stat">
          <span>Margin</span>
          <strong>{simulation.simulatedMargin}%</strong>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Margin change</span>
          <span className={parseFloat(simulation.originalMargin) - parseFloat(simulation.simulatedMargin) >= 0 ? 'text-destructive' : 'text-accent-foreground'}>
            {simulation.marginDrop}%
          </span>
        </div>
        <div className="w-full rounded-lg bg-muted h-2">
          <div
            className={`h-2 rounded-lg ${simulation.isGoodMargin ? 'bg-accent' : 'bg-destructive'}`}
            style={{ width: `${Math.max(simulation.isGoodMargin ? 30 : 15, Math.min(parseFloat(simulation.simulatedMargin), 100))}%` }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2 text-accent">
          <span className="text-sm">?</span>
          <span className="eyebrow text-accent">AI recommendation</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold">
          {recommendation.isGoodMove ? 'Good move.' : 'Think twice.'}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">
          {recommendation.text}
        </p>
        <div className="mt-6 flex items-end justify-between border-t border-primary-foreground/15 pt-5">
          <div>
            <p className="text-xs text-primary-foreground/60">
              {recommendation.confidence === 'openai' ? 'AI-powered' : 'Data-driven'} recommendation
            </p>
          </div>
          <span className={`badge-lime ${recommendation.isGoodMove ? '' : 'bg-destructive/10 text-destructive'}`}>
            {recommendation.isGoodMove ? <Check className="size-3" /> : <X className="size-3" />}
            {recommendation.isGoodMove ? ' Proceed' : ' Reconsider'}
          </span>
        </div>
      </div>
    </section>
  )
}
