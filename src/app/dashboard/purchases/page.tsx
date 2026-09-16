import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PurchasesClient } from './purchases-client'

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const purchases = await prisma.purchase.findMany({
    where: { businessId: session.user.business.id },
    include: { supplier: true, items: { include: { product: true, variant: true } } },
    orderBy: { date: 'desc' },
    take: 20,
  })

  return <PurchasesClient initialPurchases={purchases} />
}