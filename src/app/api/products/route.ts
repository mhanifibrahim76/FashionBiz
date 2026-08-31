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

    const body = await request.json()
    const { name, category, sku, costPrice, sellingPrice, stock, minStock } = body

    if (!name || !category || !sku || costPrice == null || sellingPrice == null || stock == null || minStock == null) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const categoryRecord = await prisma.category.findUnique({
      where: { name: category },
    })

    if (!categoryRecord) {
      return NextResponse.json({ message: 'Category not found' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        costPrice,
        sellingPrice,
        minStock,
        businessId: session.user.business.id,
        categoryId: categoryRecord.id,
        variants: {
          create: {
            size: 'One Size',
            color: 'Default',
            stock,
          },
        },
      },
      include: { variants: true, category: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ message: 'Failed to create product' }, { status: 500 })
  }
}
