import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SalesClient } from '@/components/sales/sales-client'

export default async function SalesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })
  if (!business?.onboarded) redirect('/dashboard/setup-wizard')

  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: session.user.business.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.product.findMany({
      where: { businessId: session.user.business.id },
      include: {
        variants: {
          select: { id: true, size: true, color: true, stock: true },
        },
        category: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <SalesClient
      initialSales={JSON.parse(JSON.stringify(sales))}
      products={JSON.parse(JSON.stringify(products))}
    />
  )
}
