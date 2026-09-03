import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { RevenueChart, CategoryChart, GrowthIndicator } from '@/components/analytics/charts'
import { KpiCards } from '@/components/analytics/kpi-cards'
import { PeriodFilter } from '@/components/analytics/period-filter'
import { InsightCard } from '@/components/analytics/insight-card'
import { SortSelect } from '@/components/analytics/sort-select'
import {
  AlertTriangle,
} from 'lucide-react'
import { getStartDate, getPreviousStartDate, getPreviousEndDate, Period } from '@/app/api/analytics/date-utils'

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
}

type Insight = {
  type: string
  priority: string
  icon: string
  title: string
  description: string
  recommendation: string
}

type TargetData = {
  id: string
  type: string
  label: string
  targetValue: number
  currentValue: number
  progress: string
  remaining: number
  unit: string
}

type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  unitsSold: number
  sellThrough: string
  status: string
  statusLabel: string
  recommendation: string
}

async function getAnalyticsData(businessId: string, range: Period) {
  const startDate = getStartDate(range)
  const previousStartDate = getPreviousStartDate(range)
  const previousEndDate = getPreviousEndDate(range)

  const [sales, previousSales, products, expenses, previousExpenses, business, targets] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, date: { gte: startDate } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    }),
    prisma.sale.findMany({
      where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { businessId },
      include: {
        category: true,
        variants: true,
        saleItems: {
          where: { sale: { date: { gte: startDate } } },
          select: { quantity: true, total: true },
        },
      },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: startDate } },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
      select: { amount: true },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { targetOmzet: true, targetLaba: true, targetTransaksi: true, targetGrowth: true },
    }),
    prisma.businessTarget.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  function calculateKpis(salesData: typeof sales, expensesData: typeof expenses) {
    const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0)
    const totalCOGS = salesData.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)
    const grossProfit = totalRevenue - totalCOGS
    const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = grossProfit - totalExpenses
    const totalTransactions = salesData.length
    const totalItemsSold = salesData.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )
    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin: profitMargin.toFixed(1),
      totalTransactions,
      aov: aov.toFixed(0),
      totalItemsSold,
    }
  }

  const currentKpis = calculateKpis(sales, expenses)
  const previousKpis = calculateKpis(previousSales, previousExpenses)

  function growth(current: number, previous: number) {
    if (previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  const kpi = {
    ...currentKpis,
    totalRevenueGrowth: growth(currentKpis.totalRevenue, previousKpis.totalRevenue),
    netProfitGrowth: growth(currentKpis.netProfit, previousKpis.netProfit),
    profitMarginGrowth: growth(
      parseFloat(currentKpis.profitMargin),
      parseFloat(previousKpis.profitMargin)
    ),
    totalTransactionsGrowth: growth(currentKpis.totalTransactions, previousKpis.totalTransactions),
    aovGrowth: growth(parseFloat(currentKpis.aov), parseFloat(previousKpis.aov)),
    totalItemsSoldGrowth: growth(currentKpis.totalItemsSold, previousKpis.totalItemsSold),
    grossProfitGrowth: growth(currentKpis.grossProfit, previousKpis.grossProfit),
    totalProducts: products.length,
  }

  const [dailyData, previousDailyData] = [
    sales.reduce((acc: DataPoint[], s) => {
      const date = new Date(s.date)
      const dayKey = date.toISOString().split('T')[0]
      const existing = acc.find((d) => d.date === dayKey)
      if (existing) {
        existing.revenue += s.total
        existing.transactions += 1
        s.items.forEach((item) => {
          existing.revenue += item.total - item.quantity * (item.product?.costPrice || 0)
          existing.profit += item.total - (item.product?.costPrice || 0) * item.quantity
        })
      } else {
        acc.push({
          date: dayKey,
          revenue: s.total,
          profit: s.items.reduce(
            (sum, item) => sum + item.total - (item.product?.costPrice || 0) * item.quantity,
            0
          ),
          transactions: 1,
        })
      }
      return acc
    }, []),
    previousSales.reduce((acc: DataPoint[], s) => {
      const date = new Date(s.date)
      const dayKey = date.toISOString().split('T')[0]
      const existing = acc.find((d) => d.date === dayKey)
      if (existing) {
        existing.revenue += s.total
        existing.transactions += 1
        s.items.forEach((item) => {
          existing.profit += item.total - (item.product?.costPrice || 0) * item.quantity
        })
      } else {
        acc.push({
          date: dayKey,
          revenue: s.total,
          profit: s.items.reduce(
            (sum, item) => sum + item.total - (item.product?.costPrice || 0) * item.quantity,
            0
          ),
          transactions: 1,
        })
      }
      return acc
    }, []),
  ]

  const categoryMap: Record<string, { revenue: number; units: number; cogs: number }> = {}

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const catName = item.product?.category?.name || 'Uncategorized'
      if (!categoryMap[catName]) categoryMap[catName] = { revenue: 0, units: 0, cogs: 0 }
      categoryMap[catName].revenue += item.total
      categoryMap[catName].units += item.quantity
      categoryMap[catName].cogs += (item.product?.costPrice || 0) * item.quantity
    })
  })

  const categoryColors: Record<string, string> = {
    Kaos: 'bg-primary',
    Hoodie: 'bg-accent',
    Celana: 'bg-[#c9b58a]',
    Jaket: 'bg-blue-900',
    Kemeja: 'bg-blue-500',
  }

  const categories: CategoryData[] = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    revenue: data.revenue,
    units: data.units,
    profit: data.revenue - data.cogs,
     margin: (data.revenue > 0 ? ((data.revenue - data.cogs) / data.revenue) * 100 : 0).toFixed(1),
    color: categoryColors[name] || 'bg-slate-500',
  })).sort((a, b) => b.revenue - a.revenue)

  const topProducts: ProductPerf[] = products.map((p) => {
    const unitsSold = p.saleItems.reduce((sum, si) => sum + si.quantity, 0)
    const revenue = p.saleItems.reduce((sum, si) => sum + si.total, 0)
    const cogs = unitsSold * p.costPrice
    const profit = revenue - cogs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)

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
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const lowStockProducts = topProducts
    .filter((p) => p.currentStock <= p.minStock)
    .slice(0, 5)

  const slowMovingProducts = topProducts
    .filter((p) => {
      if (p.unitsSold === 0 && p.currentStock > 0) return true
      if (p.unitsSold > 0 && p.currentStock > 0) {
        const sellThrough = p.unitsSold / (p.currentStock + p.unitsSold)
        return sellThrough < 0.3
      }
      return false
    })
    .slice(0, 5)

  const targetResults: TargetData[] = [
    {
      id: 'revenue',
      type: 'REVENUE',
      label: 'Target Omzet',
      targetValue: business?.targetOmzet || targets.find((t) => t.type === 'REVENUE')?.targetValue || 0,
      currentValue: kpi.totalRevenue,
      progress: business?.targetOmzet ? Math.min((kpi.totalRevenue / business.targetOmzet) * 100, 100).toFixed(1) : '0',
      remaining: Math.max((business?.targetOmzet || 0) - kpi.totalRevenue, 0),
      unit: 'currency',
    },
    {
      id: 'profit',
      type: 'PROFIT',
      label: 'Target Laba',
      targetValue: business?.targetLaba || targets.find((t) => t.type === 'PROFIT')?.targetValue || 0,
      currentValue: kpi.netProfit,
      progress: business?.targetLaba ? Math.min((kpi.netProfit / business.targetLaba) * 100, 100).toFixed(1) : '0',
      remaining: Math.max((business?.targetLaba || 0) - kpi.netProfit, 0),
      unit: 'currency',
    },
    {
      id: 'transactions',
      type: 'TRANSACTIONS',
      label: 'Target Transaksi',
      targetValue: business?.targetTransaksi || targets.find((t) => t.type === 'TRANSACTIONS')?.targetValue || 0,
      currentValue: kpi.totalTransactions,
      progress: business?.targetTransaksi ? Math.min((kpi.totalTransactions / business.targetTransaksi) * 100, 100).toFixed(1) : '0',
      remaining: Math.max((business?.targetTransaksi || 0) - kpi.totalTransactions, 0),
      unit: 'number',
    },
  ].filter((t) => t.targetValue > 0)

  const insights: Insight[] = []

  if (lowStockProducts.length > 0) {
    lowStockProducts.forEach((p) => {
      insights.push({
        type: 'LOW_STOCK',
        priority: 'HIGH',
        icon: '🔴',
        title: 'Stok rendah',
        description: `${p.name} hampir kehabisan stok.`,
        recommendation: 'Pertimbangkan untuk melakukan restock segera.',
      })
    })
  }

  const lowMarginProducts = topProducts
    .filter((p) => p.revenue > 0 && p.margin < 20)
    .sort((a, b) => a.margin - b.margin)
  if (lowMarginProducts.length > 0) {
    lowMarginProducts.slice(0, 3).forEach((p) => {
      insights.push({
        type: 'LOW_MARGIN',
        priority: 'MEDIUM',
        icon: '🟡',
        title: 'Margin rendah',
        description: `${p.name} memiliki margin ${p.margin.toFixed(1)}% dengan penjualan ${p.unitsSold} unit.`,
        recommendation: 'Pertimbangkan review harga jual atau cari supplier alternatif.',
      })
    })
  }

  const topProfitProduct = [...topProducts].sort((a, b) => b.profit - a.profit)[0]
  if (topProfitProduct && topProfitProduct.profit > 0) {
    insights.push({
      type: 'TOP_PERFORMER',
      priority: 'LOW',
      icon: '🟢',
      title: 'Performa terbaik',
      description: `${topProfitProduct.name} menghasilkan profit tertinggi sebesar ${formatCurrency(topProfitProduct.profit)}.`,
      recommendation: 'Pertimbangkan untuk mempertahankan stok yang cukup untuk produk ini.',
    })
  }

  if (slowMovingProducts.length > 0) {
    slowMovingProducts.forEach((p) => {
      insights.push({
        type: 'SLOW_MOVING',
        priority: 'MEDIUM',
        icon: '⚠️',
        title: 'Produk tidak laku',
        description: `${p.name} hanya terjual ${p.unitsSold} unit dalam periode ini.`,
        recommendation: 'Pertimbangkan promosi, bundling, atau review harga.',
      })
    })
  }

  if (business?.targetOmzet && kpi.totalRevenue > 0) {
    const progress = (kpi.totalRevenue / business.targetOmzet) * 100
    if (progress < 80) {
      insights.push({
        type: 'TARGET_BEHIND',
        priority: 'HIGH',
        icon: '🔴',
        title: 'Target omzet tertentukan',
        description: `Omzet ${formatCurrency(kpi.totalRevenue)} dari target ${formatCurrency(business.targetOmzet)} (${progress.toFixed(0)}%).`,
        recommendation: 'Tingkatkan promosi dan fokus pada produk dengan margin tinggi.',
      })
    }
  }

  if (kpi.netProfit < 0 && kpi.totalRevenue > 0) {
    insights.push({
      type: 'NET_LOSS',
      priority: 'CRITICAL',
      icon: '🔴',
      title: 'Kerugian bersih',
      description: `Laba bersih negatif sebesar ${formatCurrency(Math.abs(kpi.netProfit))}.`,
      recommendation: 'Review pengeluaran operasional dan pertimbangkan peningkatan harga jual.',
    })
  }

  if (kpi.totalExpenses > kpi.grossProfit * 0.5 && kpi.grossProfit > 0) {
    insights.push({
      type: 'HIGH_EXPENSES',
      priority: 'HIGH',
      icon: '🔴',
      title: 'Pengeluaran tinggi',
      description: `Pengeluaran operasional mencapai ${formatCurrency(kpi.totalExpenses)}, melebihi separuh laba kotor.`,
      recommendation: 'Audit pengeluaran dan identifikasi biaya yang dapat dikurangi.',
    })
  }

  insights.sort((a, b) => {
    const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
  })

  const trendLabel = range === '7d' ? '7 hari' : range === '30d' ? '30 hari' : range === '90d' ? '90 hari' : 'YTD'

  return {
    kpi,
    trendLabel,
    dailyData: dailyData.map((d) => ({
      date: d.date,
      revenue: d.revenue,
      profit: d.profit,
      transactions: d.transactions,
    })),
    previousDailyData: previousDailyData.map((d) => ({
      date: d.date,
      revenue: d.revenue,
      profit: d.profit,
      transactions: d.transactions,
    })),
    categories,
    topProducts,
    lowStockProducts,
    slowMovingProducts,
    targetResults,
    insights,
  }
}

