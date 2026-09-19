import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExpensesPage from '@/components/expenses/expenses-page'

export default async function ExpensesServerPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const businessId = session.user.business.id

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <ExpensesPage
      initialExpenses={expenses}
      categories={categories}
    />
  )
}
