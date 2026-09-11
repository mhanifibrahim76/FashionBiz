'use client'

import { useState, useEffect } from 'react'
import type { SimProduct } from '@/app/dashboard/profit-simulator/page'
import { ProductSelect } from '@/components/profit-simulator/product-select'
import { SimulationControls } from '@/components/profit-simulator/simulation-controls'
import { SimulationResults } from '@/components/profit-simulator/simulation-results'

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

export default function ProfitSimulatorClient({ products }: { products: SimProduct[] }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
  const [discount, setDiscount] = useState(20)
  const [newPriceInput, setNewPriceInput] = useState('')
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  useEffect(() => {
    if (!selectedProductId) return
    const timer = setTimeout(() => {
      runSimulation()
    }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, discount, useCustomPrice, newPriceInput])

  async function runSimulation() {
    if (!selectedProductId) return

    setLoading(true)
    try {
      const payload: any = {
        productId: selectedProductId,
        discount: useCustomPrice ? 0 : discount,
      }
      if (useCustomPrice && newPriceInput) {
        payload.newPrice = parseFloat(newPriceInput)
      }

      const res = await fetch('/api/profit-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        setResult(data)
      }
    } catch (err) {
      console.error('Simulation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleDiscountChange(value: number) {
    setUseCustomPrice(false)
    setDiscount(value)
  }

  function handleCustomPriceChange(value: string) {
    setUseCustomPrice(true)
    setNewPriceInput(value)
  }

  function handleSetCustomPrice() {
    if (selectedProduct) {
      setUseCustomPrice(true)
      setNewPriceInput(selectedProduct.sellingPrice.toFixed(0))
    }
  }

  function handleRemovePrice() {
    setUseCustomPrice(false)
    setNewPriceInput('')
  }

  const effectiveDiscount =
    useCustomPrice && newPriceInput && selectedProduct
      ? Math.round(((selectedProduct.sellingPrice - parseFloat(newPriceInput)) / selectedProduct.sellingPrice) * 100)
      : discount

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Decision tool</p>
          <h1 className="page-title">Profit Simulator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Test a pricing move before you make it in the real world.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Product</p>
              <h2 className="section-title">
                {selectedProduct?.name || 'Pilih produk'}
              </h2>
            </div>
            {selectedProduct && (
              <div
                className={`product-swatch ${
                  selectedProduct?.category === 'Celana'
                    ? 'bg-[#c9b58a]'
                    : selectedProduct?.category === 'Hoodie'
                    ? 'bg-slate-400'
                    : selectedProduct?.category === 'Jaket'
                    ? 'bg-blue-900'
                    : 'bg-slate-900'
                }`}
              >
                <span>{selectedProduct?.name?.charAt(0) || '?'}</span>
              </div>
            )}
          </div>

          <ProductSelect products={products} value={selectedProductId} onChange={setSelectedProductId} />

          {selectedProduct && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="sim-stat">
                <span>Cost price</span>
                <strong>Rp{selectedProduct.costPrice.toLocaleString('id-ID')}</strong>
              </div>
              <div className="sim-stat">
                <span>Selling price</span>
                <strong>Rp{selectedProduct.sellingPrice.toLocaleString('id-ID')}</strong>
              </div>
              <div className="sim-stat">
                <span>Current stock</span>
                <strong>{selectedProduct.currentStock} pcs</strong>
              </div>
              <div className="sim-stat">
                <span>Units sold (90d)</span>
                <strong>{selectedProduct.unitsSold} pcs</strong>
              </div>
            </div>
          )}

          {selectedProduct && (
            <SimulationControls
              discount={discount}
              newPriceInput={newPriceInput}
              useCustomPrice={useCustomPrice}
              onDiscountChange={handleDiscountChange}
              onCustomPriceChange={handleCustomPriceChange}
              onChangePrice={handleSetCustomPrice}
              onRemovePrice={handleRemovePrice}
            />
          )}

          {loading && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Menghitung simulasi...
            </div>
          )}
        </section>

        <SimulationResults result={result} effectiveDiscount={effectiveDiscount} />
      </div>
    </div>
  )
}
