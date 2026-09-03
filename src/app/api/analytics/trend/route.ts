import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfMonth, startOfYear, format } from 'date-fns'
import { getStartDate, getPreviousStartDate, getPreviousEndDate, getIntervalDates, getLabel, Period } from '../date-utils'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const range = (url.searchParams.get('range') || '30d') as Period

    const businessId = session.user.business.id
    const startDate = getStartDate(range)
    const endDate = new Date()

    const previousStartDate = getPreviousStartDate(range)
    const previousEndDate = getPreviousEndDate(range)

    const [sales, previousSales, expenses, previousExpenses] = await Promise.all([
      prisma.sale.findMany({
        where: { businessId, date: { gte: startDate } },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.sale.findMany({
        where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate } },
        select: { amount: true, date: true },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
        select: { amount: true, date: true },
      }),
    ])

    const computeDailyData = (
      salesData: { date: Date; total: number; items: { product?: { costPrice?: number }; quantity: number; total: number }[] }[],
      expensesData: { amount: number; date: Date }[],
      periodStart: Date,
      periodEnd: Date,
      periodRange: Period
    ) => {
      const interval = getIntervalDates(periodRange, periodStart, periodEnd)
      const dailyData: { date: string; revenue: number; profit: number; transactions: number }[] = []

      interval.forEach((intervalDate: Date, i: number) => {
        let dayStart: Date
        let dayEnd: Date

        if (periodRange === 'ytd') {
          dayStart = startOfMonth(intervalDate)
          dayEnd = new Date(dayStart)
          dayEnd.setMonth(dayEnd.getMonth() + 1)
        } else {
          dayStart = startOfDay(intervalDate)
          dayEnd = new Date(dayStart)
          dayEnd.setDate(dayEnd.getDate() + 1)
        }

        const daySales = salesData.filter((s) => {
          const d = new Date(s.date)
          if (periodRange === 'ytd') {
            return d.getMonth() === intervalDate.getMonth() && d.getFullYear() === intervalDate.getFullYear()
          }
          return d >= dayStart && d < dayEnd
        })

        const dayRevenue = daySales.reduce((sum: number, s) => sum + s.total, 0)
        const dayCOGS = daySales.reduce((sum: number, s) => {
          return sum + s.items.reduce((itemSum: number, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
        }, 0)
        const dayExpenses = expensesData
          .filter((e) => {
            const expenseDate = new Date(e.date)
            return expenseDate >= dayStart && expenseDate < dayEnd
          })
          .reduce((sum: number, e) => sum + e.amount, 0)
        const dayProfit = dayRevenue - dayCOGS - dayExpenses

        dailyData.push({
          date: getLabel(periodRange, intervalDate, i, interval.length),
          revenue: dayRevenue,
          profit: dayProfit,
          transactions: daySales.length,
        })
      })

      return dailyData
    }

    const dailyData = computeDailyData(sales, expenses, startDate, endDate, range)
    const previousDailyData = computeDailyData(previousSales, previousExpenses, previousStartDate, previousEndDate, range)

    return NextResponse.json({
      dailyData,
      previousDailyData,
      range,
    })
  } catch (error) {
    console.error('Error fetching analytics trend:', error)
    return NextResponse.json({ message: 'Failed to fetch analytics trend' }, { status: 500 })
  }
}
