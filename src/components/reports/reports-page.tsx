'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ExportAllButton } from '@/components/reports/export-all-button'
import {
  FileText,
  Download,
  BarChart3,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronDown,
} from 'lucide-react'

type ReportType = {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  color: string
}

const reports: ReportType[] = [
  {
    id: 'sales',
    title: 'Sales report',
    desc: 'Transaction detail by invoice, date, payment method',
    icon: <ShoppingBag className="size-5" />,
    color: 'bg-primary',
  },
  {
    id: 'profit',
    title: 'Profit report',
    desc: 'Revenue, COGS, gross profit, net profit breakdown',
    icon: <TrendingUp className="size-5" />,
    color: 'bg-accent',
  },
  {
    id: 'inventory',
    title: 'Inventory report',
    desc: 'Current stock levels, min stock, stock value',
    icon: <Package className="size-5" />,
    color: 'bg-chart-3',
  },
  {
    id: 'products',
    title: 'Product performance',
    desc: 'Units sold, revenue, profit, margin per product',
    icon: <BarChart3 className="size-5" />,
    color: 'bg-blue-900',
  },
]

const rangeOptions = [
  { value: '7d', label: 'Minggu' },
  { value: '30d', label: '30 Hari' },
  { value: 'month', label: 'Bulan ini' },
  { value: '90d', label: '90 Hari' },
  { value: 'year', label: 'Tahun' },
]

export function ReportsPage({
  initialData,
}: {
  initialData: {
    totalRevenue: number
    totalExpenses: number
  }
}) {
  const [range, setRange] = useState('30d')

  const rangeLabel = rangeOptions.find(r => r.value === range)?.label || '30 Hari'
  const exportUrl = (type: string) => '/api/reports?type=' + type + '&range=' + range

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Business exports</p>
          <h1 className="page-title">
            Reports <span className="text-accent">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn your store data into a decision-ready snapshot.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <div className="panel" key={report.id}>
            <div className={`grid size-10 place-items-center rounded-xl ${report.color} text-white`}>
              {report.icon}
            </div>
            <h2 className="mt-5 font-semibold">{report.title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {report.desc}
            </p>
            <div className="mt-5 flex gap-2">
              <a href={exportUrl(report.id)} className="button-primary text-xs">
                <Download className="mr-1 size-3" /> CSV
              </a>
              <button className="button-secondary text-xs">
                <Download className="mr-1 size-3" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="panel flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="eyebrow">Quick actions</p>
          <h2 className="mt-2 text-xl font-semibold">Export combined data</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Download all report data as CSV files for external analysis.
          </p>
        </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Periode:</span>
            <div className="relative inline-block">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {rangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
            <ExportAllButton range={range} />
          </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total revenue</span>
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-2xl font-semibold">{formatCurrency(initialData.totalRevenue)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Operating expenses</span>
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-2xl font-semibold">{formatCurrency(initialData.totalExpenses)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Available reports</span>
            <FileText className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-2xl font-semibold">{reports.length}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active range</span>
            <Calendar className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-2xl font-semibold">{rangeLabel}</p>
        </div>
      </div>
    </div>
  )
}
