import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { RevenueChart, CategoryChart } from '@/components/analytics/charts'
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns'
import {
  CircleDollarSign,
  ShoppingBag,
  TrendingUp,
  Activity,
  Package,
  BarChart3,
} from 'lucide-react'

type DataPoint = {
  date: string
  revenue: number
  profit: number
  transactions: number
}

type CategoryData = {
  name: string
  revenue: number
  units: number
  profit: number
  margin: string
  color: string
}

type ProductPerf = {
  id: string
  name: string
  sku: string
  category: string
  unitsSold: number
  revenue: number
  cogs: number
  profit: number
  margin: number
  currentStock: number
  minStock: number
  status: string
}

async function getAnalyticsData(businessId: string) {
  const now = new Date()
  const startDate = subDays(now, 30)

  const [sales, products, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, date: { gte: startDate, lte: now } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.product.findMany({
      where: { businessId },
      include: {
        category: true,
        variants: true,
        saleItems: {
          where: { sale: { date: { gte: startDate, lte: now } } },
          select: { quantity: true },
        },
      },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: startDate, lte: now } },
      select: { amount: true },
    }),
  ])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalCOGS = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
  }, 0)
  const totalProfit = totalRevenue - totalCOGS
  const totalTransactions = sales.length
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )
  const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalProfit - totalExpenses

  const interval = eachDayOfInterval({ start: startDate, end: now })

  const dailyData: DataPoint[] = interval.map((date, i) => {
    const dayStart = startOfDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const daySales = sales.filter(s => {
      const d = new Date(s.date)
      return d >= dayStart && d < dayEnd
    })

    const dayRevenue = daySales.reduce((sum, s) => sum + s.total, 0)
    const dayCOGS = daySales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)
    const dayProfit = dayRevenue - dayCOGS

    return {
      date: i % 5 === 0 || i === interval.length - 1 ? format(date, 'd') : '',
      revenue: dayRevenue,
      profit: dayProfit,
      transactions: daySales.length,
    }
  })

  const categoryMap: Record<string, { revenue: number; units: number; cogs: number }> = {}

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const catName = item.product?.category?.name || 'Uncategorized'
      if (!categoryMap[catName]) categoryMap[catName] = { revenue: 0, units: 0, cogs: 0 }
      categoryMap[catName].revenue += item.total
      categoryMap[catName].units += item.quantity
      categoryMap[catName].cogs += (item.product?.costPrice || 0) * item.quantity
    })
  })

  const categoryColors: Record<string, string> = {
    T_Shirt: 'bg-primary',
    Hoodie: 'bg-accent',
    Pants: 'bg-[#c9b58a]',
    Jacket: 'bg-blue-900',
    Shirt: 'bg-blue-500',
    Accessories: 'bg-muted-foreground',
  }

  const categories: CategoryData[] = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    revenue: data.revenue,
    units: data.units,
    profit: data.revenue - data.cogs,
    margin: data.cogs > 0 ? (((data.revenue - data.cogs) / data.revenue) * 100).toFixed(1) : '0',
    color: categoryColors[name] || 'bg-slate-500',
  })).sort((a, b) => b.revenue - a.revenue)

  const topProducts: ProductPerf[] = products.map(p => {
    const revenue = p.saleItems.reduce((sum, si) => sum + si.quantity * p.sellingPrice, 0)
    const unitsSold = p.saleItems.reduce((sum, si) => sum + si.quantity, 0)
    const cogs = unitsSold * p.costPrice
    const profit = revenue - cogs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const status = totalStock <= p.minStock ? 'low' : totalStock > 60 ? 'overstock' : 'healthy'

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      unitsSold,
      revenue,
      cogs,
      profit,
      margin,
      currentStock: totalStock,
      minStock: p.minStock,
      status,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const lowStockProducts = topProducts.filter(p => p.status === 'low').slice(0, 5)

  return {
    kpi: {
      totalRevenue,
      totalProfit,
      profitMargin: profitMargin.toFixed(1),
      totalTransactions,
      aov: aov.toFixed(0),
      totalItemsSold,
      totalExpenses,
      netProfit,
    },
    dailyData,
    categories,
    topProducts,
    lowStockProducts,
    productsCount: products.length,
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })
  if (!business?.onboarded) redirect('/dashboard/setup-wizard')

  const data = await getAnalyticsData(session.user.business.id)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Business intelligence</p>
          <h1 className="page-title">
            Analytics <span className="text-accent">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial, product, and sales performance at a glance.
          </p>
        </div>
      </div>

      <KpiCards kpi={data.kpi} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <KpiCardSimple
          label="Revenue"
          value={formatCurrency(data.kpi.totalRevenue)}
          icon={<CircleDollarSign className="size-4 text-muted-foreground" />}
        />
        <KpiCardSimple
          label="Net profit"
          value={formatCurrency(data.kpi.netProfit)}
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Performance</p>
              <h2 className="section-title">Revenue trend (30 days)</h2>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-semibold">{formatCurrency(data.kpi.totalRevenue)}</p>
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
              30-day total
            </span>
          </div>
          <RevenueChart data={data.dailyData} />
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Distribution</p>
              <h2 className="section-title">Sales by category</h2>
            </div>
          </div>
          <CategoryChart data={data.categories} />
          <div className="mt-4 flex flex-col gap-3">
            {data.categories.slice(0, 5).map((cat) => (
              <div className="flex items-center justify-between text-xs" key={cat.name}>
                <span className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${cat.color}`} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </span>
                <span className="font-semibold">{formatCurrency(cat.revenue)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Momentum</p>
              <h2 className="section-title">Top products</h2>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                  <th>Margin</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="product-swatch bg-slate-900">
                          <span>{p.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td>{p.unitsSold} pcs</td>
                    <td>{formatCurrency(p.revenue)}</td>
                    <td>
                      <span className={p.margin > 30 ? 'text-accent-foreground' : p.margin > 15 ? 'text-amber-600' : 'text-destructive'}>
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td>{p.currentStock} pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            {data.lowStockProducts.map((p) => (
              <div className="alert-row" key={p.id}>
                <div className="product-swatch bg-slate-900">
                  <span>{p.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.currentStock} pcs left - min {p.minStock}
                  </p>
                </div>
                <button className="button-small">Reorder</button>
              </div>
            ))}
            {data.lowStockProducts.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                No low stock items
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
              <span>Financial summary</span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">COGS</span>
                <span>{formatCurrency(data.kpi.totalRevenue - data.kpi.totalProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating expenses</span>
                <span>{formatCurrency(data.kpi.totalExpenses)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Net profit</span>
                <span className="text-accent-foreground">{formatCurrency(data.kpi.netProfit)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

type KpiCardProps = {
  label: string
  value: string
  icon: React.ReactNode
}

function KpiCardSimple({ label, value, icon }: KpiCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

type KpiCardsProps = {
  kpi: {
    totalRevenue: number
    totalProfit: number
    profitMargin: string
    totalTransactions: number
    aov: string
    totalItemsSold: number
  }
}

function KpiCards({ kpi }: KpiCardsProps) {
  const items = [
    { label: 'Total revenue', value: formatCurrency(kpi.totalRevenue), icon: CircleDollarSign },
    { label: 'Net profit', value: formatCurrency(kpi.totalProfit), icon: TrendingUp },
    { label: 'Profit margin', value: kpi.profitMargin + '%', icon: Activity },
    { label: 'Transactions', value: formatNumber(kpi.totalTransactions), icon: ShoppingBag },
    { label: 'AOV', value: formatCurrency(Number(kpi.aov)), icon: BarChart3 },
    { label: 'Items sold', value: formatNumber(kpi.totalItemsSold), icon: Package },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div className="metric-card" key={item.label}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}
