import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStartDate, Period } from '../date-utils'

const categoryColors: Record<string, string> = {
  Kaos: 'bg-primary',
  Hoodie: 'bg-accent',
  Celana: 'bg-[#c9b58a]',
  Jaket: 'bg-blue-900',
  Kemeja: 'bg-blue-500',
}

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

    const sales = await prisma.sale.findMany({
      where: { businessId, date: { gte: startDate } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    })

    const categoryData: Record<string, {
      revenue: number
      units: number
      cogs: number
      profit: number
    }> = {}

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const catName = item.product?.category?.name || 'Uncategorized'
        if (!categoryData[catName]) {
          categoryData[catName] = { revenue: 0, units: 0, cogs: 0, profit: 0 }
        }
        categoryData[catName].revenue += item.total
        categoryData[catName].units += item.quantity
        categoryData[catName].cogs += (item.product?.costPrice || 0) * item.quantity
      })
    })

    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      units: data.units,
      cogs: data.cogs,
      profit: data.profit,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
      color: categoryColors[name] || 'bg-slate-500',
    })).sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({ categories, range })
  } catch (error) {
    console.error('Error fetching category analytics:', error)
    return NextResponse.json({ message: 'Failed to fetch category analytics' }, { status: 500 })
  }
}
