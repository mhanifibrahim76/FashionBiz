import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { DashboardInsights } from '@/components/dashboard/ai-insights'

async function getDashboardData(businessId: string) {
  const [products, sales, expenses] = await Promise.all([
    prisma.product.findMany({
      where: { businessId },
      include: { variants: true, category: true },
    }),
    prisma.sale.findMany({
      where: { businessId },
      include: { items: { include: { product: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.expense.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalCost = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId)
      const cost = product ? product.costPrice : 0
      return itemSum + (cost * item.quantity)
    }, 0)
  }, 0)
  const totalProfit = totalRevenue - totalCost
  const totalStock = products.reduce((sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0), 0)
  const totalSold = products.reduce((sum, p) => sum + p.variants.reduce((vSum, v) => vSum + (100 - v.stock), 0), 0)

  return {
    products,
    sales,
    expenses,
    metrics: {
      revenue: totalRevenue,
      profit: totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      items: totalSold,
      stock: totalStock,
    },
  }
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
          <KPICard label="Total revenue" value={formatCurrency(data.metrics.revenue)} change="+12.5%" />
          <KPICard label="Net profit" value={formatCurrency(data.metrics.profit)} change="+8.2%" />
          <KPICard label="Profit margin" value={`${data.metrics.margin.toFixed(1)}%`} change="+2.4%" />
          <KPICard label="Items sold" value={data.metrics.items.toLocaleString('id-ID')} change="+14.8%" />
          <KPICard label="Current stock" value={data.metrics.stock.toLocaleString('id-ID')} change="-4.1%" />
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
                  <strong>{data.products.length}</strong>
                  <span>products</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {data.products.slice(0, 5).map((p, i) => {
                  const category = p.category?.name || 'Other'
                  return (
                    <div className="flex items-center gap-2 text-xs" key={p.id}>
                      <span className={`size-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : i === 2 ? 'bg-chart-3' : i === 3 ? 'bg-chart-4' : 'bg-muted-foreground'}`} />
                      <span className="flex-1 text-muted-foreground">{category}</span>
                      <span className="font-semibold">{p.variants.reduce((sum, v) => sum + v.stock, 0)}</span>
                    </div>
                  )
                })}
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
              {data.products.slice(0, 5).map((p, index) => (
                <div className="product-row" key={p.id}>
                  <div className={`product-swatch ${p.category?.name === 'Pants' ? 'bg-[#c9b58a]' : p.category?.name === 'Hoodie' ? 'bg-slate-400' : p.category?.name === 'Jacket' ? 'bg-blue-900' : 'bg-slate-900'}`}>
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
                    <p className="text-sm font-semibold">{p.variants.reduce((sum, v) => sum + (100 - v.stock), 0)} pcs</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Action needed</p>
                <h2 className="section-title">Low stock alerts</h2>
              </div>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                {data.products.filter(p => p.variants.some(v => v.stock <= p.minStock)).length} alerts
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {data.products.filter(p => p.variants.some(v => v.stock <= p.minStock)).slice(0, 5).map((p) => (
                <div className="alert-row" key={p.id}>
                  <div className={`product-swatch ${p.category?.name === 'Pants' ? 'bg-[#c9b58a]' : p.category?.name === 'Hoodie' ? 'bg-slate-400' : p.category?.name === 'Jacket' ? 'bg-blue-900' : 'bg-slate-900'}`}>
                    <span>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.variants.reduce((sum, v) => sum + v.stock, 0)} pcs left - min {p.minStock}
                    </p>
                  </div>
                  <button className="button-small">Reorder</button>
                </div>
              ))}
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

function KPICard({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
        +{change} <span className="font-normal text-muted-foreground">vs last period</span>
      </p>
    </div>
  )
}
