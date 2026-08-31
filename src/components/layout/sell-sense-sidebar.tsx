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
  Bot,
  CircleDollarSign,
  FileText,
  Settings,
  Store,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { label: 'Profit Simulator', icon: CircleDollarSign, href: '/dashboard/targets' },
  { label: 'Reports', icon: FileText, href: '/dashboard/reports' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

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
          <p className="font-semibold tracking-tight">FashionBiz AI</p>
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
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <span className="text-xs font-semibold">FashionBiz AI</span>
        </div>
        <p className="text-sm leading-5 text-primary-foreground/75">
          Make smarter decisions with every sale.
        </p>
        <Link
          href="/dashboard/ai-advisor"
          className="mt-4 text-xs font-semibold text-accent"
        >
          Open advisor <ArrowUpRight className="ml-1 inline size-3" />
        </Link>
      </div>
    </aside>
  )
}
