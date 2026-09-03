import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStartDate, Period } from '../date-utils'

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

    const [sales, targets, business, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { businessId, date: { gte: startDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.businessTarget.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { targetOmzet: true, targetLaba: true, targetTransaksi: true, targetGrowth: true },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate } },
        select: { amount: true },
      }),
    ])

    const totalRevenue = sales.reduce((sum: number, s) => sum + s.total, 0)
    const totalCOGS = sales.reduce((sum: number, s) => {
      return sum + s.items.reduce((itemSum: number, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)
    const grossProfit = totalRevenue - totalCOGS
    const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0)
    const netProfit = grossProfit - totalExpenses
    const totalTransactions = sales.length

    const targetResults = [
      {
        id: 'revenue',
        type: 'REVENUE',
        label: 'Target Omzet',
        targetValue: business?.targetOmzet || (targets.find((t) => t.type === 'REVENUE')?.targetValue ?? 0),
        currentValue: totalRevenue,
        unit: 'currency',
      },
      {
        id: 'profit',
        type: 'PROFIT',
        label: 'Target Laba',
        targetValue: business?.targetLaba || (targets.find((t) => t.type === 'PROFIT')?.targetValue ?? 0),
        currentValue: netProfit,
        unit: 'currency',
      },
      {
        id: 'transactions',
        type: 'TRANSACTIONS',
        label: 'Target Transaksi',
        targetValue: business?.targetTransaksi || (targets.find((t) => t.type === 'TRANSACTIONS')?.targetValue ?? 0),
        currentValue: totalTransactions,
        unit: 'number',
      },
      {
        id: 'growth',
        type: 'GROWTH',
        label: 'Target Pertumbuhan',
        targetValue: business?.targetGrowth || (targets.find((t) => t.type === 'GROWTH')?.targetValue ?? 0),
        currentValue: 0,
        unit: 'percent',
      },
    ].filter((t) => t.targetValue > 0)

    const targetResultsWithProgress = targetResults.map((t) => {
      const progress = t.targetValue > 0 ? Math.min((t.currentValue / t.targetValue) * 100, 100) : 0
      return {
        ...t,
        progress: progress.toFixed(1),
        remaining: Math.max(t.targetValue - t.currentValue, 0),
      }
    })

    const detailedTargets = targets
      .filter((t) => t.type && t.targetValue > 0)
      .map((t) => {
        const progress = t.targetValue > 0 ? Math.min((t.currentValue / t.targetValue) * 100, 100) : 0
        return {
          id: t.id,
          type: t.type,
          targetValue: t.targetValue,
          currentValue: t.currentValue,
          progress: progress.toFixed(1),
          period: t.period,
          startDate: t.startDate,
          endDate: t.endDate,
        }
      })

    return NextResponse.json({
      targets: targetResultsWithProgress,
      detailedTargets,
      range,
    })
  } catch (error) {
    console.error('Error fetching business targets:', error)
    return NextResponse.json({ message: 'Failed to fetch business targets' }, { status: 500 })
  }
}
