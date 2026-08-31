import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TargetsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
  })

  const targets = [
    { title: 'Target Omzet Bulanan', current: business?.targetOmzet ? business.targetOmzet * 0.875 : 17500000, target: business?.targetOmzet || 20000000, unit: 'Rp' },
    { title: 'Target Laba Bulanan', current: business?.targetLaba ? business.targetLaba * 0.84 : 4200000, target: business?.targetLaba || 5000000, unit: 'Rp' },
    { title: 'Target Transaksi', current: business?.targetTransaksi ? Math.round(business.targetTransaksi * 0.78) : 78, target: business?.targetTransaksi || 100, unit: 'transaksi' },
    { title: 'Target Pertumbuhan', current: business?.targetGrowth ? business.targetGrowth * 0.6 : 12, target: business?.targetGrowth || 20, unit: '%' },
  ]

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Decision tool</p>
          <h1 className="page-title">Profit Simulator</h1>
          <p className="mt-1 text-sm text-muted-foreground">Test a pricing move before you make it in the real world.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Scenario</p>
              <h2 className="section-title">Hoodie Basic</h2>
            </div>
            <div className="product-swatch bg-slate-400">
              <span>H</span>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-7">
            <div>
              <div className="flex justify-between text-sm">
                <span>Discount</span>
                <strong>20%</strong>
              </div>
              <div className="mt-4 w-full rounded-lg bg-muted h-2">
                <div className="bg-accent h-2 rounded-lg" style={{ width: '40%' }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="sim-stat">
                <span>Original price</span>
                <strong>Rp169.900</strong>
              </div>
              <div className="sim-stat">
                <span>New price</span>
                <strong>Rp135.920</strong>
              </div>
              <div className="sim-stat">
                <span>Cost</span>
                <strong>Rp85.000</strong>
              </div>
              <div className="sim-stat">
                <span>Profit</span>
                <strong className="text-accent-foreground">Rp50.920</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="panel flex flex-col justify-between bg-primary text-primary-foreground">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <span className="text-sm">?</span>
              <span className="eyebrow text-accent">AI recommendation</span>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">
              Still profitable.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">
              A 20% discount leaves you with a 37.5% margin. This can help reduce excess inventory while protecting your contribution profit.
            </p>
          </div>
          <div className="mt-8 flex items-end justify-between border-t border-primary-foreground/15 pt-5">
            <div>
              <p className="text-xs text-primary-foreground/60">
                Profit margin
              </p>
              <p className="mt-1 text-3xl font-semibold">
                37.5%
              </p>
            </div>
            <span className="badge-lime">
              <span className="mr-1">?</span> Good move
            </span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {targets.map((t) => {
          const progress = Math.min((t.current / t.target) * 100, 100)
          return (
            <div className="metric-card" key={t.title}>
              <p className="text-xs text-muted-foreground">{t.title}</p>
              <p className="mt-3 text-2xl font-semibold">
                {t.unit === 'Rp' ? `Rp ${Math.round(t.current).toLocaleString('id-ID')}` : `${Math.round(t.current)} ${t.unit}`}
              </p>
              <div className="mt-3 w-full rounded-full bg-muted h-2">
                <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Target: {t.unit === 'Rp' ? `Rp ${t.target.toLocaleString('id-ID')}` : `${t.target} ${t.unit}`}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
