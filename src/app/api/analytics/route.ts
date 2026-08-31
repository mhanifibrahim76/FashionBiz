import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || 'month'

    const now = new Date()
    const startDate = subDays(now, 30)

    const [sales, products, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          businessId,
          date: { gte: startDate, lte: now },
        },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.product.findMany({
        where: { businessId },
        include: {
          category: true,
          variants: true,
          saleItems: {
            where: { sale: { date: { gte: startDate, lte: now } } },
            select: { quantity: true },
          },
        },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate, lte: now } },
        select: { amount: true, date: true },
      }),
    ])

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCOGS = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + (item.product?.costPrice || 0) * item.quantity
      }, 0)
    }, 0)
    const totalProfit = totalRevenue - totalCOGS
    const totalTransactions = sales.length
    const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalProfit - totalExpenses

    const interval = eachDayOfInterval({ start: startDate, end: now })

    const dailyData = interval.map((date, i) => {
      const dayStart = startOfDay(date)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const daySales = sales.filter(s => {
        const d = new Date(s.date)
        return d >= dayStart && d < dayEnd
      })

      const dayRevenue = daySales.reduce((sum, s) => sum + s.total, 0)
      const dayCOGS = daySales.reduce((sum, s) => {
        return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
      }, 0)
      const dayProfit = dayRevenue - dayCOGS
      const dayTransactions = daySales.length

      return {
        date: i % 5 === 0 || i === interval.length - 1 ? format(date, 'd') : '',
        revenue: dayRevenue,
        profit: dayProfit,
        transactions: dayTransactions,
      }
    })

    const categoryData: Record<string, {
      revenue: number
      units: number
      cogs: number
      profit: number
      color: string
    }> = {}

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const catName = item.product?.category?.name || 'Uncategorized'
        if (!categoryData[catName]) {
          categoryData[catName] = { revenue: 0, units: 0, cogs: 0, profit: 0, color: '' }
        }
        categoryData[catName].revenue += item.total
        categoryData[catName].units += item.quantity
        categoryData[catName].cogs += (item.product?.costPrice || 0) * item.quantity
      })
    })

    Object.keys(categoryData).forEach(cat => {
      categoryData[cat].profit = categoryData[cat].revenue - categoryData[cat].cogs
    })

    const categoryColors: Record<string, string> = {
      T_Shirt: 'bg-primary',
      Hoodie: 'bg-accent',
      Pants: 'bg-[#c9b58a]',
      Jacket: 'bg-blue-900',
      Shirt: 'bg-blue-500',
      Accessories: 'bg-muted-foreground',
    }

    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      ...data,
      color: categoryColors[name] || 'bg-slate-500',
      margin: data.cogs > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.revenue - a.revenue)

    const productPerformance = products.map(p => {
      const revenue = p.saleItems.reduce((sum, si) => sum + (si.quantity * (p.sellingPrice || 0)), 0)
      const unitsSold = p.saleItems.reduce((sum, si) => sum + si.quantity, 0)
      const cogs = unitsSold * p.costPrice
      const profit = revenue - cogs
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        unitsSold,
        revenue,
        cogs,
        profit,
        margin,
        currentStock: totalStock,
        minStock: p.minStock,
        status: totalStock <= p.minStock ? 'low' : totalStock > 60 ? 'overstock' : 'healthy',
      }
    }).sort((a, b) => b.revenue - a.revenue)

    const lowStockProducts = productPerformance.filter(p => p.status === 'low').slice(0, 5)
    const overstockProducts = productPerformance.filter(p => p.status === 'overstock').slice(0, 5)

    const deadStock = productPerformance.filter(p => {
      const sellThrough = p.unitsSold > 0 ? (p.unitsSold / (p.currentStock + p.unitsSold)) * 100 : 0
      return sellThrough < 15
    }).slice(0, 5)

    return NextResponse.json({
      kpi: {
        totalRevenue,
        totalProfit,
        profitMargin: profitMargin.toFixed(1),
        totalTransactions,
        aov: aov.toFixed(0),
        totalItemsSold,
        totalExpenses,
        netProfit,
      },
      dailyData,
      categories,
      topProducts: productPerformance.slice(0, 8),
      lowStockProducts,
      overstockProducts,
      deadStock,
      productsCount: products.length,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ message: 'Failed to fetch analytics' }, { status: 500 })
  }
}
