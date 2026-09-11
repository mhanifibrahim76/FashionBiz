'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { InsightCard } from '@/components/analytics/insight-card'

type Insight = {
  type: string
  priority: string
  icon: string
  title: string
  description: string
  recommendation: string
}

export function DashboardInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/analytics/insights?range=30d')
        if (res.ok) {
          const data = await res.json()
          setInsights(data.insights || [])
        }
      } catch (err) {
        console.error('Failed to fetch insights', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI Business Insights</p>
          <h2 className="section-title">Actionable insights</h2>
        </div>
        <AlertTriangle className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Memuat insights...</div>
        ) : insights.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Tidak ada insight signifikan untuk periode ini.
          </div>
        ) : (
          insights.slice(0, 3).map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))
        )}
      </div>
    </section>
  )
}
