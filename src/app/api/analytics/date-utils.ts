import { startOfDay, subDays, startOfMonth, startOfYear, startOfWeek, subWeeks, subMonths, eachDayOfInterval, eachMonthOfInterval, format } from 'date-fns'

export type Period = '7d' | '30d' | '90d' | 'ytd'

export function getStartDate(range: Period): Date {
  const now = new Date()
  switch (range) {
    case '7d': return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '90d': return subDays(now, 90)
    case 'ytd': return startOfYear(now)
    default: return subDays(now, 30)
  }
}

export function getPreviousStartDate(range: Period): Date {
  const now = new Date()
  switch (range) {
    case '7d': return subDays(now, 14)
    case '30d': return subDays(now, 60)
    case '90d': return subDays(now, 180)
    case 'ytd': return startOfYear(subMonths(now, 1))
    default: return subDays(now, 60)
  }
}

export function getPreviousEndDate(range: Period): Date {
  const now = new Date()
  switch (range) {
    case '7d': return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '90d': return subDays(now, 90)
    case 'ytd': return startOfYear(now)
    default: return subDays(now, 30)
  }
}

export function getIntervalDates(range: Period, startDate: Date, endDate: Date): Date[] {
  if (range === 'ytd') {
    return eachMonthOfInterval({ start: startDate, end: endDate })
  }
  return eachDayOfInterval({ start: startDate, end: endDate })
}

export function getLabel(range: Period, date: Date, index: number, total: number): string {
  if (range === 'ytd') return format(date, 'MMM')
  if (range === '30d' || range === '90d' || range === '7d') {
    if (index % 5 === 0 || index === total - 1) return format(date, 'd MMM')
    return ''
  }
  return format(date, 'd')
}

export function calculateGrowth(current: number, previous: number): string {
  if (previous === 0) return 'N/A'
  const growth = ((current - previous) / previous) * 100
  if (Math.abs(growth) < 0.1) return '0.0%'
  return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`
}