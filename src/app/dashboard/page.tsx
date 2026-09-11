import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { DashboardInsights } from '@/components/dashboard/ai-insights'
import { subDays } from 'date-fns'

type DashboardProduct = {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  minStock: number
  status: string
  category: { name: string } | null
  variants: { id: string; stock: number }[]
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

  const categoryData: Record<string, { revenue: number; units: number; color: string }> = {}

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const catName = item.product?.category?.name || 'Uncategorized'
      if (!categoryData[catName]) {
        categoryData[catName] = { revenue: 0, units: 0, color: '' }
      }
      categoryData[catName].revenue += item.quantity * (item.product?.sellingPrice || 0)
      categoryData[catName].units += item.quantity
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
      color: categoryColors[name] || 'bg-slate-500',
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

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

  const data = await getDashboardData(session.user.business.id)

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
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="donut">
                <div>
                  <strong>{data.categories.length}</strong>
                  <span>categories</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {data.categories.map((cat, i) => (
                  <div className="flex items-center gap-2 text-xs" key={cat.name}>
                    <span className={`size-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : i === 2 ? 'bg-chart-3' : i === 3 ? 'bg-chart-4' : 'bg-muted-foreground'}`} />
                    <span className="flex-1 text-muted-foreground">{cat.name}</span>
                    <span className="font-semibold">{cat.units} pcs</span>
                  </div>
                ))}
              </div>
            </div>
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

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Action needed</p>
                <h2 className="section-title">Low stock alerts</h2>
              </div>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                {data.lowStockProducts.length} alerts
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {data.lowStockProducts.slice(0, 5).map((p) => (
                <div className="alert-row" key={p.id}>
                  <div className={`product-swatch ${categoryColor(p.category?.name)}`}>
                    <span>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.variants.reduce((sum, v) => sum + v.stock, 0)} pcs left - min {p.minStock}
                    </p>
                  </div>
                  <a
                    href="/dashboard/inventory"
                    className="button-small"
                  >
                    Reorder
                  </a>
                </div>
              ))}
              {data.lowStockProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Semua stok dalam keadaan baik.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8">
          <DashboardInsights />
        </div>
      </div>
    </>
  )
}
