import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProductsClient } from '@/components/products/products-client'

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.user.business.id },
      include: { variants: true, category: true },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const categoriesList = categories.map(c => c.name)

  return <ProductsClient initialProducts={products} categories={categoriesList} />
}
