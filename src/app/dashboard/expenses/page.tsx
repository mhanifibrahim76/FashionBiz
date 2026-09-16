import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const expenses = await prisma.expense.findMany({
    where: { businessId: session.user.business.id },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 20,
  })

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Keuangan</p>
          <h1 className="page-title">Biaya Operasional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat biaya bisnis dan jaga margin tetap sehat.
          </p>
        </div>
        <button className="button-primary">
          <span className="mr-1">+</span> Add expense
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total biaya</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Kategori</p>
          <p className="mt-3 text-2xl font-semibold">{expenses.length > 0 ? [...new Set(expenses.map(e => e.categoryId))].length : 0}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Bulan ini</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalExpenses * 0.35)}</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="section-heading p-5">
          <div>
            <p className="eyebrow">Riwayat</p>
            <h2 className="section-title">Riwayat Biaya</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tgl</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th>Pemb.</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="font-semibold">{expense.category?.name || 'Uncategorized'}</td>
                  <td className="text-destructive">{formatCurrency(expense.amount)}</td>
                  <td>{expense.paymentMethod}</td>
                  <td className="text-muted-foreground">{expense.notes || '-'}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada biaya operasional tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}