import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { DashboardInsights } from '@/components/dashboard/ai-insights'
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts'
import { subDays } from 'date-fns'
import Link from 'next/link'
import { Brain, Target, TrendingUp, Sparkles } from 'lucide-react'

type DashboardProduct = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  status: string
  category: { name: string } | null
  variants: { id: string; size: string | null; color: string | null; stock: number }[]
}

type DashboardSale = {
  id: string
  total: number
  items: { id: string; quantity: number; productId: string; product: { costPrice: number } | null }[]
}

type ProductWithSales = DashboardProduct & {
  unitsSold: number
  revenue: number
  profit: number
}

async function getDashboardData(businessId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30)
  const sixtyDaysAgo = subDays(new Date(), 60)

  const [products, sales, previousSales, expenses] = await Promise.all([
    prisma.product.findMany({
      where: { businessId },
      include: { variants: true, category: true },
    }),
    prisma.sale.findMany({
      where: { businessId, date: { gte: thirtyDaysAgo } },
      include: { items: { include: { product: { include: { category: true } } } } },
    }),
    prisma.sale.findMany({
      where: { businessId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      include: { items: { include: { product: { include: { category: true } } } } },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: thirtyDaysAgo } },
      select: { amount: true },
    }),
  ])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalCost = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => {
      const cost = item.product?.costPrice || 0
      return itemSum + (cost * item.quantity)
    }, 0)
  }, 0)
  const totalProfit = totalRevenue - totalCost
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalProfit - totalExpenses
  const totalStock = products.reduce((sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0), 0)
  const totalSold = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  )
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.total, 0)
  const previousProfit = previousRevenue - previousSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => {
      const cost = item.product?.costPrice || 0
      return itemSum + (cost * item.quantity)
    }, 0)
  }, 0)

  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : null
  const profitGrowth = previousProfit > 0 ? ((netProfit - previousProfit) / previousProfit) * 100 : null
  const marginGrowth = previousRevenue > 0 ? margin - (previousProfit / previousRevenue) * 100 : null

  const productsWithSales: ProductWithSales[] = products.map((p) => {
    const productSales = sales.filter((s) =>
      s.items.some((item) => item.productId === p.id)
    )
    const unitsSold = productSales.reduce(
      (sum, s) => sum + s.items.filter((i) => i.productId === p.id).reduce((iSum, i) => iSum + i.quantity, 0),
      0
    )
    const revenue = productSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.productId === p.id)
          .reduce((iSum, i) => iSum + i.quantity * p.sellingPrice, 0),
      0
    )
    const cogs = unitsSold * p.costPrice
    const profit = revenue - cogs

    return { ...p, unitsSold, revenue, profit }
  })

  const topSelling = [...productsWithSales]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5)

  const categoryData: Record<string, { revenue: number; units: number; profit: number }> = {}

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const catName = item.product?.category?.name || 'Uncategorized'
      if (!categoryData[catName]) {
        categoryData[catName] = { revenue: 0, units: 0, profit: 0 }
      }
      const revenue = item.quantity * (item.product?.sellingPrice || 0)
      const cost = item.quantity * (item.product?.costPrice || 0)
      categoryData[catName].revenue += revenue
      categoryData[catName].units += item.quantity
      categoryData[catName].profit += revenue - cost
    })
  })

  const categoryColors: Record<string, string> = {
    Kaos: 'bg-primary',
    Hoodie: 'bg-accent',
    Celana: 'bg-[#c9b58a]',
    Jaket: 'bg-blue-900',
    Kemeja: 'bg-blue-500',
  }

  const categories = Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      revenue: data.revenue,
      units: data.units,
      profit: data.profit,
      color: categoryColors[name] || 'bg-slate-500',
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const totalCategoryRevenue = categories.reduce((s, c) => s + c.revenue, 0)
  const totalCategoryUnits = categories.reduce((s, c) => s + c.units, 0)
  const topByUnits = categories.length > 0 ? [...categories].sort((a, b) => b.units - a.units)[0] : null
  const topByRevenue = categories.length > 0 ? categories[0] : null
  const topByProfit = categories.length > 0 ? [...categories].sort((a, b) => b.profit - a.profit)[0] : null

  let categoryInsight = ''
  if (topByRevenue && topByUnits && totalCategoryRevenue > 0) {
    const revenueShare = (topByRevenue.revenue / totalCategoryRevenue) * 100
    if (revenueShare >= 50) {
      categoryInsight = `${topByRevenue.name} menyumbang ${revenueShare.toFixed(0)}% dari total revenue. Pertimbangkan diversifikasi kategori untuk mengurangi risiko.`
    } else if (topByUnits.name !== topByRevenue.name) {
      categoryInsight = `${topByUnits.name} paling laku (${topByUnits.units} pcs), tetapi ${topByRevenue.name} menghasilkan revenue terbesar.`
    } else {
      categoryInsight = `${topByRevenue.name} menjadi kategori unggulan dengan ${topByRevenue.units} pcs terjual dan revenue ${formatCurrency(topByRevenue.revenue)}.`
    }
  }

  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stock <= p.minStock)
  )

  return {
    products,
    sales: sales.slice(0, 10),
    expenses: expenses.slice(0, 5),
    metrics: {
      revenue: totalRevenue,
      profit: netProfit,
      margin,
      items: totalSold,
      stock: totalStock,
      transactions: sales.length,
      revenueGrowth,
      profitGrowth,
      marginGrowth,
    },
    topSelling,
    categories,
    categoryInsight: categoryInsight || null,
    topByRevenue: topByRevenue,
    topByUnits: topByUnits,
    topByProfit: topByProfit,
    totalCategoryRevenue,
    totalCategoryUnits,
    lowStockProducts,
  }
}

