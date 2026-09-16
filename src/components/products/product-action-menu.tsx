'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'

type Action = 'view' | 'edit' | 'delete'

type ProductActionMenuProps = {
  onAction: (action: Action) => void
}

export function ProductActionMenu({ onAction }: ProductActionMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Product actions"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button
            onClick={() => { onAction('view'); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Eye className="size-4" />
            Lihat detail
          </button>
          <button
            onClick={() => { onAction('edit'); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Pencil className="size-4" />
            Edit produk
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => { onAction('delete'); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            Hapus produk
          </button>
        </div>
      )}
    </div>
  )
}