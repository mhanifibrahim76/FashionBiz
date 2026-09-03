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

    const products = await prisma.product.findMany({
      where: { businessId },
      include: {
        category: true,
        variants: true,
        saleItems: {
          where: { sale: { date: { gte: startDate } } },
          select: { quantity: true },
        },
      },
    })

    const inventoryData = products.map((p) => {
      const totalStock = p.variants.reduce((sum: number, v) => sum + v.stock, 0)
      const unitsSold = p.saleItems.reduce((sum: number, si) => sum + si.quantity, 0)
      const sellThrough = totalStock > 0 ? (unitsSold / (totalStock + unitsSold)) * 100 : 0

      let status = 'healthy'
      let statusLabel = 'Sehat'
      if (p.minStock > 0 && totalStock <= p.minStock) {
        status = 'low'
        statusLabel = 'Stok Rendah'
      } else if (totalStock === 0) {
        status = 'out_of_stock'
        statusLabel = 'Habis'
      } else if (sellThrough > 0 && sellThrough < 20 && unitsSold > 0 && totalStock > 10) {
        status = 'overstock'
        statusLabel = 'Stok Berlebih'
      } else if (unitsSold === 0 && totalStock > 0) {
        status = 'dead_stock'
        statusLabel = 'Stok Tidak Bergerak'
      } else if (unitsSold > 0 && sellThrough < 50) {
        status = 'slow_moving'
        statusLabel = 'Penjualan Lambat'
      }

      let recommendation = ''
      if (status === 'low') {
        recommendation = 'Perlu restock segera'
      } else if (status === 'out_of_stock') {
        recommendation = 'Stok habis, segera lakukan restock'
      } else if (status === 'dead_stock') {
        recommendation = 'Pertimbangkan promosi atau harga diskon'
      } else if (status === 'slow_moving') {
        recommendation = 'Pertimbangkan promosi atau review harga'
      } else if (status === 'overstock') {
        recommendation = 'Stok tinggi, pertimbangkan bundling atau promosi'
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: totalStock,
        minStock: p.minStock,
        unitsSold,
        sellThrough: sellThrough.toFixed(1),
        status,
        statusLabel,
        recommendation,
      }
    })

    const lowStockProducts = inventoryData.filter((p) => p.status === 'low' || p.status === 'out_of_stock').slice(0, 5)
    const slowMovingProducts = inventoryData.filter((p) => p.status === 'slow_moving' || p.status === 'dead_stock').slice(0, 5)
    const overstockProducts = inventoryData.filter((p) => p.status === 'overstock').slice(0, 5)

    return NextResponse.json({
      lowStockProducts,
      slowMovingProducts,
      overstockProducts,
      inventoryData: inventoryData.slice(0, 20),
      range,
    })
  } catch (error) {
    console.error('Error fetching inventory analytics:', error)
    return NextResponse.json({ message: 'Failed to fetch inventory analytics' }, { status: 500 })
  }
}
