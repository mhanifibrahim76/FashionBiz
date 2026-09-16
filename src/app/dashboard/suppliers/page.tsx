import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SuppliersClient } from './suppliers-client'

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const suppliers = await prisma.supplier.findMany({
    where: { businessId: session.user.business.id },
    select: {
      id: true,
      name: true,
      contact: true,
      address: true,
      productsSupplied: true,
    },
    orderBy: { name: 'asc' },
  })

  return <SuppliersClient initialSuppliers={suppliers} />
}