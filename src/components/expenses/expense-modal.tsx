'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseCategory } from '@prisma/client'

type ExpenseModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  categories: ExpenseCategory[]
}

export function ExpenseModal({ isOpen, onClose, onSave, categories }: ExpenseModalProps) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan jumlah biaya yang valid')
      return
    }

    if (!categoryId) {
      alert('Pilih kategori')
      return
    }

    setSaving(true)
    try {
      const body: any = {
        amount: numAmount,
        paymentMethod,
        notes,
        date,
      }

      if (categoryId === 'custom' && categoryName) {
        body.customCategoryName = categoryName
      } else if (categoryId !== 'custom') {
        body.categoryId = categoryId
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const data = await res.json()
        alert(data.message || 'Gagal menyimpan biaya')
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setAmount('')
    setCategoryId('')
    setCategoryName('')
    setPaymentMethod('Cash')
    setNotes('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold">Add Expense</h2>
        <p className="mt-1 text-sm text-muted-foreground">Catat biaya operasional toko.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Amount (Rp)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field"
              placeholder="50000"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="select w-full"
            >
              <option value="">Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              <option value="custom">Custom</option>
            </select>

            {categoryId === 'custom' && (
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="field mt-2"
                placeholder="Nama kategori"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="select w-full">
              <option value="Cash">Tunai</option>
              <option value="Transfer">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="Card">Kartu Debit/Kredit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field"
              rows={2}
              placeholder="Contoh: Gaji karyawan bulanan..."
            />
          </div>

          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(parseFloat(amount) || 0)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <button onClick={handleClose} className="button-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !amount}
            className="button-primary"
          >
            {saving ? 'Saving...' : 'Save expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
