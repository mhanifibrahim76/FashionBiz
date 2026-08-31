import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, sku, costPrice, sellingPrice, stock, minStock } = body

    if (!name || !category || !sku || costPrice == null || sellingPrice == null || stock == null || minStock == null) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const existingProduct = await prisma.product.findFirst({
      where: { id: params.id, businessId: session.user.business.id },
      include: { variants: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const categoryRecord = await prisma.category.findUnique({
      where: { name: category },
    })

    if (!categoryRecord) {
      return NextResponse.json({ message: 'Category not found' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        sku,
        costPrice,
        sellingPrice,
        minStock,
        categoryId: categoryRecord.id,
        variants: {
          update: {
            where: { id: existingProduct.variants[0]?.id },
            data: { stock },
          },
        },
      },
      include: { variants: true, category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id

    const existingProduct = await prisma.product.findFirst({
      where: { id: params.id, businessId },
      include: { variants: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      const variantIds = existingProduct.variants.map(v => v.id)

      await tx.inventoryTransaction.deleteMany({
        where: { productId: params.id },
      })

      if (variantIds.length > 0) {
        await tx.inventoryTransaction.deleteMany({
          where: { variantId: { in: variantIds } },
        })
        await tx.saleItem.deleteMany({
          where: { variantId: { in: variantIds } },
        })
      }

      await tx.saleItem.deleteMany({
        where: { productId: params.id },
      })

      await tx.purchaseItem.deleteMany({
        where: { productId: params.id },
      })

      await tx.productVariant.deleteMany({
        where: { productId: params.id },
      })

      await tx.product.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 })
  }
}
