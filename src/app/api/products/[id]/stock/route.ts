import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quantity, notes } = body

    if (quantity == null || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json({ message: 'Quantity must be a positive number' }, { status: 400 })
    }

    const qty = Number(quantity)

    const businessId = session.user.business.id

    const product = await prisma.product.findFirst({
      where: { id: params.id, businessId },
      include: { variants: true },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const variant = product.variants[0]
    if (!variant) {
      return NextResponse.json({ message: 'No variant found for product' }, { status: 404 })
    }

    const newStock = variant.stock + qty

    await prisma.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: newStock },
      })

      await tx.inventoryTransaction.create({
        data: {
          type: 'IN',
          quantity: qty,
          notes: notes || null,
          businessId,
          productId: product.id,
          variantId: variant.id,
        },
      })
    })

    return NextResponse.json({
      productId: product.id,
      variantId: variant.id,
      previousStock: variant.stock,
      addedQuantity: qty,
      newStock,
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json({ message: 'Failed to adjust stock' }, { status: 500 })
  }
}
