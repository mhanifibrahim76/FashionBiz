import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const purchases = await prisma.purchase.findMany({
    where: { businessId: session.user.business.id },
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { date: 'desc' },
    take: 20,
  })

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0)

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Procurement</p>
          <h1 className="page-title">Purchases</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track supplier orders and payment status.</p>
        </div>
        <button className="button-primary">
          <span className="mr-1">+</span> New purchase
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total purchases</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="mt-3 text-2xl font-semibold">{purchases.filter(p => p.status === 'PENDING').length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-3 text-2xl font-semibold">{purchases.filter(p => p.status === 'COMPLETED').length}</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="section-heading p-5">
          <div>
            <p className="eyebrow">Orders</p>
            <h2 className="section-title">Purchase history</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{new Date(purchase.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="font-semibold">{purchase.supplier?.name || 'Unknown'}</td>
                  <td>{purchase.items.length} products</td>
                  <td>{formatCurrency(purchase.total)}</td>
                  <td>
                    <span className={`status-badge ${purchase.status === 'COMPLETED' ? 'status-good' : purchase.status === 'PENDING' ? 'status-warn' : 'status-risk'}`}>
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No purchases recorded yet.
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
