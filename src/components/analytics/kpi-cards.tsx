import { formatCurrency, formatNumber } from '@/lib/utils'
import { GrowthIndicator } from '@/components/analytics/charts'
import {
  CircleDollarSign,
  TrendingUp,
  Activity,
  ShoppingBag,
  BarChart3,
  Package,
} from 'lucide-react'

type KpiCardProps = {
  label: string
  value: string
  icon: React.ReactNode
  growth?: number | null
}

export function KpiCardSimple({ label, value, icon, growth }: KpiCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      {growth !== undefined && (
        <div className="mt-1">
          <GrowthIndicator value={growth} />
        </div>
      )}
    </div>
  )
}

type KpiCardsProps = {
  kpi: {
    totalRevenue: number
    totalRevenueGrowth?: number | null
    netProfit: number
    netProfitGrowth?: number | null
    profitMargin: string
    profitMarginGrowth?: number | null
    totalTransactions: number
    totalTransactionsGrowth?: number | null
    aov: string
    aovGrowth?: number | null
    totalItemsSold: number
    totalItemsSoldGrowth?: number | null
    grossProfit?: number
    grossProfitGrowth?: number | null
    totalCOGS?: number
    totalExpenses?: number
    totalProducts?: number
  }
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const items = [
    { label: 'Total revenue', value: formatCurrency(kpi.totalRevenue), growth: kpi.totalRevenueGrowth, Icon: CircleDollarSign },
    { label: 'Net profit', value: formatCurrency(kpi.netProfit), growth: kpi.netProfitGrowth, Icon: TrendingUp },
    { label: 'Profit margin', value: kpi.profitMargin + '%', growth: kpi.profitMarginGrowth, Icon: Activity },
    { label: 'Transactions', value: formatNumber(kpi.totalTransactions), growth: kpi.totalTransactionsGrowth, Icon: ShoppingBag },
    { label: 'AOV', value: formatCurrency(Number(kpi.aov)), growth: kpi.aovGrowth, Icon: BarChart3 },
    { label: 'Items sold', value: formatNumber(kpi.totalItemsSold), growth: kpi.totalItemsSoldGrowth, Icon: Package },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        return (
          <div className="metric-card" key={item.label}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <item.Icon className="size-4 text-muted-foreground" />
                <GrowthIndicator value={item.growth} />
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}
