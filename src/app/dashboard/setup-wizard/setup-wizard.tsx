'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Upload, Plus, Check, Loader2 } from 'lucide-react'
import { ProductModal, ProductFormData } from '@/components/products/product-modal'

interface SetupWizardProps {
  businessId: string
  businessName: string
  categories: string[]
  existingProducts: number
}

export default function SetupWizard({ businessId, businessName, categories, existingProducts }: SetupWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [updatingTargets, setUpdatingTargets] = useState(false)

  const handleDownloadTemplate = () => {
    window.location.href = '/api/products/template?format=sample'
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('csvFile', file)

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setImportResult({
          success: data.success || 0,
          skipped: data.skipped || 0,
          errors: data.errors || [],
        })
      } else {
        setImportResult({ success: 0, skipped: 0, errors: [data.message || 'Import failed'] })
      }
    } catch (err) {
      setImportResult({ success: 0, skipped: 0, errors: ['Terjadi kesalahan jaringan'] })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleAddProduct = async (product: ProductFormData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to add product')
      }

      setShowProductModal(false)
    } catch (err) {
      console.error('Add product error:', err)
    }
  }

  const handleComplete = async () => {
    setUpdatingTargets(true)
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarded: true }),
      })

      if (!res.ok) throw new Error('Failed to complete setup')

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Setup complete error:', err)
    } finally {
      setUpdatingTargets(false)
    }
  }

  const totalImported = (importResult?.success ?? 0) + existingProducts

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Langkah {step} dari 3</p>
          <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat datang, {businessName}!
              </h1>
              <p className="text-gray-600 mb-6">
                Yuk, atur bisnis fashion kamu di FashionBiz AI. Kita butuh 2 hal penting untuk memulai.
              </p>

              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Import Produk</h3>
                  <p className="text-sm text-gray-600">
                    Upload CSV produk kamu, atau tambahkan manual. Kita sudah sediakan template jika kamu belum punya.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Atur Target Bulanan</h3>
                  <p className="text-sm text-gray-600">
                    Masukkan target omzet dan laba bulanan agar AI bisa memberikan rekomendasi yang akurat.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full button-primary"
              >
                Mulai
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Tambahkan Produk</h2>
              <p className="text-gray-600 mb-6">
                Import via CSV atau tambah produk secara manual. Kamu sudah punya <strong>{existingProducts}</strong> produk di sistem.
              </p>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-700 hover:border-primary hover:bg-primary/5">
                    <Upload className="h-4 w-4" />
                    {importing ? 'Mengimpor...' : 'Upload CSV'}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleImportCSV}
                      disabled={importing}
                    />
                  </label>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="h-4 w-4" />
                    Unduh template
                  </button>
                </div>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs text-gray-400 uppercase">
                    <span className="bg-white px-2">atau</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:border-primary hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" />
                  Tambah produk manual
                </button>
              </div>

              {importResult && (
                <div className={`rounded-lg border p-3 text-sm ${importResult.errors.length > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <p>{importResult.success} produk berhasil diimport, {importResult.skipped} duplikat dilewati</p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                  {importResult.success > 0 && (
                    <button
                      onClick={() => router.refresh()}
                      className="mt-2 text-xs underline"
                    >
                      Refresh produk
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-900">Produk terdeteksi: {totalImported}</p>
                <p className="text-gray-600">Kamu bisa menambahkan produk kapan saja dari halaman Produk.</p>
              </div>

              <div className="mt-8 flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="button-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="button-primary flex-1"
                >
                  Lanjut
                </button>
              </div>

              <ProductModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSave={handleAddProduct}
                product={null}
                categories={categories}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Siap untuk mulai!</h2>
              <p className="text-gray-600 mb-6">
                Kamu sudah menambahkan <strong>{totalImported}</strong> produk. Klik di bawah untuk masuk ke dashboard.
                Kamu bisa mengatur target omzet dan lainnya kapan saja di halaman Settings.
              </p>

              <div className="mb-8 rounded-lg bg-primary/5 border border-primary/20 p-6 text-center">
                <Check className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-semibold text-gray-900">Setup selesai!</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="button-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  onClick={handleComplete}
                  disabled={updatingTargets}
                  className="button-primary flex-1"
                >
                  {updatingTargets ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyelesaikan...
                    </>
                  ) : (
                    'Masuk ke Dashboard'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
