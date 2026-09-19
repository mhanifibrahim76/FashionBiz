import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfMonth, startOfYear, startOfWeek, subWeeks, subMonths } from 'date-fns'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function getStartDate(range: string): Date {
  const now = new Date()
  switch (range) {
    case 'week': return subWeeks(now, 1)
    case 'month': return startOfMonth(now)
    case 'year': return startOfYear(now)
    case '90d': return subDays(now, 90)
    case '30d': return subDays(now, 30)
    case '7d': return subDays(now, 7)
    default: return subDays(now, 30)
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const reportType = url.searchParams.get('type') || 'sales'
    const range = url.searchParams.get('range') || '30d'
    const format = url.searchParams.get('format') || 'csv'
    const startDate = getStartDate(range)

    const businessId = session.user.business.id

    switch (reportType) {
      case 'sales':
        return await generateSalesReport(businessId, startDate, format)
      case 'profit':
        return await generateProfitReport(businessId, startDate, format)
      case 'inventory':
        return await generateInventoryReport(businessId, format)
      case 'products':
        return await generateProductReport(businessId, startDate, format)
      default:
        return NextResponse.json({ message: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ message: 'Failed to generate report' }, { status: 500 })
  }
}

async function generateSalesReport(businessId: string, startDate: Date, formatType: string) {
  const sales = await prisma.sale.findMany({
    where: { businessId, date: { gte: startDate } },
    include: { items: { include: { product: true } } },
    orderBy: { date: 'desc' },
  })

  const headers = ['Invoice Number', 'Date', 'Payment Method', 'Items', 'Qty', 'Total', 'Notes']
  const rows: any[][] = []

  sales.forEach((sale) => {
    const itemsList = sale.items.map((item) => item.product?.name || 'Unknown').join('; ')
    const qty = sale.items.reduce((sum, item) => sum + item.quantity, 0)
    rows.push([
      sale.invoiceNumber,
      format(sale.date, 'yyyy-MM-dd HH:mm'),
      sale.paymentMethod,
      itemsList,
      qty,
      sale.total,
      sale.notes || '',
    ])
  })

  if (formatType === 'json') {
    const filename = 'sales-report-' + format(new Date(), 'yyyy-MM-dd')
    return NextResponse.json({ title: 'Sales Report', headers, rows, filename })
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => row.map((v) => escapeCsv(String(v))).join(',')),
  ]
  const csv = csvRows.join('\n')
  const filename = 'sales-report-' + format(new Date(), 'yyyy-MM-dd') + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
    },
  })
}

async function generateProfitReport(businessId: string, startDate: Date, formatType: string) {
  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, date: { gte: startDate } },
      include: { items: { include: { product: true } } },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: startDate } },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
  ])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalCOGS = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
  }, 0)
  const grossProfit = totalRevenue - totalCOGS
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = grossProfit - totalExpenses

  const headers = ['Period', 'Revenue', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit']
  const rows: any[][] = []

  const months = Math.min(Math.ceil((Date.now() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)), 6)
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(startDate)
    monthStart.setMonth(monthStart.getMonth() + i)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    const monthSales = sales.filter(s => {
      const d = new Date(s.date)
      return d >= monthStart && d < monthEnd
    })
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d >= monthStart && d < monthEnd
    })

    const rev = monthSales.reduce((sum, s) => sum + s.total, 0)
    const cogs = monthSales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => itemSum + (item.product?.costPrice || 0) * item.quantity, 0)
    }, 0)
    const gp = rev - cogs
    const exp = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const np = gp - exp

    rows.push([
      format(monthStart, 'MMM yyyy'),
      rev,
      cogs,
      gp,
      exp,
      np,
    ])
  }

  rows.push([])
  rows.push(['Summary'])
  rows.push(['Total Revenue', totalRevenue])
  rows.push(['Total COGS', totalCOGS])
  rows.push(['Gross Profit', grossProfit])
  rows.push(['Gross Margin', grossMargin.toFixed(1) + '%'])
  rows.push(['Total Expenses', totalExpenses])
  rows.push(['Net Profit', netProfit])

  if (formatType === 'json') {
    const filename = 'profit-report-' + format(new Date(), 'yyyy-MM-dd')
    return NextResponse.json({
      title: 'Profit Report',
      headers,
      rows,
      additionalInfo: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin: grossMargin.toFixed(1) + '%',
        totalExpenses,
        netProfit,
      },
      filename,
    })
  }

  const csvRows = [
    headers.join(','),
    ...rows.slice(0, months).map((row) => row.map((v) => escapeCsv(String(v))).join(',')),
    '',
    'Summary',
    'Total Revenue,' + totalRevenue,
    'Total COGS,' + totalCOGS,
    'Gross Profit,' + grossProfit,
    'Gross Margin,' + grossMargin.toFixed(1) + '%',
    'Total Expenses,' + totalExpenses,
    'Net Profit,' + netProfit,
  ]

  const csv = csvRows.join('\n')
  const filename2 = 'profit-report-' + format(new Date(), 'yyyy-MM-dd') + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + filename2 + '"',
    },
  })
}