export default async function AnalyticsPage({ searchParams }: { searchParams?: { range?: string; sort?: string } }) {
  const range = (searchParams?.range || '30d') as Period
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })
  if (!business?.onboarded) redirect('/dashboard/setup-wizard')

  const data = await getAnalyticsData(session.user.business.id, range)

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
        <PeriodFilter currentRange={range} />
      </div>

      <KpiCards kpi={data.kpi} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Performance</p>
              <h2 className="section-title">Revenue trend ({data.trendLabel})</h2>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-3xl font-semibold">
              {formatCurrency(data.dailyData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
              Total revenue
            </span>
          </div>
          <RevenueChart data={data.dailyData} previousData={data.previousDailyData} />
        </section>

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
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">
                  {data.categories.map((cat, i) => (
                    <div key={cat.name} className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">
                        {i === 0 ? '🏆 ' : ''}{cat.name}
                      </span>
                      <span>
                        Profit: {formatCurrency(cat.profit)} ({cat.margin}% margin)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Momentum</p>
              <h2 className="section-title">Top products</h2>
            </div>
            <SortSelect currentSort={searchParams?.sort || 'revenue'} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>Profit</th>
                  <th>Margin</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada data penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((p) => (
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
                      <td>{formatCurrency(p.cogs)}</td>
                      <td>{formatCurrency(p.profit)}</td>
                      <td>
                        <span className={p.margin > 30 ? 'text-accent-foreground' : p.margin > 15 ? 'text-amber-600' : 'text-destructive'}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        {p.currentStock} pcs{' '}
                        <span className="text-muted-foreground">(min {p.minStock})</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Action needed</p>
              <h2 className="section-title">Inventory alerts</h2>
            </div>
            <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
              {data.lowStockProducts.length + data.slowMovingProducts.length} alerts
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {data.lowStockProducts.length === 0 && data.slowMovingProducts.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                Stok semua produk dalam keadaan baik.
              </p>
            ) : (
              <>
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
                    <span className="status-badge status-risk">Stok Rendah</span>
                  </div>
                ))}
                {data.slowMovingProducts.map((p) => (
                  <div className="alert-row" key={p.id}>
                    <div className="product-swatch bg-slate-900">
                      <span>{p.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Hanya {p.unitsSold} unit terjual
                      </p>
                    </div>
                    <span className="status-badge status-warn">Lambat</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
              <span>Financial summary</span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">COGS</span>
                <span>{formatCurrency(data.kpi.totalCOGS)}</span>
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

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Business targets</p>
              <h2 className="section-title">Target vs Actual</h2>
            </div>
          </div>
          {data.targetResults.length === 0 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tidak ada target bisnis yang diatur.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {data.targetResults.map((t) => {
                const progress = parseFloat(t.progress)
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t.label}</span>
                      <span className="font-semibold">
                        {t.unit === 'currency'
                          ? `${formatCurrency(t.currentValue)} / ${formatCurrency(t.targetValue)}`
                          : `${t.currentValue} / ${t.targetValue}`}
                      </span>
                    </div>
                    <div className="mt-1.5 w-full rounded-full bg-muted h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{progress.toFixed(1)}% tercapai</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Business Insights</p>
              <h2 className="section-title">Actionable insights</h2>
            </div>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {data.insights.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                Tidak ada insight signifikan untuk periode ini.
              </p>
            ) : (
              data.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
