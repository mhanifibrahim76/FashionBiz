'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  contact: string | null
  address: string | null
  productsSupplied: string[]
}

export function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const nameInput = form.elements.namedItem('name') as HTMLInputElement
    const contactInput = form.elements.namedItem('contact') as HTMLInputElement
    const addressInput = form.elements.namedItem('address') as HTMLInputElement

    const name = nameInput.value.trim()
    if (!name) {
      alert('Nama supplier wajib diisi')
      return
    }

    setSaving(true)
    try {
      const method = editingSupplier ? 'PATCH' : 'POST'
      const body = JSON.stringify({
        ...(editingSupplier && { id: editingSupplier.id }),
        name,
        contact: contactInput.value.trim() || null,
        address: addressInput.value.trim() || null,
        productsSupplied: [],
      })

      const res = await fetch('/api/suppliers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const data = await res.json()

      if (res.ok) {
        if (editingSupplier) {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === editingSupplier.id ? data.supplier : s))
          )
        } else {
          setSuppliers((prev) => [...prev, data.supplier])
        }
        closeModal()
      } else {
        alert(data.message || 'Gagal menyimpan supplier')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Hapus supplier "${supplier.name}"?`)) return
    setDeletingId(supplier.id)
    try {
      const res = await fetch(`/api/suppliers?id=${supplier.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id))
      } else {
        const data = await res.json()
        alert(data.message || 'Gagal menghapus supplier')
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Procurement</p>
          <h1 className="page-title">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your supplier network for reorder and procurement.</p>
        </div>
        <button onClick={openCreateModal} className="button-primary">
          <span className="mr-1">+</span> Add supplier
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No suppliers yet. Add your first supplier to enable reorder.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="text-muted-foreground">{s.contact || '—'}</td>
                    <td className="text-muted-foreground">{s.address || '—'}</td>
                    <td className="text-muted-foreground">{s.productsSupplied.length} products</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div role="dialog" aria-modal="true" className="modal max-w-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4">
              <div>
                <label>Name</label>
                <input
                  name="name"
                  type="text"
                  className="field mt-1"
                  defaultValue={editingSupplier?.name || ''}
                  placeholder="e.g. Textile Supplier"
                  required
                />
              </div>
              <div>
                <label>Contact (optional)</label>
                <input
                  name="contact"
                  type="text"
                  className="field mt-1"
                  defaultValue={editingSupplier?.contact || ''}
                  placeholder="e.g. 081234567890"
                />
              </div>
              <div>
                <label>Address (optional)</label>
                <input
                  name="address"
                  type="text"
                  className="field mt-1"
                  defaultValue={editingSupplier?.address || ''}
                  placeholder="e.g. Bandung, Indonesia"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={closeModal} className="button-secondary flex-1">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="button-primary flex-1">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}