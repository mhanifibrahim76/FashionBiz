'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, BarChart3, PieChart, ChevronUp, ChevronDown } from 'lucide-react'

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

function GrowthIndicator({ value }: { value: number | null | string | undefined }) {
  if (value === null || value === 'N/A' || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }
  const numValue: number = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) {
    return <span className="text-muted-foreground">-</span>
  }
  const isPositive = numValue >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-accent-foreground' : 'text-destructive'}`}>
      {isPositive ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      {Math.abs(numValue).toFixed(1)}%
    </span>
  )
}

export function RevenueChart({ data, previousData }: { data: DataPoint[]; previousData?: DataPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), ...(previousData?.map((d) => d.revenue) || []), 1)

  return (
    <div className="relative mt-5 h-[185px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -30, bottom: 10 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            interval="preserveEnd"
            minTickGap={10}
          />
          <YAxis hide domain={[0, maxRevenue]} padding={{ top: 10 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const dataPoint = data.find((d) => d.date === label)
              if (!dataPoint) return null
              return (
                <div className="rounded-lg bg-popover px-2.5 py-1.5 shadow text-right text-xs">
                  <p className="text-muted-foreground">{label || 'Tanggal'}</p>
                  <p className="font-medium text-accent-foreground">Revenue: {formatCurrency(dataPoint.revenue)}</p>
                  <p className="font-medium text-primary">Profit: {formatCurrency(dataPoint.profit)}</p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="transparent"
            fill="url(#revenueGradient)"
            fillOpacity={1}
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinecap="round"
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinecap="round"
            dot={false}
            activeDot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Profit
        </span>
      </div>
    </div>
  )
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  return (
    <div className="mt-5 h-[185px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value) => formatCurrency(value as number)}
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const payloadItem = payload[0] as any
              const cat = data[payloadItem.dataIndex ?? 0]
              if (!cat) return null
              return (
                <div className="rounded-lg bg-popover px-2.5 py-1.5 shadow text-xs">
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-muted-foreground">Revenue: {formatCurrency(cat.revenue)}</p>
                  <p className="text-muted-foreground">Profit: {formatCurrency(cat.profit)}</p>
                  <p className="text-muted-foreground">Margin: {cat.margin}%</p>
                  <p className="text-muted-foreground">Unit: {cat.units}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="var(--accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { GrowthIndicator }
