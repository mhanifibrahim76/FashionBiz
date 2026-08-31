import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SetupWizard from './setup-wizard'

export default async function SetupWizardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const [categories, productCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.count({ where: { businessId: session.user.business.id } }),
  ])

  const categoriesList = categories.map((c) => c.name)

  return (
    <SetupWizard
      businessId={session.user.business.id}
      businessName={session.user.business.name}
      categories={categoriesList}
      existingProducts={productCount}
    />
  )
}
