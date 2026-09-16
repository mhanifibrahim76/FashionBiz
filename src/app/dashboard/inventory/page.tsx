import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InventoryClient } from './inventory-client'

export default async function InventoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const [products, suppliers, pendingPurchases] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.user.business.id },
      include: { variants: true, category: true },
    }),
    prisma.supplier.findMany({
      where: { businessId: session.user.business.id },
      select: { id: true, name: true, contact: true, address: true },
    }),
    prisma.purchaseItem.findMany({
      where: {
        purchase: { status: 'PENDING', businessId: session.user.business.id },
      },
      select: { productId: true, quantity: true },
    }),
  ])

  return <InventoryClient products={products} suppliers={suppliers} pendingPurchases={pendingPurchases} />
}