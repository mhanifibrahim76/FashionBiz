import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const suppliers = await prisma.supplier.findMany({
    where: { businessId: session.user.business.id },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Network</p>
          <h1 className="page-title">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your supplier relationships and procurement.</p>
        </div>
        <button className="button-primary">
          <span className="mr-1">+</span> Add supplier
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <div className="panel" key={supplier.id}>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-muted text-lg">
                ??
              </div>
              <div>
                <h3 className="font-semibold">{supplier.name}</h3>
                <p className="text-xs text-muted-foreground">{supplier.address || 'No address'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contact</span>
                <span className="font-medium">{supplier.contact || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{supplier.productsSupplied?.join(', ') || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total purchases</span>
                <span className="font-medium">{formatCurrency(supplier.totalPurchases || 0)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="button-secondary text-xs flex-1">View orders</button>
              <button className="button-primary text-xs flex-1">Contact</button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="panel text-center py-8 text-muted-foreground col-span-full">
            No suppliers added yet.
          </div>
        )}
      </div>
    </div>
  )
}
