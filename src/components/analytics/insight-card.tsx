'use client'

import { formatCurrency } from '@/lib/utils'

type Insight = {
  type: string
  priority: string
  icon: string
  title: string
  description: string
  recommendation: string
}

export function InsightCard({ insight }: { insight: Insight }) {
  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-destructive/10 text-destructive border-destructive/20',
    HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    LOW: 'bg-accent/10 text-accent-foreground border-accent/20',
    INFO: 'bg-muted/30 text-muted-foreground border-border',
  }

  const colorClass = priorityColors[insight.priority] || priorityColors.INFO

  return (
    <div className={`flex gap-3 rounded-xl border p-3 ${colorClass} bg-opacity-30`}>
      <span className="text-lg">{insight.icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">{insight.title}</p>
        <p className="mt-1 text-xs">{insight.description}</p>
        <p className="mt-1.5 text-xs italic">→ {insight.recommendation}</p>
      </div>
    </div>
  )
}
