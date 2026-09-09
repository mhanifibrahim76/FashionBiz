'use client'

import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { ProductModal, ProductFormData } from '@/components/products/product-modal'
import { StockModal } from '@/components/products/stock-modal'

type Product = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  category: { name: string }
  variants: { stock: number }[]
}

type ProductsClientProps = {
  initialProducts: Product[]
  categories: string[]
}

export function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockProductId, setStockProductId] = useState<string | null>(null)
  const [stockProductName, setStockProductName] = useState('')

  const openStockModal = (product: Product) => {
    setStockProductId(product.id)
    setStockProductName(product.name)
    setStockModalOpen(true)
  }

  const closeStockModal = () => {
    setStockModalOpen(false)
    setStockProductId(null)
    setStockProductName('')
  }

  const handleStockUpdated = (newStock: number) => {
    if (stockProductId) {
      setProducts(products.map(p =>
        p.id === stockProductId
          ? { ...p, variants: [{ ...p.variants[0], stock: newStock }] }
          : p
      ))
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Hapus produk ${product.name}?`)) return

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setProducts(products.filter(p => p.id !== product.id))
      } else {
        alert(data.message || 'Gagal menghapus produk')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleSave = (product: ProductFormData) => {
    if (product.id) {
      setProducts(products.map(p => p.id === product.id ? {
        ...p,
        name: product.name,
        sku: product.sku,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        minStock: product.minStock,
        category: { name: product.category },
        variants: [{ stock: product.stock }],
      } as Product : p))
    } else {
      setProducts([...products, {
        id: product.id || Date.now().toString(),
        name: product.name,
        sku: product.sku,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        minStock: product.minStock,
        category: { name: product.category },
        variants: [{ stock: product.stock }],
      } as Product])
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      category: product.category.name,
      sku: product.sku,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.variants[0]?.stock || 0,
      minStock: product.minStock,
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

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

        if (data.success > 0) {
          window.location.reload()
        }
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

  const totalStock = (p: Product) => p.variants.reduce((sum, v) => sum + v.stock, 0)
  const status = (p: Product) => {
    const stock = totalStock(p)
    return stock <= p.minStock ? 'Low stock' : stock > 60 ? 'Overstock' : 'Healthy'
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="page-title">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your catalog, pricing, and product health in one place.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download template
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCSV}
              disabled={importing}
            />
          </label>
          <button className="button-primary" onClick={handleAdd}>
            <span className="mr-1">+</span> Add product
          </button>
        </div>
      </div>

       {importResult && (
        <div className={`rounded-lg border p-4 ${importResult.errors.length > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-green-50 border-green/20'}`}>
          <p className={`text-sm font-medium ${importResult.errors.length > 0 ? 'text-destructive' : 'text-green-700'}`}>
            Import selesai: {importResult.success} berhasil, {importResult.skipped} duplikat dilewati
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-destructive">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
       )}

       <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <input
              placeholder="Search by name or SKU"
              className="field pl-3"
            />
          </div>
          <div className="flex gap-2">
            <select className="select-compact">
              <option>All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select className="select-compact">
              <option>All statuses</option>
              <option>Healthy</option>
              <option>Low stock</option>
              <option>Dead stock risk</option>
              <option>Overstock</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Cost</th>
                <th>Selling price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`product-swatch ${p.category.name === 'Celana' ? 'bg-[#c9b58a]' : p.category.name === 'Hoodie' ? 'bg-slate-400' : p.category.name === 'Jaket' ? 'bg-blue-900' : 'bg-slate-900'}`}>
                        <span>{p.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.category.name}</td>
                  <td className="font-semibold">{totalStock(p)} pcs</td>
                  <td>Rp{p.costPrice.toLocaleString('id-ID')}</td>
                  <td>Rp{p.sellingPrice.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`status-badge ${status(p) === 'Healthy' ? 'status-good' : status(p) === 'Low stock' ? 'status-warn' : 'status-risk'}`}>
                      {status(p)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openStockModal(p)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                        Tambah stok
                      </button>
                      <button onClick={() => handleEdit(p)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products yet. Add your first product to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
        categories={categories}
      />

      <StockModal
        isOpen={stockModalOpen}
        onClose={closeStockModal}
        productId={stockProductId || ''}
        productName={stockProductName}
        onUpdated={handleStockUpdated}
      />
    </div>
  )
}
