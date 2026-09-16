'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  FileText,
  Settings,
  Store,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Products', icon: Package, href: '/dashboard/products' },
  { label: 'Sales', icon: ShoppingBag, href: '/dashboard/sales' },
  { label: 'Inventory', icon: Boxes, href: '/dashboard/inventory' },
  { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  {
    label: 'AI Advisor',
    icon: BrainCircuit,
    href: '/dashboard/ai-advisor',
    badge: true,
  },
  { label: 'Profit Simulator', icon: CircleDollarSign, href: '/dashboard/profit-simulator' },
  { label: 'Reports', icon: FileText, href: '/dashboard/reports' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const activeItem = [...nav]
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
      <div className="flex items-center gap-3 px-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Store className="size-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">Untungin</p>
          <p className="text-xs text-sidebar-foreground/60">
            AI business intelligence
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = activeItem?.href === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                isActive && 'nav-active'
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.badge && (
                <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  AI
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-border pt-3 pb-2">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-all hover:bg-muted"
        >
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <User className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {session?.user?.name || 'User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.user?.business?.name || session?.user?.email || 'Pengaturan'}
            </p>
          </div>
          <Settings className="size-4 shrink-0" />
        </Link>
      </div>
    </aside>
  )
}
