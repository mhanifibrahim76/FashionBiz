import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId, quantity, discount = 0, notes, paymentMethod = "Cash", salesChannel = "Toko Fisik" } = body
    const businessId = session.user.business.id

    if (!productId) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: { variants: true },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    let variant
    if (variantId) {
      variant = product.variants.find((v) => v.id === variantId)
    } else {
      variant = product.variants[0]
    }

    if (!variant) {
      return NextResponse.json({ message: "Variant not found" }, { status: 404 })
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const unitPrice = product.sellingPrice
    const itemTotal = unitPrice * qty - (discount || 0)
    const invoiceNumber = "INV-" + Date.now().toString().slice(-8)

    if (variant.stock < qty) {
      return NextResponse.json({ message: "Insufficient stock" }, { status: 400 })
    }

    const result = await prisma.sale.create({
      data: {
        invoiceNumber,
        date: new Date(),
        paymentMethod,
        salesChannel,
        discount: discount || 0,
        total: itemTotal,
        status: "COMPLETED",
        notes,
        businessId,
        items: {
          create: {
            quantity: qty,
            unitPrice,
            total: itemTotal,
            productId: product.id,
            variantId: variant.id,
          },
        },
      },
    })

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: qty } },
    })

    return NextResponse.json({ success: true, saleId: result.id, invoiceNumber }, { status: 200 })
  } catch (error) {
    console.error("Sale record error:", error)
    return NextResponse.json({ message: "Failed to record sale" }, { status: 500 })
  }
}