function GrowthDisplay({ value }: { value: number | null | string }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }
  const num = typeof value === 'string' ? parseFloat(value) : value
  const sign = num >= 0 ? '+' : ''
  const color = num >= 0 ? 'text-accent-foreground' : 'text-destructive'
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
      {sign}{num.toFixed(1)}%
    </span>
  )
}

function KPICard({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change: number | null | string
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs font-semibold">
        <GrowthDisplay value={change} />
        <span className="font-normal text-muted-foreground">vs last 30d</span>
      </div>
    </div>
  )
}

function categoryColor(category: string | null | undefined): string {
  if (!category) return 'bg-slate-900'
  const map: Record<string, string> = {
    Kaos: 'bg-primary',
    Hoodie: 'bg-slate-400',
    Celana: 'bg-[#c9b58a]',
    Jaket: 'bg-blue-900',
    Kemeja: 'bg-blue-500',
  }
  return map[category] || 'bg-slate-900'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.business?.id) {
    redirect('/login')
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })

  if (!business?.onboarded) {
    redirect('/dashboard/setup-wizard')
  }

  const [data, suppliers, pendingPurchases] = await Promise.all([
    getDashboardData(session.user.business.id),
    prisma.supplier.findMany({
      where: { businessId: session.user.business.id },
      select: { id: true, name: true, contact: true, address: true },
    }),
    prisma.purchaseItem.findMany({
      where: {
        purchase: { status: 'PENDING', businessId: session.user.business.id },
      },
      select: { productId: true, quantity: true },
    }),
  ])

  return (
    <>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <h1 className="page-title">
            Good morning, {session.user.name?.split(' ')[0]} <span className="text-accent">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your store today.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KPICard label="Total revenue" value={formatCurrency(data.metrics.revenue)} change={data.metrics.revenueGrowth} />
          <KPICard label="Net profit" value={formatCurrency(data.metrics.profit)} change={data.metrics.profitGrowth} />
          <KPICard label="Profit margin" value={`${data.metrics.margin.toFixed(1)}%`} change={data.metrics.marginGrowth} />
          <KPICard label="Items sold" value={data.metrics.items.toLocaleString('id-ID')} change={null} />
          <KPICard label="Current stock" value={data.metrics.stock.toLocaleString('id-ID')} change={null} />
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div>
            <SalesChart />
          </div>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Distribution</p>
                <h2 className="section-title">Sales by category</h2>
              </div>
            </div>

            {data.categories.length === 0 ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Belum ada data penjualan pada periode ini.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center">
                  <div className="donut relative size-40 rounded-full"
                    style={{
                      background: `conic-gradient(${
                        data.categories.map((cat, i) => {
                          const color = i === 0 ? 'var(--primary)' : i === 1 ? 'var(--accent)' : i === 2 ? 'var(--chart-3)' : i === 3 ? 'var(--chart-4)' : 'var(--muted-foreground)'
                          const total = data.categories.reduce((s, c) => s + c.revenue, 0) || 1
                          const pct = (cat.revenue / total) * 100
                          const prev = data.categories.slice(0, i).reduce((s, c) => s + (c.revenue / (data.categories.reduce((t, x) => t + x.revenue, 0) || 1)) * 100, 0)
                          return `${color} ${prev}% ${(prev + pct)}%`
                        }).join(', ')
                      })`
                    }}
                  >
                    <div>
                      <strong>{data.categories.length}</strong>
                      <span>categories</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {data.categories.map((cat, i) => (
                      <div className="flex items-center gap-2 text-xs" key={cat.name}>
                        <span className={`size-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : i === 2 ? 'bg-chart-3' : i === 3 ? 'bg-chart-4' : 'bg-muted-foreground'}`} />
                        <span className="w-20 truncate text-muted-foreground">{cat.name}</span>
                        <span className="font-semibold">{cat.units} pcs</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-semibold">{formatCurrency(cat.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Top by units</p>
                    <p className="mt-1 truncate text-sm font-semibold">{data.topByUnits?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{data.topByUnits ? `${data.topByUnits.units} pcs` : ''}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Top by revenue</p>
                    <p className="mt-1 truncate text-sm font-semibold">{data.topByRevenue?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{data.topByRevenue ? formatCurrency(data.topByRevenue.revenue) : ''}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Top by profit</p>
                    <p className="mt-1 truncate text-sm font-semibold">{data.topByProfit?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{data.topByProfit ? formatCurrency(data.topByProfit.profit) : ''}</p>
                  </div>
                </div>

                {data.categoryInsight && (
                  <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                    <p className="text-xs leading-5 text-muted-foreground">{data.categoryInsight}</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Momentum</p>
                <h2 className="section-title">Top selling products</h2>
              </div>
            </div>
            <div className="mt-4 flex flex-col">
              {data.topSelling.map((p, index) => (
                <div className="product-row" key={p.id}>
                  <div className={`product-swatch ${categoryColor(p.category?.name)}`}>
                    <span>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      {index === 0 && (
                        <span className="badge-lime">Best seller</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.category?.name} - {p.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{p.unitsSold} pcs</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(p.profit)} profit
                    </p>
                  </div>
                </div>
              ))}
              {data.topSelling.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada data penjualan pada periode ini.
                </p>
              )}
            </div>
          </section>

          <LowStockAlerts products={data.lowStockProducts} suppliers={suppliers} pendingPurchases={pendingPurchases} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AI Insights</p>
                <h2 className="section-title">AI Business Advisor</h2>
              </div>
            </div>
            <div className="mt-4">
              <DashboardInsights />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Link
                href="/dashboard/ai-advisor"
                className="flex items-center gap-2 text-xs font-semibold text-accent-foreground hover:underline"
              >
                <Sparkles className="size-3" />
                Buka AI Advisor untuk percakapan mendalam
              </Link>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Business targets</p>
                <h2 className="section-title">Target Bisnis</h2>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-semibold">
                    {formatCurrency(data.metrics.revenue)} / Rp 10.000.000
                  </span>
                </div>
                <div className="mt-1.5 w-full rounded-full bg-muted h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((data.metrics.revenue / 10000000) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="font-semibold">
                    {formatCurrency(data.metrics.profit)} / Rp 3.000.000
                  </span>
                </div>
                <div className="mt-1.5 w-full rounded-full bg-muted h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((data.metrics.profit / 3000000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Link
                href="/dashboard/targets"
                className="flex items-center gap-2 text-xs font-semibold text-accent-foreground hover:underline"
              >
                <Target className="size-3" />
                Lihat Target Bisnis & Profit Simulator
              </Link>
            </div>
          </section>
        </div>

      </div>
    </>
  )
}
