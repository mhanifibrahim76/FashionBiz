import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, eachDayOfInterval, format, startOfMonth, startOfYear, subMonths, eachMonthOfInterval, subWeeks } from 'date-fns'

function getStartDate(range: string): Date {
  const now = new Date()
  switch (range) {
    case 'week':
      return subWeeks(now, 1)
    case 'year':
      return startOfYear(now)
    case 'month':
    default:
      return startOfMonth(now)
  }
}

function getInterval(range: string, startDate: Date, endDate: Date): Date[] {
  switch (range) {
    case 'week':
      return eachDayOfInterval({ start: startDate, end: endDate })
    case 'year':
      return eachMonthOfInterval({ start: startDate, end: endDate })
    case 'month':
    default:
      return eachDayOfInterval({ start: startDate, end: endDate })
  }
}

function getLabel(range: string, date: Date, index: number, total: number): string {
  if (range === 'year') return format(date, 'MMM')
  if (range === 'week') return format(date, 'eee d')
  // Month: show label every 5 days
  if (index % 5 === 0 || index === total - 1) return format(date, 'd')
  return ''
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get('range') || 'month'

    const businessId = session.user.business.id
    const endDate = new Date()
    const startDate = getStartDate(range)
    const interval = getInterval(range, startDate, endDate)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        total: true,
      },
    })

    const data = interval.map((date, intervalIndex) => {
      const dayStart = startOfDay(date)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const daySales = sales.filter(s => {
        const saleDate = new Date(s.date)
        if (range === 'year') {
          return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear()
        }
        return saleDate >= dayStart && saleDate < dayEnd
      })

      const total = daySales.reduce((sum, s) => sum + s.total, 0)

      return {
        date: getLabel(range, date, intervalIndex, interval.length),
        total,
      }
    })

    return NextResponse.json({ data, range })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json({ message: 'Failed to fetch chart data' }, { status: 500 })
  }
}
