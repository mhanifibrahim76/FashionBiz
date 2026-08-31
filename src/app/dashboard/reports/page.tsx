import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReportsPage } from '@/components/reports/reports-page'

export default async function ReportsRoutePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
    select: { onboarded: true },
  })
  if (!business?.onboarded) redirect('/dashboard/setup-wizard')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: session.user.business.id, date: { gte: thirtyDaysAgo } },
      select: { total: true },
    }),
    prisma.expense.findMany({
      where: { businessId: session.user.business.id, date: { gte: thirtyDaysAgo } },
      select: { amount: true },
    }),
  ])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <ReportsPage
      initialData={{
        totalRevenue,
        totalExpenses,
      }}
    />
  )
}
