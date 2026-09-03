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

    const [sales, products, expenses, business, targets] = await Promise.all([
      prisma.sale.findMany({
        where: { businessId, date: { gte: startDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.product.findMany({
        where: { businessId },
        include: {
          category: true,
          variants: true,
          saleItems: {
            where: { sale: { date: { gte: startDate } } },
            select: { quantity: true, total: true },
          },
        },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate } },
        select: { amount: true },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { targetOmzet: true, targetLaba: true },
      }),
      prisma.businessTarget.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
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

    const insights: any[] = []

    const lowStockProducts = productPerformance.filter((p) => p.minStock > 0 && p.currentStock <= p.minStock)
    if (lowStockProducts.length > 0) {
      lowStockProducts.slice(0, 3).forEach((p) => {
        insights.push({
          type: 'LOW_STOCK',
          priority: 'HIGH',
          icon: '🔴',
          title: 'Stok rendah',
          description: `${p.name} hampir kehabisan stok.`,
          data: { currentStock: p.currentStock, minStock: p.minStock },
          recommendation: 'Pertimbangkan untuk melakukan restock segera.',
        })
      })
    }

    const outOfStockProducts = productPerformance.filter((p) => p.currentStock === 0)
    if (outOfStockProducts.length > 0) {
      outOfStockProducts.slice(0, 3).forEach((p) => {
        insights.push({
          type: 'OUT_OF_STOCK',
          priority: 'CRITICAL',
          icon: '🔴',
          title: 'Stok habis',
          description: `${p.name} sudah habis.`,
          data: { currentStock: 0, minStock: p.minStock },
          recommendation: 'Segera lakukan restock untuk menghindari kehilangan penjualan.',
        })
      })
    }

    const lowMarginProducts = productPerformance
      .filter((p) => p.revenue > 0 && p.margin < 20)
      .sort((a, b) => a.margin - b.margin)
    if (lowMarginProducts.length > 0) {
      lowMarginProducts.slice(0, 3).forEach((p) => {
        insights.push({
          type: 'LOW_MARGIN',
          priority: 'MEDIUM',
          icon: '🟡',
          title: 'Margin rendah',
          description: `${p.name} memiliki margin ${p.margin.toFixed(1)}% dengan penjualan ${p.unitsSold} unit.`,
          data: { margin: p.margin, unitsSold: p.unitsSold, revenue: p.revenue },
          recommendation: 'Pertimbangkan review harga jual atau cari supplier alternatif untuk mengurangi biaya.',
        })
      })
    }

    const topProfitProducts = [...productPerformance]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 1)
    if (topProfitProducts.length > 0 && topProfitProducts[0].profit > 0) {
      const p = topProfitProducts[0]
      insights.push({
        type: 'TOP_PERFORMER',
        priority: 'LOW',
        icon: '🟢',
        title: 'Performa terbaik',
        description: `${p.name} menghasilkan profit tertinggi sebesar ${_formatCurrency(p.profit)}.`,
        data: { profit: p.profit, unitsSold: p.unitsSold, margin: p.margin },
        recommendation: 'Pertimbangkan untuk mempertahankan stok yang cukup untuk produk ini.',
      })
    }

    const soldProducts = productPerformance.filter((p) => p.unitsSold > 0)
    if (soldProducts.length > 0) {
      const slowMoving = [...soldProducts]
        .filter((p) => {
          const sellRatio = p.currentStock > 0 ? p.unitsSold / p.currentStock : 0
          return sellRatio < 0.5
        })
        .sort((a, b) => a.unitsSold - b.unitsSold)
      if (slowMoving.length > 0) {
        slowMoving.slice(0, 3).forEach((p) => {
          insights.push({
            type: 'SLOW_MOVING',
            priority: 'MEDIUM',
            icon: '⚠️',
            title: 'Produk tidak laku',
            description: `${p.name} hanya terjual ${p.unitsSold} unit dalam periode ini.`,
            data: { unitsSold: p.unitsSold, currentStock: p.currentStock },
            recommendation: 'Pertimbangkan promosi, bundling, atau review harga untuk mempercepat rotasi.',
          })
        })
      }
    }

    const deadStockProducts = productPerformance.filter((p) => p.unitsSold === 0 && p.currentStock > 0)
    if (deadStockProducts.length > 0) {
      deadStockProducts.slice(0, 3).forEach((p) => {
        insights.push({
          type: 'DEAD_STOCK',
          priority: 'MEDIUM',
          icon: '⚠️',
          title: 'Stok tidak bergerak',
          description: `${p.name} belum terjual dalam periode ini dengan stok ${p.currentStock} unit.`,
          data: { currentStock: p.currentStock },
          recommendation: 'Pertimbangkan promosi agresif atau bundling untuk mengurangi stok.',
        })
      })
    }

    if (business?.targetOmzet && business.targetOmzet > 0) {
      const progress = (totalRevenue / business.targetOmzet) * 100
      if (progress < 80) {
        insights.push({
          type: 'TARGET_BEHIND',
          priority: 'HIGH',
          icon: '🔴',
          title: 'Target omzet tertentan',
          description: `Omzet Rp ${_formatCurrency(totalRevenue / 1000000)}M dari target Rp ${_formatCurrency(business.targetOmzet / 1000000)}M (${progress.toFixed(0)}%).`,
          data: { current: totalRevenue, target: business.targetOmzet, progress },
          recommendation: 'Tingkatkan promosi dan fokus pada produk dengan margin tinggi.',
        })
      }
    }

    if (totalRevenue > 0 && netProfit < 0) {
      insights.push({
        type: 'NET_LOSS',
        priority: 'CRITICAL',
        icon: '🔴',
        title: 'Kerugian bersih',
        description: `Laba bersih negatif sebesar Rp ${_formatCurrency(Math.abs(netProfit) / 1000000)}M.`,
        data: { netProfit, totalExpenses, grossProfit },
        recommendation: 'Review pengeluaran operasional dan pertimbangkan peningkatan harga jual.',
      })
    }

    if (totalExpenses > grossProfit * 0.5 && grossProfit > 0) {
      insights.push({
        type: 'HIGH_EXPENSES',
        priority: 'HIGH',
        icon: '🔴',
        title: 'Pengeluaran tinggi',
        description: `Pengeluaran operasional mencapai ${_formatCurrency(totalExpenses / 1000000)}M, melebihi separuh laba kotor.`,
        data: { expenses: totalExpenses, grossProfit },
        recommendation: 'Audit pengeluaran dan identifikasi biaya yang dapat dikurangi.',
      })
    }

    if (totalTransactions > 0 && totalRevenue / totalTransactions < 50000) {
      insights.push({
        type: 'LOW_AOV',
        priority: 'MEDIUM',
        icon: '🟡',
        title: 'AOV rendah',
        description: `Rata-rata nilai pesanan hanya Rp ${_formatCurrency(totalRevenue / totalTransactions)}.`,
        data: { aov: totalRevenue / totalTransactions, transactions: totalTransactions },
        recommendation: 'Pertimbangkan bundling produk atau peningkatan harga untuk meningkatkan AOV.',
      })
    }

    if (insights.length === 0) {
      insights.push({
        type: 'NO_INSIGHTS',
        priority: 'INFO',
        icon: '✅',
        title: 'Tidak ada insight signifikan',
        description: 'Tidak ada masalah signifikan terdeteksi untuk periode ini.',
        data: {},
        recommendation: 'Lanjutkan pemantauan rutin.',
      })
    }

    function _formatCurrency(amount: number) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    insights.sort((a, b) => {
      const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
      return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5)
    })

    return NextResponse.json({ insights, range })
  } catch (error) {
    console.error('Error fetching analytics insights:', error)
    return NextResponse.json({ message: 'Failed to fetch analytics insights' }, { status: 500 })
  }
}
