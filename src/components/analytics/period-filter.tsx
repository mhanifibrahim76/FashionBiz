'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '90d', label: '90 Hari' },
  { key: 'ytd', label: 'YTD' },
]

export function PeriodFilter({ currentRange }: { currentRange: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleRangeChange(range: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1 text-xs font-semibold">
      {PERIODS.map((period) => (
        <button
          key={period.key}
          onClick={() => handleRangeChange(period.key)}
          className={`rounded-md px-2.5 py-1.5 transition-all ${
            currentRange === period.key
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}

export function PeriodFilterValues() {
  return PERIODS
}