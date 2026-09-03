import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStartDate, getPreviousStartDate, getPreviousEndDate, Period } from '../date-utils'

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
    const previousStartDate = getPreviousStartDate(range)
    const previousEndDate = getPreviousEndDate(range)

    const [sales, previousSales, expenses, previousExpenses, products] = await Promise.all([
      prisma.sale.findMany({
        where: { businessId, date: { gte: startDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.sale.findMany({
        where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate } },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: previousStartDate, lte: previousEndDate } },
        select: { amount: true },
      }),
      prisma.product.findMany({
        where: { businessId },
        include: { variants: true },
      }),
    ])

    const totalRevenue = sales.reduce((sum: number, s) => sum + s.total, 0)
    const previousRevenue = previousSales.reduce((sum: number, s) => sum + s.total, 0)

    const totalCOGS = sales.reduce((sum: number, s) => {
      return sum + s.items.reduce((itemSum: number, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)
    const previousCOGS = previousSales.reduce((sum: number, s) => {
      return sum + s.items.reduce((itemSum: number, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)

    const grossProfit = totalRevenue - totalCOGS
    const previousGrossProfit = previousRevenue - previousCOGS

    const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0)
    const previousTotalExpenses = previousExpenses.reduce((sum: number, e) => sum + e.amount, 0)

    const netProfit = grossProfit - totalExpenses
    const previousNetProfit = previousGrossProfit - previousTotalExpenses

    const totalTransactions = sales.length
    const previousTransactions = previousSales.length

    const totalItemsSold = sales.reduce(
      (sum: number, s) => sum + s.items.reduce((itemSum: number, item) => itemSum + item.quantity, 0),
      0
    )
    const previousItemsSold = previousSales.reduce(
      (sum: number, s) => sum + s.items.reduce((itemSum: number, item) => itemSum + item.quantity, 0),
      0
    )

    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const previousAOV = previousTransactions > 0 ? previousRevenue / previousTransactions : 0

    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    const previousProfitMargin = previousRevenue > 0 ? (previousNetProfit / previousRevenue) * 100 : 0

    function growth(current: number, previous: number): number | null {
      if (previous === 0) return null
      return ((current - previous) / previous) * 100
    }

    return NextResponse.json({
      kpi: {
        totalRevenue,
        totalRevenueGrowth: growth(totalRevenue, previousRevenue),
        netProfit,
        netProfitGrowth: growth(netProfit, previousNetProfit),
        profitMargin: profitMargin.toFixed(1),
        profitMarginGrowth: growth(profitMargin, previousProfitMargin),
        totalTransactions,
        totalTransactionsGrowth: growth(totalTransactions, previousTransactions),
        aov: aov.toFixed(0),
        aovGrowth: growth(aov, previousAOV),
        totalItemsSold,
        totalItemsSoldGrowth: growth(totalItemsSold, previousItemsSold),
        grossProfit,
        grossProfitGrowth: growth(grossProfit, previousGrossProfit),
        totalCOGS,
        totalExpenses,
        totalProducts: products.length,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    return NextResponse.json({ message: 'Failed to fetch analytics overview' }, { status: 500 })
  }
}
