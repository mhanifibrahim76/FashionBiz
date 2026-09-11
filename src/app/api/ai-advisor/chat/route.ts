import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

function buildBusinessContext(
  business: any,
  products: any[],
  sales: any[],
  expenses: any[],
  lowStockProducts: any[]
) {
  const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
  const totalCOGS = sales.reduce((sum: number, s: any) => {
    return sum + (s.items?.reduce((itemSum: number, item: any) => {
      return itemSum + ((item.product?.costPrice || 0) * (item.quantity || 0))
    }, 0) || 0)
  }, 0)
  const totalProfit = totalRevenue - totalCOGS
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
  const netProfit = totalProfit - totalExpenses
  const totalItemsSold = sales.reduce(
    (sum: number, s: any) => sum + (s.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0),
    0
  )

  const productSummaries = products
    .slice(0, 15)
    .map((p: any) => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
      const unitsSold = p.saleItems?.reduce((sum: number, si: any) => sum + (si.quantity || 0), 0) || 0
      const margin =
        p.sellingPrice > 0
          ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1)
          : '0'
      return {
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        margin: `${margin}%`,
        stock: totalStock,
        minStock: p.minStock,
        unitsSold: unitsSold,
      }
    })

  const context = `
Business: ${business?.name || 'Fashion Store'} (${business?.type || 'Retail'})
Location: ${business?.location || 'N/A'}
Established: ${business?.yearEstablished || 'N/A'}
Employee count: ${business?.employeeCount || 'N/A'}
Sales channels: ${business?.salesChannels?.join(', ') || 'N/A'}

Financial Summary (last 30 days):
- Total Revenue: Rp${Math.round(totalRevenue).toLocaleString('id-ID')}
- Total COGS: Rp${Math.round(totalCOGS).toLocaleString('id-ID')}
- Gross Profit: Rp${Math.round(totalProfit).toLocaleString('id-ID')}
- Operating Expenses: Rp${Math.round(totalExpenses).toLocaleString('id-ID')}
- Net Profit: Rp${Math.round(netProfit).toLocaleString('id-ID')}
- Total Items Sold: ${totalItemsSold.toLocaleString('id-ID')}
- Total Transactions: ${sales.length}
- Profit Margin: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
- AOV: Rp${Math.round(sales.length > 0 ? totalRevenue / sales.length : 0).toLocaleString('id-ID')}

Products (${products.length} total):
${JSON.stringify(productSummaries, null, 2)}

Low Stock Products: ${lowStockProducts
    .map(
      (p: any) =>
        `${p.name} (stock: ${p.currentStock}, min: ${p.minStock})`
    )
    .join(', ') || 'None'}

Business Targets:
- Target Omzet: ${business?.targetOmzet ? `Rp${Math.round(business.targetOmzet).toLocaleString('id-ID')}` : 'Not set'}
- Target Laba: ${business?.targetLaba ? `Rp${Math.round(business.targetLaba).toLocaleString('id-ID')}` : 'Not set'}
- Target Transaksi: ${business?.targetTransaksi || 'Not set'}
- Target Growth: ${business?.targetGrowth ? `${business.targetGrowth}%` : 'Not set'}
`

  return context.trim()
}

async function callOpenAI(messages: any[], context: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return `AI Advisor Demo Mode

Berdasarkan data bisnis Anda:

${context}

Saya dapat melihat bahwa bisnis Anda memiliki ${messages.length} interaksi. Untuk fitur AI yang sepenuhnya fungsional, silakan konfigurasi OPENAI_API_KEY di file .env Anda.

Rekomendasi berdasarkan data:
- Periksa stok produk secara rutin untuk menghindari kehabisan
- Fokus pada produk dengan margin tinggi
- Pantau tren penjualan harian untuk prediksi permintaan`
  }

  const systemPrompt = `You are FashionBiz AI Advisor, a helpful business intelligence assistant for fashion retail SMEs in Indonesia. 

Your job is to analyze business data and provide actionable insights about revenue, profit, inventory, pricing, and sales performance. Always respond in Indonesian. Be concise but helpful. Use Rupiah (Rp) formatting when mentioning amounts.

Business context:
${context}

When answering, ground your response in the actual data above. If asked about restocking, reference the low stock products. If asked about profit, reference the financial summary and product margins. If the data is insufficient for a question, say so and suggest what data would help.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  return completion.choices[0]?.message?.content || 'Maaf, tidak dapat memproses permintaan Anda.'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: 'Messages required' }, { status: 400 })
    }

    const userMessages = messages.filter((m: any) => m.role !== 'system')

    const [products, sales, expenses, business] = await Promise.all([
      prisma.product.findMany({
        where: { businessId },
        include: {
          category: true,
          variants: true,
          saleItems: {
            where: { sale: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            select: { quantity: true, total: true },
          },
        },
      }),
      prisma.sale.findMany({
        where: {
          businessId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: { items: { include: { product: true } } },
      }),
      prisma.expense.findMany({
        where: {
          businessId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { amount: true },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
      }),
    ])

    const lowStockProducts = products
      .filter((p) => p.variants.some((v) => v.stock <= p.minStock))
      .map((p: any) => ({
        name: p.name,
        currentStock: p.variants.reduce((sum: number, v: any) => sum + v.stock, 0),
        minStock: p.minStock,
      }))

    const context = buildBusinessContext(business, products, sales, expenses, lowStockProducts)

    const openaiMessages = userMessages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    const aiResponse = await callOpenAI(openaiMessages, context)

    return NextResponse.json({
      reply: aiResponse,
      lowStockCount: lowStockProducts.length,
    })
  } catch (error) {
    console.error('AI Advisor API error:', error)
    return NextResponse.json(
      { message: 'Gagal memproses permintaan AI' },
      { status: 500 }
    )
  }
}