async function generateInventoryReport(businessId: string, formatType: string) {
  const products = await prisma.product.findMany({
    where: { businessId },
    include: {
      variants: true,
      category: true,
    },
    orderBy: { name: 'asc' },
  })

  const headers = ['Product Name', 'SKU', 'Category', 'Variant', 'Stock', 'Min Stock', 'Stock Value', 'Status']
  const rows: any[][] = []

  products.forEach((p) => {
    p.variants.forEach((v) => {
      const stockValue = v.stock * p.costPrice
      const status = v.stock <= p.minStock ? 'Low Stock' : v.stock > 60 ? 'Overstock' : 'Healthy'
      const variantName = v.size || v.color || 'Default'
      rows.push([
        p.name,
        p.sku,
        p.category?.name || 'Uncategorized',
        variantName,
        v.stock,
        p.minStock,
        stockValue.toFixed(0),
        status,
      ])
    })
  })

  if (formatType === 'json') {
    const filename = 'inventory-report-' + format(new Date(), 'yyyy-MM-dd')
    return NextResponse.json({ title: 'Inventory Report', headers, rows, filename })
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => row.map((v) => escapeCsv(String(v))).join(',')),
  ]
  const csv = csvRows.join('\n')
  const filename = 'inventory-report-' + format(new Date(), 'yyyy-MM-dd') + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
    },
  })
}

async function generateProductReport(businessId: string, startDate: Date, formatType: string) {
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
    orderBy: { name: 'asc' },
  })

  const headers = ['Product Name', 'SKU', 'Category', 'Units Sold', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Current Stock', 'Min Stock']
  const rows: any[][] = []

  products.forEach((p) => {
    const unitsSold = p.saleItems.reduce((sum, si) => sum + si.quantity, 0)
    const revenue = p.saleItems.reduce((sum, si) => sum + si.total, 0)
    const cogs = unitsSold * p.costPrice
    const profit = revenue - cogs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)

    rows.push([
      p.name,
      p.sku,
      p.category?.name || 'Uncategorized',
      unitsSold,
      revenue.toFixed(0),
      cogs.toFixed(0),
      profit.toFixed(0),
      margin.toFixed(1),
      totalStock,
      p.minStock,
    ])
  })

  if (formatType === 'json') {
    const filename = 'product-report-' + format(new Date(), 'yyyy-MM-dd')
    return NextResponse.json({ title: 'Product Performance', headers, rows, filename })
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => row.map((v) => escapeCsv(String(v))).join(',')),
  ]
  const csv = csvRows.join('\n')
  const filename = 'product-report-' + format(new Date(), 'yyyy-MM-dd') + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
    },
  })
}
