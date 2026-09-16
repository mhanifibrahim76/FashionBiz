'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  ShoppingBag,
  BarChart3,
  FileText,
  Brain,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
]

const operationalNav = [
  { label: 'Penjualan', icon: ShoppingCart, href: '/dashboard/sales' },
  { label: 'Produk', icon: Package, href: '/dashboard/products' },
  { label: 'Inventory', icon: Warehouse, href: '/dashboard/inventory' },
]

const financialNav = [
  { label: 'Pembelian', icon: ShoppingBag, href: '/dashboard/purchases' },
  { label: 'Biaya Operasional', icon: Receipt, href: '/dashboard/expenses' },
]

const analysisNav = [
  { label: 'Analitik', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Laporan', icon: FileText, href: '/dashboard/reports' },
  { label: 'AI Business Advisor', icon: Brain, href: '/dashboard/ai-advisor' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderSection = (
    title: string | null,
    items: { label: string; icon: any; href: string }[]
  ) => (
    <div className={title ? 'mt-6' : ''}>
      {title && (
        <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {title}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                active && 'nav-active'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex"
      style={{
        background: 'linear-gradient(180deg, oklch(0.205 0.045 250) 0%, oklch(0.18 0.04 250) 100%)',
        color: '#f1f5f9',
      }}
    >
      <div className="flex items-center gap-3 px-3">
        <div className="grid size-9 place-items-center rounded-xl bg-white/10 p-1">
          <Image
            src="/logo.png"
            alt="Untungin Logo"
            width={28}
            height={28}
            priority
            className="object-contain"
          />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-white">Untungin</p>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.6)' }}>
            AI business intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col">
          {renderSection(null, mainNav)}
          {renderSection('OPERASIONAL', operationalNav)}
          {renderSection('KEUANGAN', financialNav)}
          {renderSection('ANALISIS', analysisNav)}
        </div>
      </nav>

      <div className="border-t border-white/10 pt-3 pb-2">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm transition-all hover:bg-white/10"
        >
          <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <User className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {session?.user?.name || 'User'}
            </p>
            <p className="truncate text-xs" style={{ color: 'rgba(241,245,249,0.7)' }}>
              {session?.user?.business?.name || session?.user?.email || 'Pengaturan'}
            </p>
          </div>
          <Settings className="size-4 shrink-0" style={{ color: 'rgba(241,245,249,0.7)' }} />
        </Link>
      </div>

      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="text-center text-[11px]" style={{ color: 'rgba(241,245,249,0.4)' }}>
          © 2026 Untungin · Business Intelligence for UMKM
        </p>
      </div>
    </aside>
  )
}