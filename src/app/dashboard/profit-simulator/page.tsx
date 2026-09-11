import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfitSimulatorClient from '@/components/profit-simulator/profit-simulator-client'

export type SimProduct = {
  id: string
  name: string
  sku: string
  sellingPrice: number
  costPrice: number
  minStock: number
  currentStock: number
  unitsSold: number
  category: string
}

export default async function ProfitSimulatorPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })
  if (!business?.onboarded) redirect('/dashboard/setup-wizard')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const products = await prisma.product.findMany({
    where: { businessId: session.user.business.id },
    include: {
      variants: true,
      category: true,
      saleItems: {
        where: { sale: { date: { gte: thirtyDaysAgo } } },
        select: { quantity: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const simProducts: SimProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice,
    minStock: p.minStock,
    currentStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    unitsSold: p.saleItems.reduce((sum, si) => sum + si.quantity, 0),
    category: p.category?.name || 'Uncategorized',
  }))

  return <ProfitSimulatorClient products={JSON.parse(JSON.stringify(simProducts))} />
}
