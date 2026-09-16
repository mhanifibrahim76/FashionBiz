'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'

type DeleteConfirmModalProps = {
  isOpen: boolean
  productName: string
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function DeleteConfirmModal({ isOpen, productName, onClose, onConfirm, loading }: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <div role="dialog" aria-modal="true" className="modal max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Hapus produk</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Apakah Anda yakin ingin menghapus{' '}
          <span className="font-semibold text-foreground">&ldquo;{productName}&rdquo;</span>?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tindakan ini tidak dapat dibatalkan. Histori transaksi terkait produk ini dapat terpengaruh.
        </p>

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="button-secondary flex-1">
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-3 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Menghapus...' : 'Hapus produk'}
          </button>
        </div>
      </div>
    </div>
  )
}