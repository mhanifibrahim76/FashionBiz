'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, BarChart3, PieChart } from 'lucide-react'

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

export function RevenueChart({ data }: { data: DataPoint[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="relative mt-5 h-[185px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -30, bottom: 10 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
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
              return (
                <div className="rounded-lg bg-popover px-2.5 py-1.5 shadow text-right text-xs">
                  <p className="text-muted-foreground">{label || 'Tanggal'}</p>
                  <p className="font-medium text-accent-foreground">{formatCurrency(payload[0].value as number)}</p>
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
        </LineChart>
      </ResponsiveContainer>
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
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg bg-popover px-2.5 py-1.5 shadow text-xs">
                  <p className="font-medium">{payload[0].payload.name}</p>
                  <p className="text-muted-foreground">{formatCurrency(payload[0].value as number)}</p>
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
