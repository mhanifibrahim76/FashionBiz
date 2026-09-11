'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  ShoppingBag,
  Truck,
  BarChart3,
  Brain,
  FileText,
  Target,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/sales',
    label: 'Penjualan',
    icon: ShoppingCart,
  },
  {
    href: '/dashboard/products',
    label: 'Produk',
    icon: Package,
  },
  {
    href: '/dashboard/inventory',
    label: 'Inventory',
    icon: Warehouse,
  },
  {
    href: '/dashboard/expenses',
    label: 'Pengeluaran',
    icon: Receipt,
  },
  {
    href: '/dashboard/purchases',
    label: 'Pembelian',
    icon: ShoppingBag,
  },
  {
    href: '/dashboard/suppliers',
    label: 'Supplier',
    icon: Truck,
  },
  {
    href: '/dashboard/analytics',
    label: 'Analitik',
    icon: BarChart3,
  },
  {
    href: '/dashboard/ai-advisor',
    label: 'AI Business Advisor',
    icon: Brain,
  },
  {
    href: '/dashboard/reports',
    label: 'Laporan',
    icon: FileText,
  },
  {
    href: '/dashboard/targets',
    label: 'Target Bisnis',
    icon: Target,
  },
  {
    href: '/dashboard/settings',
    label: 'Pengaturan',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white">
      <div className="flex h-full flex-col">

        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Untungin Logo"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>

            <span className="text-lg font-bold">
              Untungin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const Icon = item.icon

            const allMatches = menuItems
              .filter(
                (i) =>
                  pathname === i.href ||
                  pathname.startsWith(i.href + '/')
              )
              .sort(
                (a, b) =>
                  b.href.length - a.href.length
              )

            const isActive =
              allMatches.length > 0 &&
              allMatches[0].href === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-item',
                  isActive && 'nav-active'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">

            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium text-primary">
                UM
              </span>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                Nama Pemilik
              </p>

              <p className="truncate text-xs text-gray-500">
                Nama Usaha
              </p>
            </div>

            {/* Logout */}
            <button
              type="button"
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
            </button>

          </div>
        </div>

      </div>
    </aside>
  )
}