'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type DataPoint = { date: string; total: number }

export function SalesChart() {
  const [range, setRange] = useState('month')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard/chart?range=' + range)
      .then(r => r.ok ? r.json() : { data: [] })
      .then((r: { data: DataPoint[] }) => setData(r.data))
      .finally(() => setLoading(false))
  }, [range])

  const total = data.reduce((sum, d) => sum + d.total, 0)

  const rangeLabels: Record<string, string> = { week: 'Minggu', month: 'Bulan', year: 'Tahun' }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h2 className="section-title">Penjualan</h2>
        </div>
        <div className="relative inline-block">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">{rangeLabels.week}</option>
            <option value="month">{rangeLabels.month}</option>
            <option value="year">{rangeLabels.year}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <p className="text-3xl font-semibold">{formatCurrency(total)}</p>
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
          Total penjualan · {data.length} periode
        </span>
      </div>

      {loading ? (
        <div className="mt-5 flex h-[185px] items-center justify-center text-muted-foreground">Memuat...</div>
      ) : data.length === 0 ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">Tidak ada data penjualan untuk periode ini</p>
      ) : (
        <div className="relative mt-5 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 10 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
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
              <YAxis
                hide={true}
                domain={[0, 'dataMax']}
                padding={{ top: 10 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  return (
                    <div className="rounded-lg bg-popover px-2.5 py-1.5 shadow text-right text-xs">
                      <p className="font-medium">{payload[0].payload.date}</p>
                      <p className="text-accent-foreground">{formatCurrency(payload[0].value as number)}</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="transparent"
                fill="url(#areaGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--accent)"
                strokeWidth={3}
                strokeLinecap="round"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
