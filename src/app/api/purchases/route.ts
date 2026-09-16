import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const body = await request.json()
    const { productId, supplierId, items, notes } = body

    if (!productId || !items || items.length === 0) {
      return NextResponse.json(
        { message: 'Product and items are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const existingPending = await prisma.purchase.findFirst({
      where: {
        businessId,
        status: 'PENDING',
        items: { some: { productId } },
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { message: 'Produk ini sudah memiliki reorder yang masih pending. Tunggu dulu atau batalkan reorder sebelumnya.' },
        { status: 400 }
      )
    }

    let supplier = null
    if (supplierId) {
      supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, businessId },
      })
      if (!supplier) {
        return NextResponse.json({ message: 'Supplier not found' }, { status: 404 })
      }
    }

    const total = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )

    const purchaseNumber = `PO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          date: new Date(),
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          total,
          businessId,
          supplierId: supplierId || null,
        },
      })

      for (const item of items) {
        await tx.purchaseItem.create({
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            purchaseId: newPurchase.id,
            productId: product.id,
            variantId: item.variantId,
          },
        })
      }

      return newPurchase
    })

    return NextResponse.json({
      id: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      total: purchase.total,
      status: purchase.status,
      message: 'Reorder created successfully',
    })
  } catch (error) {
    console.error('Error creating reorder:', error)
    return NextResponse.json({ message: 'Failed to create reorder' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { businessId: session.user.business.id },
        include: {
          supplier: true,
          items: { include: { product: true, variant: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where: { businessId: session.user.business.id } }),
    ])

    return NextResponse.json({ purchases, total, page, limit })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ message: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const body = await request.json()
    const { purchaseId } = body

    if (!purchaseId) {
      return NextResponse.json({ message: 'Purchase ID is required' }, { status: 400 })
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, businessId },
      include: { items: true },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Purchase already received or completed' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        if (item.variantId) {
          const vid: string = item.variantId
          const variant = await tx.productVariant.findFirst({
            where: { id: vid },
          })

          if (variant) {
            await tx.productVariant.update({
              where: { id: vid },
              data: { stock: { increment: item.quantity } },
            })
          }
        }

        await tx.inventoryTransaction.create({
          data: {
            type: 'IN',
            quantity: item.quantity,
            notes: `Receive purchase ${purchase.purchaseNumber}`,
            businessId,
            productId: item.productId,
            variantId: item.variantId,
          },
        })
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'COMPLETED' },
      })
    })

    return NextResponse.json({
      message: 'Purchase received successfully',
      purchaseNumber: purchase.purchaseNumber,
    })
  } catch (error) {
    console.error('Error receiving purchase:', error)
    return NextResponse.json({ message: 'Failed to receive purchase' }, { status: 500 })
  }
}