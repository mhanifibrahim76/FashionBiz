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
    const sortBy = url.searchParams.get('sort') || 'revenue'
    const businessId = session.user.business.id
    const startDate = getStartDate(range)

    const products = await prisma.product.findMany({
      where: { businessId },
      include: {
        category: true,
        variants: true,
        saleItems: {
          where: { sale: { date: { gte: startDate } } },
          select: { quantity: true, total: true },
        },
      },
    })

    const productPerformance = products.map((p) => {
      const unitsSold = p.saleItems.reduce((sum: number, si) => sum + si.quantity, 0)
      const revenue = p.saleItems.reduce((sum: number, si) => sum + si.total, 0)
      const cogs = unitsSold * p.costPrice
      const profit = revenue - cogs
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0
      const totalStock = p.variants.reduce((sum: number, v) => sum + v.stock, 0)

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
      }
    })

    productPerformance.sort((a, b) => {
      switch (sortBy) {
        case 'profit': return b.profit - a.profit
        case 'units': return b.unitsSold - a.unitsSold
        case 'margin': return b.margin - a.margin
        case 'revenue':
        default: return b.revenue - a.revenue
      }
    })

    return NextResponse.json({
      products: productPerformance.slice(0, 10),
      allProducts: productPerformance,
      range,
      sortBy,
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json({ message: 'Failed to fetch product analytics' }, { status: 500 })
  }
}
