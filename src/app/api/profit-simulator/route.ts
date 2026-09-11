import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { productId, discount, newPrice } = await request.json()

    if (!productId) {
      return NextResponse.json({ message: 'Product ID required' }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: {
        variants: true,
        category: true,
        saleItems: {
          where: { sale: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
          select: { quantity: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const costPrice = product.costPrice
    const originalPrice = product.sellingPrice
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
    const unitsSold = product.saleItems.reduce((sum, si) => sum + si.quantity, 0)

    const avgMonthlySales = unitsSold / 3
    const originalProfitPerUnit = originalPrice - costPrice
    const originalMargin = originalPrice > 0 ? ((originalProfitPerUnit / originalPrice) * 100) : 0

    const simulatedPrice = newPrice != null ? newPrice : Math.max(0, originalPrice * (1 - discount / 100))
    const simulatedProfitPerUnit = simulatedPrice - costPrice
    const simulatedMargin = simulatedPrice > 0 ? ((simulatedProfitPerUnit / simulatedPrice) * 100) : 0

    const discountAmount = originalPrice - simulatedPrice
    const profitPerUnitChange = simulatedProfitPerUnit - originalProfitPerUnit

    const isProfitable = simulatedProfitPerUnit > 0
    const isGoodMargin = simulatedMargin >= 15
    const marginDrop = originalMargin - simulatedMargin

    let recommendation = ''
    let isRecommendationGood = false

    if (isProfitable && isGoodMargin) {
      recommendation = `Diskon ${discount}% masih menguntungkan. Margin ${simulatedMargin.toFixed(1)}% di atas ambang 15%. Dapat meningkatkan volume penjualan.`
      isRecommendationGood = true
    } else if (isProfitable && !isGoodMargin) {
      recommendation = `Diskon ${discount}% masih menguntungkan tetapi margin turun ke ${simulatedMargin.toFixed(1)}%. Pertimbangkan bundling dengan produk lain.`
      isRecommendationGood = true
    } else if (!isProfitable) {
      recommendation = `Diskon ${discount}% menyebabkan ruginet per unit. Harga jual di bawah harga modal (Rp${formatCurrency(costPrice)}).`
      isRecommendationGood = false
    }

    let aiRecommendationText = recommendation
    let aiConfidence = 'data'

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      const prompt = `Sebuah produk fashion bernama "${product.name}" (${product.category?.name}) memiliki:
- Harga jual original: Rp${originalPrice.toLocaleString('id-ID')}
- Harga modal: Rp${costPrice.toLocaleString('id-ID')}
- Margin original: ${originalMargin.toFixed(1)}%
- Stok saat ini: ${totalStock} unit
- Penjualan 90 hari terakhir: ${unitsSold} unit (${avgMonthlySales.toFixed(0)} rata-rata/bulan)

Simulasi: diskon ${discount ?? 0}% (harga baru: Rp${simulatedPrice.toLocaleString('id-ID')}), profit per unit turun dari Rp${originalProfitPerUnit.toLocaleString('id-ID')} ke Rp${simulatedProfitPerUnit.toLocaleString('id-ID')}, margin turun dari ${originalMargin.toFixed(1)}% ke ${simulatedMargin.toFixed(1)}%.

Berikan rekomendasi singkat (1-2 kalimat, maksimal 50 kata) dalam Bahasa Indonesia tentang apakah diskon ini masuk akal dan apa alternatifnya.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah asisten bisnis AI untuk UMKM fashion. Beri saran singkat dan praktis.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
      })

      aiRecommendationText = completion.choices[0]?.message?.content || recommendation
      aiConfidence = 'openai'
    }

    return NextResponse.json({
      product: {
        name: product.name,
        sku: product.sku,
        category: product.category?.name,
        costPrice,
        originalPrice,
        totalStock,
        unitsSold,
        avgMonthlySales,
      },
      simulation: {
        discount: discount ?? 0,
        simulatedPrice,
        discountAmount,
        originalProfitPerUnit,
        simulatedProfitPerUnit,
        profitPerUnitChange,
        originalMargin: originalMargin.toFixed(1),
        simulatedMargin: simulatedMargin.toFixed(1),
        marginDrop: marginDrop.toFixed(1),
        isProfitable,
        isGoodMargin,
        isGoodMove: isRecommendationGood,
      },
      recommendation: {
        text: aiRecommendationText,
        isGoodMove: isRecommendationGood,
        confidence: aiConfidence,
      },
    })
  } catch (error) {
    console.error('Profit simulator error:', error)
    return NextResponse.json(
      { message: 'Gagal memproses simulasi profit' },
      { status: 500 }
    )
  }
}
